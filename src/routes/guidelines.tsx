import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — Shutap" },
      { name: "description", content: "How we keep the room a real place: no doxxing, no cruelty, no spam. Report what breaks it." },
      { property: "og:title", content: "Community Guidelines — Shutap" },
      { property: "og:description", content: "Be real. Be kind. Don't post other people's private info." },
    ],
    links: [{ rel: "canonical", href: "/guidelines" }],
  }),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return (
    <SeoPage>
      <article className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">community guidelines</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          the short version, in-voice. the long version lives in our <a href="/terms" className="underline">terms</a>.
        </p>
        <ul className="list-disc space-y-3 pl-5 text-base leading-relaxed">
          <li>this is a place to be heard. be real, be kind to each other.</li>
          <li><strong>don't post other people's private info</strong> — names, addresses, anything that could identify someone. (we scrub a lot of this automatically, but don't try.)</li>
          <li>no harassment, threats, hate, or cruelty aimed at people.</li>
          <li>nothing illegal — and absolutely nothing sexual involving minors.</li>
          <li>don't impersonate, spam, or scrape.</li>
          <li>don't use shutap to sell services or give professional advice to others.</li>
          <li>see something that breaks this? <a href="/report" className="underline"><strong>report it</strong></a> — there's a button on every post.</li>
        </ul>
        <p className="text-sm text-muted-foreground">we remove content and accounts that break these rules.</p>
      </article>
    </SeoPage>
  );
}
