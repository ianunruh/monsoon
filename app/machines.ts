import { VirtualMachine } from "./kubernetes-types";

export interface BuildMachineOptions {
  name: string;
  size: string;
  rootDiskSize: number;
  sourcePVCName: string;
  ipv4Address: string;
  ipv4Gateway: string;
  sshKey: string;
}

export function buildMachine({
  name,
  rootDiskSize,
  sourcePVCName,
  size,
  ipv4Address,
  ipv4Gateway,
  sshKey,
}: BuildMachineOptions): VirtualMachine {
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

  return {
    apiVersion: "kubevirt.io/v1",
    kind: "VirtualMachine",
    metadata: {
      name,
      annotations,
    },
    spec: {
      running: true,
      instancetype: {
        name: size,
        kind: "VirtualMachineClusterInstancetype",
      },
      preference: {
        name: "ubuntu",
        kind: "VirtualMachineClusterPreference",
      },
      template: {
        metadata: {
          labels,
        },
        spec: {
          domain: {
            devices: {
              interfaces: [
                {
                  name: "default",
                  bridge: {},
                },
              ],
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
}
