import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { requireUserSession } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireUserSession(request);

  const kubeBaseURL = "https://kubernetes.den1.kcloud.zone:6443";

  const resp = await fetch(`${kubeBaseURL}/api/v1/namespaces?limit=500`, {
    headers: {
      Authorization: `Bearer ${session.id_token}`,
    },
  });

  const body = await resp.json();

  return { session, body };
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { body } = useLoaderData<typeof loader>();

  return (
    <main>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <pre>{JSON.stringify(body, null, 2)}</pre>
    </main>
  );
}
