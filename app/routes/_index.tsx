import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { KubernetesClient } from "~/kubernetes.server";
import { requireUserSession } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const namespaces = await client.listNamespaces();
  const machines = await client.listVirtualMachines({
    namespace: "monsoon-test",
  });

  return typedjson({ session, namespaces, machines });
}

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const { namespaces, machines } = useTypedLoaderData<typeof loader>();

  return (
    <main>
      <h1 className="text-3xl font-bold underline">Hello world!</h1>
      <pre>
        {JSON.stringify(
          namespaces.items.map((namespace) => namespace.metadata.name),
          null,
          2,
        )}
      </pre>
      <pre>
        {JSON.stringify(
          machines.items.map((machine) => machine.metadata.name),
          null,
          2,
        )}
      </pre>
    </main>
  );
}
