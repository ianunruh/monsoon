export interface KubernetesList<T extends KubernetesObject> {
  items: T[];
}

export interface KubernetesObject {
  metadata: {
    name: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
}

export interface Namespace extends KubernetesObject {}

export interface VirtualMachine extends KubernetesObject {}
