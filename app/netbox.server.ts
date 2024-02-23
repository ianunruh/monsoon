import { config } from "./config.server";

export interface Prefix {
  id: number;
  custom_fields: {
    gateway?: IPAddress;
    monsoon_pool?: string;
  };
}

export interface IPAddress {
  address: string;
  description?: string;
}

interface AvailableIP {
  address: string;
}

export async function findPrefix(): Promise<Prefix> {
  const prefixes = await listPrefixes();

  const prefix = prefixes.results.find(
    (prefix) => prefix.custom_fields.monsoon_pool === "external",
  );
  if (!prefix) {
    throw new Error("no prefix found in Netbox with monsoon_pool external");
  }

  return prefix;
}

export async function reserveIPAddress(
  prefix: number,
  description: string,
): Promise<string> {
  const availableIPs = await getAvailableIPs(prefix);
  if (availableIPs.length === 0) {
    throw new Error("no available IPs in Netbox prefix");
  }

  const { address } =
    availableIPs[Math.floor(Math.random() * availableIPs.length)];

  await createIPAddress({
    address,
    description,
  });

  return address;
}

async function listPrefixes(): Promise<NetboxList<Prefix>> {
  return getJSON("/api/ipam/prefixes/");
}

async function getAvailableIPs(prefix: number): Promise<AvailableIP[]> {
  return getJSON(`/api/ipam/prefixes/${prefix}/available-ips`);
}

async function createIPAddress(address: IPAddress): Promise<AvailableIP> {
  return createJSON("/api/ipam/ip-addresses/", address);
}

async function createJSON<T>(path: string, item: any): Promise<T> {
  const body = JSON.stringify(item, null, 2);
  const resp = await fetch(`${config.netboxURL}${path}`, {
    method: "POST",
    body,
    headers: {
      Authorization: `Token ${config.netboxToken}`,
      ["Content-Type"]: "application/json",
    },
  });
  if (resp.status < 200 || resp.status >= 300) {
    throw resp;
  }
  return resp.json();
}

async function getJSON<T>(path: string): Promise<T> {
  const resp = await fetch(`${config.netboxURL}${path}`, {
    headers: {
      Authorization: `Token ${config.netboxToken}`,
    },
  });
  if (resp.status < 200 || resp.status >= 300) {
    throw resp;
  }
  return resp.json();
}

interface NetboxList<T> {
  count: number;
  results: T[];
}
