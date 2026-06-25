import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SeoPage } from "@/components/seo/SeoPage";

// Phase 4 — defamation / privacy / takedown route.
// Public surface (URL is sharable) but noindex: takedown intake should not
// itself appear in search results. Submissions are intentionally simple —
// they email the trust contact; no DB writes here.
export const Route = createFileRoute("/report")({
  head: () => {
    const url = "/report";
    const title = "report a room — shutap";
    const description =
      "Privacy, defamation, and safety reports. Real names and identifying details get removed fast.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ReportPage,
});

const REASONS = [
  "contains my real name or identifying details",
  "names someone else who didn't consent",
  "defamatory or factually false claim about an identifiable person",
  "minor or vulnerable person depicted",
  "doxxing / contact info",
  "other privacy or safety concern",
] as const;

function ReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [url, setUrl] = useState("");
  const [details, setDetails] = useState("");

  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            report a room
          </h1>
          <p className="text-muted-foreground">
            we take privacy and defamation reports seriously. most takedowns
            resolve within 24–48 hours. you don't have to be the person mentioned
            to file one.
          </p>
        </header>

        {submitted ? (
          <div className="rounded-lg border border-border p-5">
            <p className="font-medium">thanks — we've got it.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              a human reviews every report. if it's a clear privacy or safety
              issue, the content is removed immediately while we investigate.
            </p>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              // Hand off to trust@ via mailto — no DB writes from a public unauth surface.
              const body = encodeURIComponent(
                `Reason: ${reason}\nURL: ${url}\n\nDetails:\n${details}`,
              );
              window.location.href = `mailto:trust@shutap.app?subject=${encodeURIComponent(
                "[shutap] report: " + reason,
              )}&body=${body}`;
              setSubmitted(true);
            }}
          >
            <label className="block space-y-1">
              <span className="text-sm font-medium">reason</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">URL of the content</span>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">details</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                placeholder="what's the issue? if you're the person referenced, say so — we fast-track those."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>

            <button
              type="submit"
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              submit report
            </button>

            <p className="text-xs text-muted-foreground">
              you can also email{" "}
              <a href="mailto:trust@shutap.app" className="underline">
                trust@shutap.app
              </a>{" "}
              directly.
            </p>
          </form>
        )}
      </article>
    </SeoPage>
  );
}
