import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology — how Shutap works" },
      {
        name: "description",
        content:
          "How Shutap collects stories, confirms outcomes, and handles sensitive content. Real people, no AI-written stories.",
      },
      { property: "og:title", content: "Methodology — how Shutap works" },
      {
        property: "og:description",
        content:
          "How Shutap collects stories, confirms outcomes, and handles sensitive content.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/methodology" },
    ],
    links: [{ rel: "canonical", href: "/methodology" }],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Methodology</h1>
          <p className="text-muted-foreground">
            How stories are written, how outcomes are confirmed, and how Shutap
            handles the heavy stuff.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Real people, no AI-written stories</h2>
          <p className="leading-relaxed">
            Every story on Shutap is written by a real person in their own
            words. We do not generate, paraphrase, or rewrite stories with AI.
            Tools that help (typo fixes, formatting) never change what was said.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Outcomes are confirmed, not assumed</h2>
          <p className="leading-relaxed">
            An "outcome" only counts when the original author updates their own
            story and confirms what actually happened. Aggregate numbers
            published on <a href="/" className="underline">situation hubs</a> and
            outcome pages are derived from confirmed outcomes only. We do not
            infer outcomes from sentiment.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">The companion is not a clinician</h2>
          <p className="leading-relaxed">
            Shutap's in-app companion is built to help you spill what's going on
            and find people who've been through it. It is not a therapist, a
            doctor, or a lawyer, and will never pose as one. On sensitive
            topics — abuse, self-harm, legal jeopardy — the companion routes to
            free professional resources first.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Pseudonymity, not anonymity</h2>
          <p className="leading-relaxed">
            You pick a pseudonym that follows you across stories. Your real
            name never shows. Before any story is indexed by search engines, our
            privacy shield de-identifies named third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Takedowns</h2>
          <p className="leading-relaxed">
            If a story names you or violates our content rules, the takedown
            path is fast. Report a story from its page or email{" "}
            <a href="mailto:trust@shutap.app" className="underline">
              trust@shutap.app
            </a>
            .
          </p>
        </section>
      </article>
    </SeoPage>
  );
}
