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
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-6 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>shutap. speak up.</span>
            <div className="flex flex-wrap gap-4">
              <Link to="/about" className="hover:text-foreground">about</Link>
              <Link to="/methodology" className="hover:text-foreground">methodology</Link>
              <Link to="/trust" className="hover:text-foreground">trust</Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-border pt-3">
            <Link to="/terms" className="hover:text-foreground">terms</Link>
            <Link to="/privacy" className="hover:text-foreground">privacy</Link>
            <Link to="/guidelines" className="hover:text-foreground">guidelines</Link>
            <Link to="/safety" className="hover:text-foreground">safety</Link>
            <Link to="/ai-disclosure" className="hover:text-foreground">ai disclosure</Link>
            <Link to="/report" className="hover:text-foreground">report</Link>
            <Link to="/contact" className="hover:text-foreground">contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
