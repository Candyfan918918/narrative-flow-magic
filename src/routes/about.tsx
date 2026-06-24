import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { BRAND } from "@/lib/seo/brand";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Shutap — pseudonymous venting community" },
      { name: "description", content: BRAND.entitySentence },
      { property: "og:title", content: "About Shutap" },
      { property: "og:description", content: BRAND.entitySentence },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SeoPage>
      <article className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">About Shutap</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {BRAND.entitySentence}
        </p>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">why it exists</h2>
          <p className="leading-relaxed">
            Most places make you perform — for a feed, for a verdict, for strangers
            grading your situation. Shutap is the opposite. You spill what's
            actually going on under a pseudonym, and people who've lived your exact
            thing tap "omg same" and tell you what happened next for them. No
            algorithm. No upvotes. No courtroom.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">how it's different</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Pseudonymous, not anonymous.</strong> You keep a consistent
              voice across stories — your real name never shows.
            </li>
            <li>
              <strong>Relate, don't rank.</strong> "omg same" replaces upvotes; the
              loudest voice doesn't win.
            </li>
            <li>
              <strong>Outcomes, not opinions.</strong> When people share what
              actually happened next, that becomes the answer to the next person
              asking the same question at 1am.
            </li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">a note on "free therapy"</h2>
          <p className="leading-relaxed">
            Venting helps. That's a vibe, not a clinical claim. Shutap is not
            therapy, and the in-app companion is not a therapist or a lawyer. See{" "}
            <a href="/methodology" className="underline">our methodology</a> for
            how we route around the heavy stuff and where to get real help.
          </p>
        </section>
      </article>
    </SeoPage>
  );
}
