import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Shutap" },
      { name: "description", content: "How to reach Shutap: legal, privacy, press, takedowns." },
      { property: "og:title", content: "Contact — Shutap" },
      { property: "og:description", content: "Reach the humans behind the room." },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SeoPage>
      <article className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">contact</h1>
        <dl className="space-y-4 text-base">
          <div>
            <dt className="font-semibold">general / press</dt>
            <dd className="text-muted-foreground">[CONTACT EMAIL]</dd>
          </div>
          <div>
            <dt className="font-semibold">privacy &amp; data rights</dt>
            <dd className="text-muted-foreground">[PRIVACY EMAIL] — or use the controls on your <a className="underline" href="/profile">profile</a>.</dd>
          </div>
          <div>
            <dt className="font-semibold">legal / takedowns</dt>
            <dd className="text-muted-foreground">[LEGAL EMAIL] — or use <a className="underline" href="/report">/report</a>.</dd>
          </div>
          <div>
            <dt className="font-semibold">crisis</dt>
            <dd className="text-muted-foreground">we're not a crisis line — please see <a className="underline" href="/safety">/safety</a>.</dd>
          </div>
        </dl>
      </article>
    </SeoPage>
  );
}
