import { config } from "./config.server";
import type {
  KubernetesList,
  Namespace,
  VirtualMachine,
} from "./kubernetes-types";

export class KubernetesClient {
  token: string;

  constructor(token: string) {
    this.token = token;
  }

  async listNamespaces(
    opts: ListOptions = {},
  ): Promise<KubernetesList<Namespace>> {
    return this.getJSON("/api/v1/namespaces", opts);
  }

  async listVirtualMachines(
    opts: NamespaceListOptions,
  ): Promise<KubernetesList<VirtualMachine>> {
    return this.getJSON(
      `/apis/kubevirt.io/v1/namespaces/${opts.namespace}/virtualmachines`,
      opts,
    );
  }

  async getJSON<T>(path: string, opts: ListOptions): Promise<T> {
    const params = buildSearchParams(opts);
    const resp = await fetch(`${config.kubeURL}${path}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return resp.json();
  }
}

function buildSearchParams({
  limit,
  labelSelector,
}: ListOptions): URLSearchParams {
  const params = new URLSearchParams();

  if (limit) {
    params.set("limit", String(limit));
  }
  if (labelSelector) {
    params.set("labelSelector", labelSelector);
  }

  return params;
}

export interface NamespaceListOptions extends ListOptions {
  namespace: string;
}

export interface ListOptions {
  limit?: number;
  labelSelector?: string;
}
