import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { z } from "zod";
import { zx } from "zodix";

import { KubernetesClient } from "~/kubernetes.server";
import { requireUserSession } from "~/session.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { ns } = zx.parseParams(params, {
    ns: z.string(),
  });

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const events = await client.listEvents({
    namespace: ns,
  });

  return typedjson({ events });
}

export const meta: MetaFunction = () => {
  // TODO brand + project name?
  return [{ title: "Events" }];
};

export default function Index() {
  const { events } = useTypedLoaderData<typeof loader>();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Events
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of recent events that have occurred in the selected
            namespace.
          </p>
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
                      Last Seen
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Reason
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Object
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {events.items.map((event) => (
                    <tr key={event.metadata.name}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {event.lastTimestamp}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {event.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {event.reason}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {event.involvedObject.kind} {event.involvedObject.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {event.message}
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