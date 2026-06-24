import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

const TITLE = "Career — vent about work, money, bosses, burnout";
const DESCRIPTION =
  "Real stories about work: bosses, burnout, underpaid, the job everyone tells you to be grateful for. Pseudonymous, with outcomes from people who left, stayed, or pivoted.";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/career" },
    ],
    links: [{ rel: "canonical", href: "/career" }],
  }),
  component: CareerPillar,
});

function CareerPillar() {
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Pillar
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Career</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Work, money, bosses, burnout, the job everyone tells you to be
            grateful for. Spill it under a pseudonym; your boss won't see this.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common questions people bring here</h2>
          <ul className="space-y-2">
            <li>Is it normal to cry at work?</li>
            <li>Should I quit a job everyone thinks is great?</li>
            <li>How do I know if I'm underpaid?</li>
            <li>Why do I feel guilty taking time off?</li>
            <li>How do you know when to quit without another job lined up?</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Individual situation hubs publish once we have enough confirmed
            outcomes from real members.
          </p>
        </section>
      </article>
    </SeoPage>
  );
}
