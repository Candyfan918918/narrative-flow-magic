import { Helmet } from "react-helmet-async";

/** Belt-and-suspenders noindex for private/app SPA routes.
 * robots.txt is the primary control; this catches crawlers that
 * fetch the JS-rendered page anyway. */
export function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
}
