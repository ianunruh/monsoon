import { createContext } from "react";

import { Namespace } from "./kubernetes-types";

export interface NamespaceContextType {
  currentNamespace: string;
  namespaces: Namespace[];
}

export const NamespaceContext = createContext<NamespaceContextType>({
  currentNamespace: "",
  namespaces: [],
});
