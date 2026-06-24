import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Minimal SSR-rendered shell for content/SEO pages.
 * Lowercase chrome per brand voice. No slang in nav/footer — that's evergreen UI.
 */
export function SeoPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 text-sm">
          <Link to="/" className="font-semibold tracking-tight">
            shutap
          </Link>
          <div className="flex gap-5 text-muted-foreground">
            <Link to="/relationships" className="hover:text-foreground">
              relationships
            </Link>
            <Link to="/marriage" className="hover:text-foreground">
              marriage
            </Link>
            <Link to="/family" className="hover:text-foreground">
              family
            </Link>
            <Link to="/career" className="hover:text-foreground">
              career
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground">
          <span>shutap. speak up.</span>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-foreground">
              about
            </Link>
            <Link to="/methodology" className="hover:text-foreground">
              methodology
            </Link>
            <Link to="/trust" className="hover:text-foreground">
              trust
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
