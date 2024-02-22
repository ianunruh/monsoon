import { config } from "./config.server";
import type {
  KubernetesEvent,
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

  async listEvents(
    opts: NamespaceListOptions,
  ): Promise<KubernetesList<KubernetesEvent>> {
    return this.getJSON(`/api/v1/namespaces/${opts.namespace}/events`, opts);
  }

  async createVirtualMachine(
    vm: VirtualMachine,
    opts: NamespaceCreateOptions,
  ): Promise<VirtualMachine> {
    return this.createJSON(
      `/apis/kubevirt.io/v1/namespaces/${opts.namespace}/virtualmachines`,
      vm,
      opts,
    );
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
    if (resp.status < 200 || resp.status >= 300) {
      throw resp;
    }
    return resp.json();
  }

  async createJSON<T>(
    path: string,
    item: any,
    opts: CreateOptions,
  ): Promise<T> {
    const body = JSON.stringify(item, null, 2);
    const resp = await fetch(`${config.kubeURL}${path}`, {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ["Content-Type"]: "application/json",
      },
    });
    if (resp.status < 200 || resp.status >= 300) {
      throw resp;
    }
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

export interface Namespaced {
  namespace: string;
}

export interface NamespaceListOptions extends ListOptions, Namespaced {}

export interface ListOptions {
  limit?: number;
  labelSelector?: string;
}

export interface NamespaceCreateOptions extends CreateOptions, Namespaced {}

export interface CreateOptions {}
