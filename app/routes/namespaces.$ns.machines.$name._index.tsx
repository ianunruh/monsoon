import { Switch } from "@headlessui/react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useParams, useSearchParams } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import { zx } from "zodix";

import { useRevalidateOnInterval } from "~/hooks";
import { KubernetesClient } from "~/kubernetes.server";
import { requireUserSession } from "~/session.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { ns, name } = zx.parseParams(params, {
    ns: z.string(),
    name: z.string(),
  });

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const machine = await client.getVirtualMachine({
    name,
    namespace: ns,
  });

  return typedjson({ machine });
}

export const meta: MetaFunction = () => {
  // TODO brand + project name?
  return [{ title: "Machines" }];
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Index() {
  const { machine } = useTypedLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();

  const [autoRefresh, setAutoRefresh] = useState(
    searchParams.get("refresh") === "true",
  );

  const { ns } = useParams();

  useRevalidateOnInterval({
    enabled: autoRefresh,
  });

  return (
    <main>
      <pre>{JSON.stringify(machine.status, null, 2)}</pre>
    </main>
  );
}
