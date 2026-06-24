import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & privacy — Shutap" },
      {
        name: "description",
        content:
          "How Shutap protects your identity, what's public, and what stays private.",
      },
      { property: "og:title", content: "Trust & privacy — Shutap" },
      {
        property: "og:description",
        content:
          "How Shutap protects your identity, what's public, and what stays private.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/trust" },
    ],
    links: [{ rel: "canonical", href: "/trust" }],
  }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Trust &amp; privacy
          </h1>
          <p className="text-muted-foreground">
            This page is maintained by Shutap to answer common privacy and
            safety questions about how the community works.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your real name never shows</h2>
          <p className="leading-relaxed">
            You sign up with an email so we can recover your account. Inside
            Shutap, only your pseudonym is visible to other members. Your real
            name is never shown publicly and is not indexed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What gets indexed by search engines</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Pillar pages (relationships, marriage, family, career).</li>
            <li>Situation hubs ("is it normal to feel lonely in your marriage?").</li>
            <li>Outcome pages (aggregate, de-identified numbers).</li>
            <li>Pseudonym profiles (track record, not real identity).</li>
            <li>Selected rooms (only after the privacy shield runs).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What does not get indexed</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Rooms that name third parties before de-identification.</li>
            <li>Thin or near-duplicate rooms (canonicalized).</li>
            <li>Anything tying a pseudonym to a real identity.</li>
            <li>Account, settings, and signed-in surfaces.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Sensitive topics</h2>
          <p className="leading-relaxed">
            On rooms about abuse, self-harm, or legal jeopardy, Shutap surfaces
            free professional resources alongside the community. The companion
            never poses as a therapist or lawyer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Reporting and takedown</h2>
          <p className="leading-relaxed">
            Email{" "}
            <a href="mailto:trust@shutap.app" className="underline">
              trust@shutap.app
            </a>{" "}
            to report a story that names you or violates the rules. We act on
            named-third-party reports fast.
          </p>
        </section>
      </article>
    </SeoPage>
  );
}
