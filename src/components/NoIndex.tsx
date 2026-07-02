import { useEffect } from "react";

/** Belt-and-suspenders noindex for private/app SPA routes.
 * robots.txt is the primary control; this catches crawlers that
 * execute JS and fetch the SPA-rendered page anyway.
 *
 * Implemented as an effect so callers can invoke it without touching
 * JSX structure — safe alongside iframe-only pages and multi-return
 * components. Idempotent: reuses an existing tag if the SPA has
 * already mounted one for a sibling route. */
export function useNoIndex() {
  useEffect(() => {
    const CONTENT = "noindex,nofollow";
    let tag = document.querySelector<HTMLMetaElement>(
      'meta[name="robots"][data-shutap-noindex]',
    );
    let created = false;
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "robots");
      tag.setAttribute("data-shutap-noindex", "1");
      created = true;
    }
    const prev = tag.getAttribute("content");
    tag.setAttribute("content", CONTENT);
    if (created) document.head.appendChild(tag);
    return () => {
      if (created) {
        tag?.parentNode?.removeChild(tag);
      } else if (prev != null) {
        tag?.setAttribute("content", prev);
      }
    };
  }, []);
}

export function NoIndex() {
  useNoIndex();
  return null;
}
