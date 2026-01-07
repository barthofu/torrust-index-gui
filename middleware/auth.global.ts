export default defineNuxtRouteMiddleware((to) => {
  // Whitelist routes that must remain accessible without auth
  const whitelist = new Set([
    "/signin",
    "/oidc-callback"
  ]);

  // Access runtime config and user/token state
  const apiBase = (useRuntimeConfig().public.apiBase || "").replace(/\/+$/, "");
  const hasToken = Boolean(useRestApi().value.authToken);
  const hasUser = Boolean(useUser().value);

  // Allow whitelisted routes
  if (whitelist.has(to.path)) {
    return;
  }

  // If not authenticated, redirect to backend OIDC login
  if (!hasToken && !hasUser) {
    if (process.client) {
      window.location.href = `${apiBase}/user/oidc/login`;
    }
    return abortNavigation();
  }
});
