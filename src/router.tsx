import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { initPostHog } from "./lib/posthog";
import { setRouterRef } from "./lib/router-ref";

// Fire PostHog init as early as possible on the client — before any routing.
if (typeof window !== "undefined") {
  void initPostHog();
}


export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Only expose on the client — the server creates a router per request and
  // must never share instances across requests.
  if (typeof window !== "undefined") {
    setRouterRef(router as unknown as Parameters<typeof setRouterRef>[0]);
  }

  return router;
};
