import sortBy from "lodash/sortBy.js";
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useContext } from "react";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { promiseHash } from "remix-utils/promise";
import { Link } from "@remix-run/react";
import { z } from "zod";
import { zx } from "zodix";

import { KubernetesClient } from "~/kubernetes.server";
import { buildMachine } from "~/machines";
import { NamespaceContext } from "~/namespaces";
import { requireUserSession } from "~/session.server";
import { PersistentVolumeClaim } from "~/kubernetes-types";
import { findPrefix, reserveIPAddress } from "~/netbox.server";

const formSchema = z.object({
  name: z.string(),
  sourcePVCName: z.string(),
  rootDiskSize: z.coerce.number(),
  size: z.string(),
  sshKey: z.string(),
});

export async function loader({ request, params }: ActionFunctionArgs) {
  const { ns } = zx.parseParams(params, {
    ns: z.string(),
  });

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  // TODO load ssh keys

  return typedjson(
    await promiseHash({
      images: client.listPersistentVolumeClaims({
        namespace: "vm-images",
        labelSelector: "monsoon.ianunruh.com/enabled=true",
      }),
      sizes: client.listVirtualMachineClusterInstancetypes(),
    }),
  );
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { ns } = zx.parseParams(params, {
    ns: z.string(),
  });

  const { name, ...values } = await zx.parseForm(request, formSchema);

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const prefix = await findPrefix();
  const ipv4Gateway = prefix.custom_fields.gateway;
  if (!ipv4Gateway || !ipv4Gateway.address) {
    throw new Error("prefix missing IPv4 gateway address");
  }

  const ipv4Address = await reserveIPAddress(prefix.id, `${ns}/${name}`);

  const newVM = buildMachine({
    ...values,
    name,
    ipv4Address,
    ipv4Gateway: ipv4Gateway.address.split("/")[0],
  });

  const vm = await client.createVirtualMachine(newVM, { namespace: ns });

  return redirect(
    `/namespaces/${ns}/machines/${vm.metadata.name}?refresh=true`,
  );
}

export const meta: MetaFunction = () => {
  // TODO brand + project name?
  return [{ title: "New Machine" }];
};

export default function New() {
  const { images, sizes } = useTypedLoaderData<typeof loader>();

  const { currentNamespace } = useContext(NamespaceContext);

  const sortedSizes = sortBy(sizes.items, [
    ({ metadata }) => parseInt(metadata.labels["instancetype.kubevirt.io/cpu"]),
    ({ metadata }) =>
      parseInt(
        metadata.labels["instancetype.kubevirt.io/memory"].replace("Gi", ""),
      ),
  ]);

  return (
    <form method="post">
      <div className="space-y-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Machine
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Basic details about the virtual machine.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6 md:col-span-2">
            <div className="col-span-full">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Name
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="block w-full border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="minecraft"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Image
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Select the OS image used to build the virtual machine.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <label
                htmlFor="sourcePVCName"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Source PVC name
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="sourcePVCName"
                    id="sourcePVCName"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    defaultValue="ubuntu-server-jammy-amd64"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="rootDiskSize"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Root Disk Size (GB)
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="rootDiskSize"
                    id="rootDiskSize"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    defaultValue="100"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Size
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Control the compute resources allocated to the virtual machine.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <SizeSelect sizes={sortedSizes} defaultSize="u1.small" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Access
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Control how the virtual machine is accessed.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <label
                htmlFor="sshKey"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                SSH Key
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="sshKey"
                    id="sshKey"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHMsUKLPMO0vtVv6Rnd2ZzwX6rZDNkWFdEuOJJAX3tgj foo@example.com"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Link
          to={`/namespaces/${currentNamespace}/machines`}
          type="button"
          className="text-sm font-semibold leading-6 text-gray-900"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Create machine
        </button>
      </div>
    </form>
  );
}

function SizeSelect({
  sizes,
  defaultSize,
}: {
  sizes: PersistentVolumeClaim[];
  defaultSize: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Plan</legend>
      <div className="space-y-5">
        {sizes.map(({ metadata }) => (
          <div key={metadata.name} className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id={metadata.name}
                aria-describedby={`${metadata.name}-description`}
                name="size"
                type="radio"
                value={metadata.name}
                defaultChecked={metadata.name === defaultSize}
                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label
                htmlFor={metadata.name}
                className="font-medium text-gray-900"
              >
                {metadata.name}
              </label>{" "}
              <span
                id={`${metadata.name}-description`}
                className="text-gray-500"
              >
                {metadata.labels["instancetype.kubevirt.io/cpu"]} CPU
                {" / "}
                {metadata.labels["instancetype.kubevirt.io/memory"].replace(
                  "Gi",
                  "GB",
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
