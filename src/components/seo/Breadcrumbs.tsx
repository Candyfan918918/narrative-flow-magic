import { Link } from "@tanstack/react-router";
import type { Crumb } from "@/lib/seo/breadcrumbs";

/**
 * Visible breadcrumb trail that mirrors the BreadcrumbList JSON-LD emitted by
 * `breadcrumbScript`. Google wants the on-page hierarchy to match the markup,
 * so routes should render this with the same trail they pass to head().
 *
 * The last crumb is the current page and is not linked.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const items: Crumb[] = [{ name: "Home", path: "/" }, ...trail];
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontFamily: "Inter,system-ui,sans-serif",
        fontSize: 12,
        color: "#9e7a8c",
        margin: "0 0 14px",
      }}
    >
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.path} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {last ? (
                <span aria-current="page" style={{ color: "#6b4a5c" }}>
                  {c.name}
                </span>
              ) : (
                <Link
                  to={c.path as unknown as "/"}
                  style={{ color: "#9e7a8c", textDecoration: "none", borderBottom: "1px solid rgba(158,122,140,.35)" }}
                >
                  {c.name}
                </Link>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
