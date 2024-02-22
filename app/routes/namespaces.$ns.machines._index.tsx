import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useParams, useSearchParams } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import { zx } from "zodix";

import { useRevalidateOnInterval } from "~/hooks";
import { KubernetesClient } from "~/kubernetes.server";
import { requireUserSession } from "~/session.server";
import { Switch } from "@headlessui/react";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { ns } = zx.parseParams(params, {
    ns: z.string(),
  });

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const machines = await client.listVirtualMachines({
    namespace: ns,
  });

  return typedjson({ machines });
}

export const meta: MetaFunction = () => {
  // TODO brand + project name?
  return [{ title: "Machines" }];
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Index() {
  const { machines } = useTypedLoaderData<typeof loader>();

  const [searchParams] = useSearchParams();

  const [autoRefresh, setAutoRefresh] = useState(
    searchParams.get("refresh") === "true",
  );

  const { ns } = useParams();

  useRevalidateOnInterval({
    enabled: autoRefresh,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Machines
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of virtual machines deployed in the selected namespace.
          </p>
        </div>
        <div className="mt-4 sm:ml-8 sm:mt-0 sm:flex-none">
          <Switch.Group as="div" className="flex items-center">
            <Switch
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className={classNames(
                autoRefresh ? "bg-indigo-600" : "bg-gray-200",
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
              )}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  autoRefresh ? "translate-x-5" : "translate-x-0",
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                )}
              />
            </Switch>
            <Switch.Label as="span" className="ml-3 text-sm cursor-pointer">
              <span className="font-medium text-gray-900">Auto-refresh</span>
            </Switch.Label>
          </Switch.Group>
        </div>
        <div className="mt-4 sm:ml-8 sm:mt-0 sm:flex-none">
          <Link
            to={`/namespaces/${ns}/machines/new`}
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create machine
          </Link>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      IP Address
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {machines.items.map((machine) => (
                    <tr key={machine.metadata.name}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {machine.metadata.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {
                          machine.metadata.annotations?.[
                            "monsoon.ianunruh.com/ipv4Address"
                          ]
                        }
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {/*
                        Terminating
                        Provisioning
                        Running */}
                        {machine.status?.printableStatus || "Pending"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {machine.metadata.creationTimestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
