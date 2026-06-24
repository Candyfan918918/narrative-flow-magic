import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CompanionBubble,
  Eye,
  EyeDefs,
  SiteHeader,
  SupportPill,
  sans,
  serif,
  useShutapBody,
} from "@/components/shutap";
import { REACTIONS, ROOMS, type Room } from "@/lib/shutap-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shutap — say the thing you can't say out loud" },
      {
        name: "description",
        content:
          "No algorithm, no upvotes, no verdicts. Open a room for the thing weighing on you, or sit in someone else's. Anonymous, eyes-only.",
      },
      { property: "og:title", content: "Shutap — say the thing you can't say out loud" },
      {
        property: "og:description",
        content: "No algorithm, no upvotes, no verdicts. A quiet place for the thing you've been carrying.",
      },
    ],
  }),
  component: LandingPage,
});

/* ---------------- helpers ---------------- */

const PRIVATE_PATTERNS: { re: RegExp; replace: string }[] = [
  { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, replace: "[private]" },
  { re: /\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, replace: "[private]" },
  { re: /https?:\/\/\S+/g, replace: "[private]" },
  { re: /\b\d{1,5}\s+[A-Z][a-z]+\s+(?:St|Street|Rd|Road|Ave|Avenue|Blvd|Lane|Ln|Way)\b/g, replace: "[private]" },
];
function shield(text: string): string {
  let out = text;
  PRIVATE_PATTERNS.forEach(({ re, replace }) => (out = out.replace(re, replace)));
  return out;
}

/* ---------------- Hero ---------------- */

function Hero({ onSpill, onScan }: { onSpill: () => void; onScan: () => void }) {
  return (
    <section style={{ padding: "44px 0 24px" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
        <div
          style={{
            ...serif,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--text-2)",
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--teal)",
              animation: "shutap-breathe 3s ease-in-out infinite",
              display: "block",
            }}
          />
          1,842 rooms open right now
        </div>

        <h1
          style={{
            ...serif,
            fontWeight: 400,
            fontSize: "var(--text-4xl)",
            lineHeight: 1.06,
            letterSpacing: "var(--tracking-tight)",
            margin: "0 0 16px",
            color: "var(--ink)",
          }}
        >
          the thing<br />
          you can't say<br />
          <span style={{ color: "var(--pink)" }}>out loud.</span>
        </h1>

        <p
          style={{
            ...serif,
            fontSize: "var(--text-md)",
            color: "var(--text-2)",
            margin: "0 0 28px",
            maxWidth: "44ch",
            lineHeight: 1.55,
          }}
        >
          no algorithm. no upvotes. no verdicts. open a room for what you're carrying — or sit in someone else's.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <CTACard
            kind="spill"
            title="spill it"
            sub="open your own room. 60 seconds. eyes only."
            onClick={onSpill}
          />
          <CTACard
            kind="scan"
            title="scan the room"
            sub="9 taps. find the rooms shaped like yours."
            onClick={onScan}
          />
        </div>

        <div
          style={{
            ...serif,
            fontSize: 13,
            color: "var(--text-3)",
            marginTop: 6,
          }}
        >
          or{" "}
          <Link to="/halls" className="prose-link" style={{ textDecoration: "none" }}>
            wander the halls →
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTACard({
  kind,
  title,
  sub,
  onClick,
}: {
  kind: "spill" | "scan";
  title: string;
  sub: string;
  onClick: () => void;
}) {
  const accent = kind === "spill" ? "var(--pink)" : "var(--purple)";
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        background: "var(--surface)",
        border: ".5px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "20px 20px 22px",
        cursor: "pointer",
        boxShadow: "var(--shadow-card)",
        transition: "transform .18s, box-shadow .2s, border-color .18s",
        font: "inherit",
        color: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      <div
        style={{
          ...sans,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: "var(--tracking-label)",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 10,
        }}
      >
        {kind === "spill" ? "open a room" : "find your room"}
      </div>
      <div style={{ ...serif, fontSize: 24, lineHeight: 1.1, color: "var(--ink)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ ...serif, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{sub}</div>
    </button>
  );
}

/* ---------------- Rooms preview ---------------- */

function RoomPreviewTile({ r }: { r: Room }) {
  return (
    <Link
      to="/room/$id"
      params={{ id: r.id }}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="rtile" style={{ padding: "14px 15px 13px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <SupportPill heard={r.support === "heard"} />
          <span style={{ ...serif, fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{r.hours}</span>
        </div>
        <h4
          style={{
            ...sans,
            fontWeight: 700,
            fontSize: 14.5,
            lineHeight: 1.28,
            margin: "0 0 10px",
            color: "var(--ink)",
          }}
        >
          {r.title}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "grid",
              placeItems: "center",
              fontSize: 11,
            }}
          >
            {r.emoji}
          </span>
          <span style={{ ...serif, fontSize: 12, color: "var(--text-2)" }}>{r.alias}</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, overflow: "hidden", display: "flex", gap: 1, marginBottom: 8 }}>
          {REACTIONS.map((rx) => (
            <span key={rx.k} style={{ flex: r.reactions[rx.k], background: rx.color, height: "100%" }} />
          ))}
        </div>
        <div
          style={{
            ...serif,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--text-3)",
          }}
        >
          <span>
            <b style={{ color: "var(--pink)", fontStyle: "normal" }}>{r.relates}</b> said 'omg same'
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--teal)",
                animation: "shutap-breathe 2.8s ease-in-out infinite",
                display: "block",
              }}
            />
            {r.sitting} in
          </span>
        </div>
      </div>
    </Link>
  );
}

