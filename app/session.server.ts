import jwt from "jsonwebtoken";
import { Issuer, generators } from "openid-client";
import type { Client } from "openid-client";
import { createCookieSessionStorage, redirect } from "@remix-run/node";

import { config } from "./config.server";

export async function requireUserSession(request: Request) {
  const client = await getClient();
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  if (!session.has("access_token")) {
    const codeVerifier = generators.codeVerifier();
    session.set("code_verifier", codeVerifier);
    session.set("return_to", request.url);

    const authURL = client.authorizationUrl({
      scope: "openid email profile groups",
      audience: config.oidcAudience,
      code_challenge: generators.codeChallenge(codeVerifier),
      code_challenge_method: "S256",
    });

    throw redirect(authURL, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }

  return {
    user: session.get("user"),
    id_token: session.get("id_token"),
  };
}

export async function authorizeUser(request: Request) {
  const client = await getClient();
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const codeVerifier = session.get("code_verifier");

  if (!codeVerifier) {
    throw new Error("missing code_verifier from session");
  }

  const { code } = client.callbackParams(request.url);

  const tokenSet = await client.callback(
    `${config.oidcRedirectBase}/auth/callback`,
    { code },
    { code_verifier: codeVerifier },
  );

  if (tokenSet.access_token) {
    session.set("access_token", tokenSet.access_token);
    session.set("id_token", tokenSet.id_token);

    session.set("user", jwt.decode(tokenSet.access_token));
  }

  let returnTo = "/";
  if (session.has("return_to")) {
    returnTo = session.get("return_to");
    session.unset("return_to");
  }

  throw redirect(returnTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function logoutUser(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  throw redirect("/auth/logout/success", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

let client: Client;

async function getClient(): Promise<Client> {
  if (client) {
    return client;
  }

  const issuer = await Issuer.discover(config.oidcIssuer);
  client = new issuer.Client({
    client_id: config.oidcClientID,
    client_secret: config.oidcClientSecret,
    redirect_uris: [`${config.oidcRedirectBase}/auth/callback`],
    response_types: ["code"],
  });
  return client;
}

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "monsoon-session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [config.sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});
