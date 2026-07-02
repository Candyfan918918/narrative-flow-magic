type Section = { heading: string; body: string };
type Other = { href: string; label: string };

export function ContentPage({
  h1,
  capsule,
  sections,
  others,
}: {
  h1: string;
  capsule: string;
  sections: Section[];
  others?: Other[];
}) {
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
        style={{ maxWidth: 720, margin: "0 auto", lineHeight: 1.65 }}
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
          {h1}
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
          {capsule}
        </p>

        {sections.map((s) => (
          <section key={s.heading} style={{ marginBottom: 36 }}>
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
              {s.heading}
            </h2>
            <p style={{ fontSize: 17, margin: 0, color: "#1b0f16" }}>
              {s.body}
            </p>
          </section>
        ))}

        {others && others.length > 0 && (
          <nav
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              padding: "20px 0",
              borderTop: "1px solid rgba(26,12,20,.10)",
              borderBottom: "1px solid rgba(26,12,20,.10)",
              margin: "40px 0",
              fontSize: 15,
            }}
          >
            <span style={{ color: "#6e5f67" }}>more:</span>
            {others.map((o) => (
              <a
                key={o.href}
                href={o.href}
                style={{
                  color: "#1b0f16",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(26,12,20,.25)",
                  paddingBottom: 1,
                }}
              >
                {o.label}
              </a>
            ))}
          </nav>
        )}

        <p style={{ marginTop: 40, fontSize: 15 }}>
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
