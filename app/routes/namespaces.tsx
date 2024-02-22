import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useParams } from "@remix-run/react";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";

import { config } from "~/config.server";
import { KubernetesClient } from "~/kubernetes.server";
import { requireUserSession } from "~/session.server";

import { AppLayout } from "~/components/layout/AppLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const namespaces = await client.listNamespaces({
    labelSelector: config.kubeNamespaceLabelSelector,
  });

  const url = new URL(request.url);
  if (url.pathname === "/namespaces" && namespaces.items.length > 0) {
    const namespace = namespaces.items[0];
    return redirect(`/namespaces/${namespace.metadata.name}/machines`);
  }

  return typedjson({ session, namespaces });
}

export default function Index() {
  const { session, namespaces } = useTypedLoaderData<typeof loader>();

  const { ns } = useParams();

  return (
    <AppLayout
      currentNamespace={ns}
      namespaces={namespaces.items}
      user={session.user}
    >
      <Outlet />
    </AppLayout>
  );
}
