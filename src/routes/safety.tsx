import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Crisis & Safety — Shutap" },
      { name: "description", content: "Shutap isn't a crisis service. If you're in crisis, you deserve real, human help right now — here are the lines that pick up." },
      { property: "og:title", content: "Crisis & Safety — Shutap" },
      { property: "og:description", content: "Real help, real humans, right now." },
    ],
    links: [{ rel: "canonical", href: "/safety" }],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  return (
    <SeoPage>
      <article className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">crisis &amp; safety</h1>
        <p className="text-lg leading-relaxed">
          Shutap isn't a crisis service, and our companion isn't a counselor. If you're in crisis, you deserve real, human help right now:
        </p>
        <ul className="space-y-3 text-base">
          <li><strong>US:</strong> call or text <a className="underline" href="tel:988">988</a> (Suicide &amp; Crisis Lifeline)</li>
          <li><strong>UK:</strong> Samaritans, <a className="underline" href="tel:116123">116 123</a></li>
          <li><strong>Anywhere:</strong> <a className="underline" href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a></li>
        </ul>
        <p className="leading-relaxed text-muted-foreground">
          When our companion notices something serious, it stops and points you here. Crisis messages are kept private, are never made public, and are never used for anything but supporting you. You're not alone. 🤍
        </p>
      </article>
    </SeoPage>
  );
}
