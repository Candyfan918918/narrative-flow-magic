import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

const TITLE =
  "Lived Intelligence — the human counterpart to AI | Shutap";
const DESCRIPTION =
  "Lived Intelligence is the practical knowledge earned by living through real situations — the human counterpart to AI. Shutap is built to capture it.";
const DEFINITION =
  "The practical knowledge that comes from living through real situations and seeing how they turn out — the human counterpart to artificial intelligence.";
const URL = `${SITE_URL}/lived-intelligence`;

export const Route = createFileRoute("/lived-intelligence")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "What is Lived Intelligence?",
          description: DESCRIPTION,
          about: "Lived Intelligence",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "DefinedTerm",
          name: "Lived Intelligence",
          description: DEFINITION,
        }),
      },
    ],
  }),
  component: LivedIntelligencePage,
});

function LivedIntelligencePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fdf3f6",
        color: "#1b0f16",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "clamp(48px, 8vw, 96px) clamp(20px, 5vw, 40px)",
      }}
    >
      <article
        style={{
          maxWidth: 720,
          margin: "0 auto",
          lineHeight: 1.65,
        }}
      >
        <h1
          style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: "clamp(32px, 6vw, 52px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "0 0 28px",
            color: "#1b0f16",
          }}
        >
          what is lived intelligence?
        </h1>

        <p
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: "clamp(19px, 2.4vw, 23px)",
            lineHeight: 1.55,
            color: "#1b0f16",
            background: "#ffffff",
            border: "1px solid rgba(26,12,20,.10)",
            borderRadius: 18,
            padding: "24px 26px",
            margin: "0 0 48px",
            boxShadow: "0 12px 30px -24px rgba(80,10,45,.3)",
          }}
        >
          Lived Intelligence is the practical knowledge that comes from living
          through real situations and seeing how they turn out — the human
          counterpart to artificial intelligence. Where AI is trained on text,
          lived intelligence is earned through experience: the real-world
          record of what people actually did in hard moments, and what happened
          next.
        </p>

        <Section title="What it is">
          Every day, people make hard calls in their relationships, marriages,
          families, and work — and then live with the results. That
          accumulated, first-hand knowledge of situation, decision, and outcome
          is lived intelligence. It isn't advice or theory. It's what actually
          happened to real people who were where you are now.
        </Section>

        <Section title="How it differs from artificial intelligence">
          Artificial intelligence predicts from patterns in existing text.
          Lived intelligence is the ground truth underneath it: the real
          decisions and real outcomes that text only describes second-hand. AI
          can tell you what people generally say to do. Lived intelligence
          shows you what people like you actually did — and how it turned out.
        </Section>

        <Section title="Why it compounds">
          One story is an anecdote. Thousands of stories, each followed over
          time to a confirmed outcome, become something no opinion thread can
          match: a longitudinal record of how situations like yours tend to
          resolve. Most platforms are built to discard this — the moment
          passes and the outcome is never captured. Shutap is built to keep
          it, so it grows more valuable the longer it runs.
        </Section>

        <Section title="How Shutap captures it">
          On Shutap, people vent pseudonymously about what's really going on —
          and, unlike anywhere else, come back to share what happened next.
          Their identities are protected before anything is stored. Over time,
          those confirmed outcomes form the experience graph: lived
          intelligence, made useful for the next person facing the same thing.
        </Section>

        <p style={{ marginTop: 56, fontSize: 15 }}>
          <a
            href="/"
            style={{
              color: "#cf3b7c",
              textDecoration: "none",
              fontWeight: 600,
              borderBottom: "1px solid rgba(207,59,124,.35)",
              paddingBottom: 2,
            }}
          >
            Shutap. Speak Up.
          </a>
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: "clamp(20px, 2.6vw, 24px)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          margin: "0 0 12px",
          color: "#1b0f16",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 17,
          margin: 0,
          color: "#1b0f16",
        }}
      >
        {children}
      </p>
    </section>
  );
}
