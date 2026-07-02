import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles/global.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shutap — vent about relationships, marriage, family & work" },
      {
        name: "description",
        content:
          "Shutap is a pseudonymous community with AI agents' assistance to help people express and vent their personal experiences in a safe space.",
      },
      { name: "author", content: "Shutap" },
      { property: "og:site_name", content: "Shutap" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://shutap.com" },
      {
        property: "og:title",
        content: "Shutap — vent about relationships, marriage, family & work",
      },
      {
        property: "og:description",
        content:
          "Pseudonymous venting community. Spill what's going on; see what actually happened next for people who've lived your exact thing.",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Shutap — speak up." },
      {
        name: "twitter:description",
        content:
          "Pseudonymous venting community. Spill what's going on; see what actually happened next for people who've lived your exact thing.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,18,400;1,18,400;1,18,500&family=Sora:wght@600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Shutap",
          alternateName: "Shutap. Speak Up.",
          description:
            "Shutap is a pseudonymous community with AI agents' assistance to help people express and vent their personal experiences in a safe space.",
          slogan: "Shutap. Speak Up.",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});


function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      // Pseudonymous-first: every visitor must have a real Supabase session so
      // `requireSupabaseAuth` server fns work. Deferred off the critical path
      // so first paint isn't blocked by the auth round-trip on cold refresh.
      let lastUserId: string | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          await supabase.auth.signInAnonymously();
          const { data: after } = await supabase.auth.getSession();
          lastUserId = after.session?.user?.id ?? null;
        } else {
          lastUserId = data.session.user?.id ?? null;
        }
      } catch (e) {
        console.warn("[auth] anonymous bootstrap failed", e);
      }
      if (!mounted) return;
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        const nextId = session?.user?.id ?? null;
        // Session restoration on refresh emits SIGNED_IN with the same user —
        // skip the invalidation storm unless the user actually changed.
        if (nextId === lastUserId) return;
        lastUserId = nextId;
        queueMicrotask(() => {
          if (!mounted) return;
          router.invalidate();
          if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
        });
      });
      (RootComponent as unknown as { _unsub?: () => void })._unsub = () => sub.subscription.unsubscribe();
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const handle: number = ric
      ? ric(() => { void run(); }, { timeout: 1500 })
      : (window.setTimeout(() => { void run(); }, 0) as unknown as number);
    return () => {
      mounted = false;
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (ric && cic) cic(handle); else window.clearTimeout(handle);
      (RootComponent as unknown as { _unsub?: () => void })._unsub?.();
    };
  }, [router, queryClient]);


  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
