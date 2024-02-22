export const config = {
  sessionSecret: process.env.SESSION_SECRET || "",
  oidcIssuer: process.env.OIDC_ISSUER || "",
  oidcClientID: process.env.OIDC_CLIENT_ID || "",
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET || "",
  oidcAudience: process.env.OIDC_AUDIENCE || "",
  oidcRedirectBase: process.env.OIDC_REDIRECT_BASE || "",
  kubeURL: process.env.KUBE_URL || "",
  kubeNamespaceLabelSelector:
    process.env.KUBE_NS_LABEL_SELECTOR || "monsoon.ianunruh.com/enabled=true",
};
