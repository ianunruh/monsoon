import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useContext } from "react";
import { redirect, typedjson } from "remix-typedjson";
import { Link } from "@remix-run/react";
import { z } from "zod";
import { zx } from "zodix";

import { KubernetesClient } from "~/kubernetes.server";
import { NamespaceContext } from "~/namespaces";
import { requireUserSession } from "~/session.server";

const formSchema = z.object({
  name: z.string(),
  sourcePVCName: z.string(),
  cores: z.coerce.number(),
  memory: z.coerce.number(),
  rootDiskSize: z.coerce.number(),
  ipv4Address: z.string(),
  ipv4Gateway: z.string(),
  sshKey: z.string(),
});

export async function loader({ request, params }: ActionFunctionArgs) {
  const { ns } = zx.parseParams(params, {
    ns: z.string(),
  });

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  // TODO load vm images
  // TODO load vm instance types
  // TODO load ssh keys

  return typedjson({});
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { ns } = zx.parseParams(params, {
    ns: z.string(),
  });

  const {
    name,
    rootDiskSize,
    sourcePVCName,
    cores,
    memory,
    ipv4Address,
    ipv4Gateway,
    sshKey,
  } = await zx.parseForm(request, formSchema);

  const session = await requireUserSession(request);

  const client = new KubernetesClient(session.id_token);

  const labels = {
    "kubevirt.io/vm": name,
  };

  const annotations = {
    "monsoon.ianunruh.com/ipv4Address": ipv4Address.split("/")[0],
  };

  const networkData = `version: 2
ethernets:
    enp1s0:
        addresses:
            - ${ipv4Address}
        routes:
            - to: default
              via: ${ipv4Gateway}
        nameservers:
            addresses:
                - 1.1.1.1
                - 1.0.0.1`;

  const userData = `#cloud-config
ssh_authorized_keys:
- ${sshKey}`;

  const newVM = {
    apiVersion: "kubevirt.io/v1",
    kind: "VirtualMachine",
    metadata: {
      name,
      annotations,
    },
    spec: {
      running: true,
      template: {
        metadata: {
          labels,
        },
        spec: {
          domain: {
            cpu: {
              cores,
            },
            devices: {
              disks: [
                {
                  name: "root",
                  disk: {
                    bus: "virtio",
                  },
                },
                {
                  name: "cloudinit",
                  disk: {
                    bus: "virtio",
                  },
                },
              ],
              interfaces: [
                {
                  name: "default",
                  bridge: {},
                },
              ],
            },
            resources: {
              requests: {
                memory: `${memory}Gi`,
              },
            },
          },
          networks: [
            {
              name: "default",
              multus: {
                networkName: "bridge-external",
              },
            },
          ],
          volumes: [
            {
              name: "root",
              dataVolume: {
                name,
              },
            },
            {
              name: "cloudinit",
              cloudInitNoCloud: {
                networkData,
                userData,
              },
            },
          ],
        },
      },
      dataVolumeTemplates: [
        {
          metadata: {
            name,
            labels,
          },
          spec: {
            pvc: {
              accessModes: ["ReadWriteOnce"],
              resources: {
                requests: {
                  storage: `${rootDiskSize}Gi`,
                },
              },
              volumeMode: "Block",
            },
            source: {
              pvc: {
                name: sourcePVCName,
                namespace: "vm-images",
              },
            },
          },
        },
      ],
    },
  };

  const vm = await client.createVirtualMachine(newVM, { namespace: ns });

  return redirect(`/namespaces/${ns}/machines/${name}?refresh=true`);
}

export const meta: MetaFunction = () => {
  // TODO brand + project name?
  return [{ title: "New Machine" }];
};

export default function New() {
  const { currentNamespace } = useContext(NamespaceContext);

  return (
    <form method="post">
      <div className="space-y-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Machine
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Basic details about the new virtual machine.
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-gray-900/10 pb-12 md:grid-cols-3">
          <div>
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Resources
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Control the compute and storage resources allocated to the new
              virtual machine.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <label
                htmlFor="cores"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                CPU Cores
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="cores"
                    id="cores"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    defaultValue="1"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="memory"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Memory (GB)
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="memory"
                    id="memory"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    defaultValue="1"
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
              Access
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Control how the virtual machine is accessed.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-6 md:col-span-2">
            <div className="sm:col-span-4">
              <label
                htmlFor="ipv4Address"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                IPv4 Address
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="ipv4Address"
                    id="ipv4Address"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="74.82.62.2/27"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-4">
              <label
                htmlFor="ipv4Gateway"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                IPv4 Gateway
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    name="ipv4Gateway"
                    id="ipv4Gateway"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1.5 font-mono text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="74.82.62.1"
                    required
                  />
                </div>
              </div>
            </div>
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
