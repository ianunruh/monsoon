import type { LoaderFunction } from "@remix-run/node";
import { logoutUser } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await logoutUser(request);
};

export default function Logout() {
  // TODO render errors
}
