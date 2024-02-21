import type { LoaderFunctionArgs } from "@remix-run/node";

import { authorizeUser } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authorizeUser(request);
}

export default function AuthCallback() {
  // TODO render errors
}
