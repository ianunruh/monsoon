import { createContext } from "react";

import { Namespace } from "./kubernetes-types";

export interface NamespaceContextType {
  currentNamespace: string;
  namespaces: Namespace[];
  kubeURL: string;
}

export const NamespaceContext = createContext<NamespaceContextType>({
  currentNamespace: "",
  namespaces: [],
  kubeURL: "",
});