function RoomsPreview() {
  const preview = ROOMS.slice(0, 4);
  const colA = preview.filter((_, i) => i % 2 === 0);
  const colB = preview.filter((_, i) => i % 2 === 1);
  return (
    <section style={{ padding: "8px 0 32px" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ ...serif, fontSize: 22, margin: 0, color: "var(--ink)", fontWeight: 400 }}>
            rooms open now.
          </h2>
          <Link to="/halls" className="prose-link" style={{ ...serif, fontSize: 13.5, textDecoration: "none" }}>
            see all →
          </Link>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {colA.map((r) => <RoomPreviewTile key={r.id} r={r} />)}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            {colB.map((r) => <RoomPreviewTile key={r.id} r={r} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Quiet manifesto ---------------- */

function Manifesto() {
  const lines = [
    ["no algorithm.", "the room reshapes only when you ask it to."],
    ["no upvotes.", "five reactions, none of them a verdict."],
    ["no audience.", "eyes only. no screenshots that survive."],
  ];
  return (
    <section style={{ padding: "32px 0 48px" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
        <div
          style={{
            background: "var(--surface)",
            border: ".5px solid var(--border)",
            borderRadius: "var(--radius-2xl)",
            padding: "28px 26px",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            {lines.map(([a, b]) => (
              <div key={a} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 180px) 1fr", gap: 16, alignItems: "baseline" }}>
                <div style={{ ...sans, fontWeight: 800, fontSize: 13, letterSpacing: "var(--tracking-label)", textTransform: "uppercase", color: "var(--pink)" }}>
                  {a}
                </div>
                <div style={{ ...serif, fontSize: 16, color: "var(--ink)", lineHeight: 1.5 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Spill overlay ---------------- */

function Overlay({ onClose, children, dark = false }: { onClose: () => void; children: React.ReactNode; dark?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,8,12,.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 100,
        display: "grid",
        placeItems: "end center",
        animation: "shutap-fadeup .25s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: dark ? "var(--dark-surface)" : "var(--surface)",
          color: dark ? "var(--dark-text)" : "var(--ink)",
          borderRadius: "22px 22px 0 0",
          boxShadow: "var(--shadow-overlay)",
          padding: "22px 22px 30px",
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "shutap-fadeup .35s ease",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: dark ? "rgba(255,255,255,.16)" : "var(--border-2)",
            margin: "0 auto 18px",
          }}
        />
        {children}
      </div>
    </div>
  );
}

function SpillOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const shielded = useMemo(() => shield(text), [text]);
  const changed = shielded !== text;
  const tooShort = text.trim().length < 20;

  return (
    <Overlay onClose={onClose}>
      <div
        style={{
          ...sans,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: "var(--tracking-label)",
          textTransform: "uppercase",
          color: "var(--pink)",
          marginBottom: 8,
        }}
      >
        spill it
      </div>
      <h3 style={{ ...serif, fontSize: 24, margin: "0 0 8px", fontWeight: 400 }}>
        what's the thing?
      </h3>
      <p style={{ ...serif, fontSize: 14, color: "var(--text-2)", margin: "0 0 16px", lineHeight: 1.5 }}>
        write it the way you'd say it to a friend at 1am. we'll quietly hide phone numbers, emails and links before anyone else sees it.
      </p>

      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="i haven't told anyone this, but…"
        rows={6}
        style={{
          ...serif,
          width: "100%",
          background: "var(--surface-2)",
          border: ".5px solid var(--border)",
          borderRadius: 14,
          padding: "14px 14px",
          fontSize: 15.5,
          color: "var(--ink)",
          resize: "vertical",
          outline: "none",
          lineHeight: 1.55,
          boxSizing: "border-box",
        }}
      />

      {changed && (
        <div
          style={{
            ...serif,
            marginTop: 10,
            padding: "10px 12px",
            background: "rgba(127,119,221,.08)",
            border: ".5px solid rgba(127,119,221,.25)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--purple)",
          }}
        >
          we noticed a phone, email, link or address. it'll be replaced with [private] when you post.
        </div>
      )}

      <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        <button
          onClick={onClose}
          style={{
            ...sans,
            background: "transparent",
            border: 0,
            padding: "10px 14px",
            color: "var(--text-2)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          not yet
        </button>
        <button
          disabled={tooShort}
          onClick={() => {
            try {
              sessionStorage.setItem("shutap_draft", shielded);
              sessionStorage.setItem("shutap_returnTo", "/halls");
            } catch {}
            navigate({ to: "/auth" });
          }}
          style={{
            ...sans,
            background: tooShort ? "var(--surface-3)" : "var(--pink)",
            color: tooShort ? "var(--text-3)" : "#fff",
            border: 0,
            borderRadius: 999,
            padding: "12px 22px",
            cursor: tooShort ? "not-allowed" : "pointer",
            fontWeight: 700,
            fontSize: 13.5,
            boxShadow: tooShort ? "none" : "var(--shadow-pill)",
            transition: ".18s",
          }}
        >
          open the room →
        </button>
      </div>
    </Overlay>
  );
}

/* ---------------- Scan overlay ---------------- */

const SCAN_CARDS: { q: string; tags: string[] }[] = [
  { q: "is it about a person?", tags: ["family", "friend", "partner", "stranger", "me"] },
  { q: "is it loud or quiet?", tags: ["a whisper", "a hum", "a roar"] },
  { q: "is it old or new?", tags: ["today", "this week", "years"] },
  { q: "do you want to be heard, or want advice?", tags: ["heard", "advice", "both"] },
  { q: "is it a secret?", tags: ["yes, total", "only some people know", "not a secret"] },
  { q: "does it hurt?", tags: ["a lot", "a little", "it's complicated"] },
  { q: "is it about something you did, or something done to you?", tags: ["did", "done to me", "both"] },
  { q: "would you call it grief?", tags: ["yes", "no", "kind of"] },
  { q: "what would it feel like to put it down?", tags: ["lighter", "scary", "I don't know"] },
];

function ScanOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const done = step >= SCAN_CARDS.length;
  const matches = 124 + (picks.length * 37) % 800;

  if (done) {
    return (
      <Overlay onClose={onClose}>
        <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
          <Eye w={56} h={40} blink />
        </div>
        <h3 style={{ ...serif, fontSize: 26, margin: "12px 0 8px", fontWeight: 400, textAlign: "center" }}>
          we found rooms shaped like yours.
        </h3>
        <p style={{ ...serif, fontSize: 14.5, color: "var(--text-2)", margin: "0 0 20px", textAlign: "center", lineHeight: 1.55 }}>
          <b style={{ color: "var(--pink)", fontStyle: "normal" }}>{matches}</b> rooms match the shape you described.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setStep(0);
              setPicks([]);
            }}
            style={{
              ...sans,
              background: "transparent",
              border: ".5px solid var(--border-2)",
              borderRadius: 999,
              padding: "10px 18px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-2)",
            }}
          >
            scan again
          </button>
          <button
            onClick={() => {
              try {
                sessionStorage.setItem("shutap_returnTo", "/halls");
              } catch {}
              navigate({ to: "/auth" });
            }}
            style={{
              ...sans,
              background: "var(--pink)",
              color: "#fff",
              border: 0,
              borderRadius: 999,
              padding: "12px 22px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13.5,
              boxShadow: "var(--shadow-pill)",
            }}
          >
            walk into the rooms →
          </button>
        </div>
      </Overlay>
    );
  }

  const card = SCAN_CARDS[step];
  return (
    <Overlay onClose={onClose}>
      <div
        style={{
          ...sans,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: "var(--tracking-label)",
          textTransform: "uppercase",
          color: "var(--purple)",
          marginBottom: 8,
        }}
      >
        scan · {step + 1} / {SCAN_CARDS.length}
      </div>
      <h3 style={{ ...serif, fontSize: 22, margin: "0 0 18px", fontWeight: 400, lineHeight: 1.25 }}>
        {card.q}
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {card.tags.map((t) => (
          <button
            key={t}
            onClick={() => {
              setPicks([...picks, `${step}:${t}`]);
              setStep(step + 1);
            }}
            style={{
              ...serif,
              background: "var(--surface-2)",
              border: ".5px solid var(--border)",
              borderRadius: 999,
              padding: "10px 16px",
              fontSize: 14,
              color: "var(--ink)",
              cursor: "pointer",
              transition: ".18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--pink)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "var(--pink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--ink)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{
            ...sans,
            background: "transparent",
            border: 0,
            padding: "8px 0",
            color: step === 0 ? "var(--text-3)" : "var(--text-2)",
            cursor: step === 0 ? "default" : "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← back
        </button>
        <button
          onClick={() => setStep(step + 1)}
          style={{
            ...sans,
            background: "transparent",
            border: 0,
            color: "var(--text-3)",
            cursor: "pointer",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          skip
        </button>
      </div>
    </Overlay>
  );
}

/* ---------------- Page ---------------- */

function LandingPage() {
  useShutapBody();
  const [mode, setMode] = useState<"spill" | "scan" | null>(null);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <main>
        <Hero onSpill={() => setMode("spill")} onScan={() => setMode("scan")} />
        <RoomsPreview />
        <Manifesto />
        <section style={{ padding: "0 0 96px" }}>
          <div
            style={{
              maxWidth: 740,
              margin: "0 auto",
              padding: "0 22px",
              ...serif,
              fontSize: 15,
              color: "var(--text-2)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            something happened to you too.{" "}
            <button
              onClick={() => setMode("spill")}
              className="prose-link"
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                font: "inherit",
                color: "var(--pink)",
                cursor: "pointer",
              }}
            >
              the room is open. →
            </button>
          </div>
        </section>
      </main>
      <CompanionBubble />
      {mode === "spill" && <SpillOverlay onClose={() => setMode(null)} />}
      {mode === "scan" && <ScanOverlay onClose={() => setMode(null)} />}
    </div>
  );
}
