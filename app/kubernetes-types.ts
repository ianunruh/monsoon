export interface KubernetesList<T extends KubernetesObject> {
  items: T[];
}

export interface KubernetesObject {
  metadata: {
    name: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    creationTimestamp?: string;
  };
}

export interface Namespace extends KubernetesObject {}

export interface VirtualMachine extends KubernetesObject {
  status: {
    printableStatus: string;
  };
}

export interface KubernetesEvent extends KubernetesObject {
  lastTimestamp: string;
  type: string;
  reason: string;
  message: string;
  involvedObject: {
    kind: string;
    name: string;
  };
}
