import { redirect } from "remix-typedjson";

export async function loader() {
  return redirect("/namespaces");
}
