import { createFileRoute, redirect } from "@tanstack/react-router";

// /methodology was consolidated into /how-it-works to avoid two competing
// "how it works" pages in search. Permanent (301) redirect.
export const Route = createFileRoute("/methodology")({
  beforeLoad: () => {
    throw redirect({
      to: "/how-it-works",
      statusCode: 301,
      replace: true,
    });
  },
});
