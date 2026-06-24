import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shutap — Story Stream" },
      {
        name: "description",
        content:
          "No algorithm. No upvotes. The room reshapes only when you ask it to. Open rooms of real, anonymous stories on Shutap.",
      },
      { property: "og:title", content: "Shutap — Story Stream" },
      {
        property: "og:description",
        content:
          "No algorithm. No upvotes. The room reshapes only when you ask it to.",
      },
    ],
  }),
  component: StreamPage,
});

type Reactions = { heard: number; same: number; strong: number; time: number; brave: number };
type Room = {
  id: string;
  alias: string;
  emoji: string;
  title: string;
  support: "heard" | "advice";
  relates: number;
  sitting: number;
  hours: string;
  reactions: Reactions;
};

const REACTIONS: { k: keyof Reactions; color: string }[] = [
  { k: "heard", color: "#e7548a" },
  { k: "same", color: "#c87c4a" },
  { k: "strong", color: "#5B8A5E" },
  { k: "time", color: "#7F77DD" },
  { k: "brave", color: "#c1a02b" },
];

const ROOMS: Room[] = [
  {
    id: "0",
    alias: "Quiet Nigerian Swan",
    emoji: "🦢",
    title:
      "I told my mum I've been struggling for months. she cried and said she never knew.",
    support: "heard",
    relates: 47,
    sitting: 18,
    hours: "2h",
    reactions: { heard: 55, same: 28, strong: 10, time: 5, brave: 2 },
  },
  {
    id: "1",
    alias: "Defiant Kenyan Lion",
    emoji: "🦁",
    title:
      "I left a six-figure job and nobody in my family has spoken to me since.",
    support: "advice",
    relates: 83,
    sitting: 26,
    hours: "5h",
    reactions: { heard: 38, same: 41, strong: 12, time: 6, brave: 3 },
  },
  {
    id: "2",
    alias: "Mortified Polish Hedgehog",
    emoji: "🦔",
    title:
      "I wrote a letter to my ex and sent it by accident to our whole group chat.",
    support: "heard",
    relates: 124,
    sitting: 11,
    hours: "6h",
    reactions: { heard: 22, same: 58, strong: 5, time: 10, brave: 5 },
  },
  {
    id: "3",
    alias: "Patient Indian Dove",
    emoji: "🕊",
    title:
      "I've been going to therapy for two years and I finally cried today.",
    support: "heard",
    relates: 211,
    sitting: 34,
    hours: "1d",
    reactions: { heard: 61, same: 24, strong: 8, time: 5, brave: 2 },
  },
  {
    id: "4",
    alias: "Wistful Ethiopian Butterfly",
    emoji: "🦋",
    title:
      "My sister told me she's been scared of me since we were kids. I had no idea.",
    support: "heard",
    relates: 89,
    sitting: 31,
    hours: "3h",
    reactions: { heard: 42, same: 31, strong: 14, time: 8, brave: 5 },
  },
  {
    id: "5",
    alias: "Tender Brazilian Hare",
    emoji: "🐇",
    title:
      "I'm the first person in my family to go to university and I'm failing.",
    support: "advice",
    relates: 156,
    sitting: 22,
    hours: "8h",
    reactions: { heard: 48, same: 37, strong: 9, time: 4, brave: 2 },
  },
];

const NUDGES = [
  "something happened to you too. the room is open.",
  "three people just found their 'omg same' moment. wondering if yours is still out there.",
];

const serif: React.CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontStyle: "italic",
};
const sans: React.CSSProperties = { fontFamily: "'Sora', sans-serif" };

function EyeDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute" }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="eyeG" cx="40%" cy="18%" r="75%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="18%" stopColor="#ffd0e8" />
          <stop offset="48%" stopColor="#f060a0" />
          <stop offset="78%" stopColor="#c0206a" />
          <stop offset="100%" stopColor="#880040" />
        </radialGradient>
        <radialGradient id="pupG" cx="50%" cy="55%" r="58%">
          <stop offset="0%" stopColor="#3a1020" />
          <stop offset="100%" stopColor="#060106" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Eye({ w, h, blink = false }: { w: number; h: number; blink?: boolean }) {
  return (
    <span
      style={{
        width: w,
        height: h,
        display: "block",
        animation: blink ? "shutap-eblink 3.4s infinite" : undefined,
        transformOrigin: "center",
      }}
    >
      <svg
        viewBox="0 0 140 96"
        fill="none"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
        <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
        <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        <path
          d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z"
          fill="#fff"
          opacity=".95"
        />
        <path
          d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z"
          fill="#fff"
          opacity=".95"
        />
      </svg>
    </span>
  );
}

function RoomTile({ r }: { r: Room }) {
  const heard = r.support === "heard";
  return (
    <div className="rtile">
      <div style={{ padding: "15px 16px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 11,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              ...sans,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: heard ? "rgba(231,84,138,.08)" : "rgba(91,138,94,.10)",
              color: heard ? "#c1216b" : "#3a6b3c",
              border: `.5px solid ${heard ? "rgba(193,33,107,.18)" : "rgba(91,138,94,.22)"}`,
              borderRadius: 999,
              padding: "4px 10px",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: ".05em",
            }}
          >
            {heard ? "looking to be heard" : "open to advice"}
          </span>
          <span
            style={{
              ...serif,
              fontSize: 11.5,
              color: "#9e7a8c",
              marginLeft: "auto",
            }}
          >
            {r.hours}
          </span>
        </div>
        <h4
          style={{
            ...sans,
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.28,
            margin: "0 0 10px",
            color: "#0b080f",
          }}
        >
          {r.title}
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#f7e8f0",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              flex: "none",
            }}
          >
            {r.emoji}
          </span>
          <span
            style={{
              ...serif,
              fontSize: 12.5,
              color: "#6b4a5c",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {r.alias}
          </span>
        </div>
        <div style={{ marginBottom: 9 }}>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              overflow: "hidden",
              display: "flex",
              gap: 1,
            }}
          >
            {REACTIONS.map((rx) => (
              <span
                key={rx.k}
                style={{
                  flex: r.reactions[rx.k],
                  background: rx.color,
                  height: "100%",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            ...serif,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12.5,
            color: "#9e7a8c",
          }}
        >
          <span>
            <b style={{ color: "#c1216b", fontStyle: "normal" }}>{r.relates}</b>{" "}
            said 'omg same'
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#5DCAA5",
                animation: "shutap-breathe 2.8s ease-in-out infinite",
                display: "block",
              }}
            />
            {r.sitting} in
          </span>
        </div>
      </div>
    </div>
  );
}

function NudgeTile({ msg }: { msg: string }) {
  return (
    <div className="nudge-tile">
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
        <Eye w={24} h={17} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              ...serif,
              fontSize: 15,
              lineHeight: 1.45,
              color: "#0b080f",
              marginBottom: 8,
            }}
          >
            {msg}
          </div>
          <div
            style={{
              ...sans,
              fontWeight: 700,
              fontSize: 12,
              color: "#e7548a",
            }}
          >
            say something →
          </div>
        </div>
      </div>
    </div>
  );
}

function StreamPage() {
  useEffect(() => {
    document.body.classList.add("shutap");
    return () => document.body.classList.remove("shutap");
  }, []);

  // Two-column feed with nudges interleaved like the source
  const colA: Room[] = [];
  const colB: Room[] = [];
  ROOMS.forEach((r, i) => (i % 2 === 0 ? colA : colB).push(r));

  return (
    <div style={{ background: "#fdf0f5", minHeight: "100vh" }}>
      <EyeDefs />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(253,240,245,.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: ".5px solid rgba(11,8,15,.07)",
        }}
      >
        <div
          style={{
            maxWidth: 740,
            margin: "0 auto",
            padding: "11px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <a
            href="#"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Eye w={32} h={23} blink />
            <span
              style={{
                ...sans,
                fontWeight: 800,
                fontSize: 19,
                letterSpacing: "-.04em",
                color: "#0b080f",
                fontStyle: "normal",
              }}
            >
              shut<span style={{ color: "#e7548a" }}>ap</span>
            </span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a
              href="#"
              style={{
                ...serif,
                fontSize: 14,
                color: "#6b4a5c",
                textDecoration: "none",
                padding: "6px 12px",
              }}
            >
              halls
            </a>
            <button
              style={{
                ...sans,
                display: "inline-flex",
                alignItems: "center",
                background: "#e7548a",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "9px 18px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              join →
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Intro */}
        <section style={{ padding: "32px 0 8px" }}>
          <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
            <div
              style={{
                ...serif,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#6b4a5c",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#5DCAA5",
                  animation: "shutap-breathe 3s ease-in-out infinite",
                  display: "block",
                }}
              />
              rooms open right now
            </div>
            <h1
              style={{
                ...serif,
                fontWeight: 400,
                fontSize: "clamp(26px,5vw,36px)",
                lineHeight: 1.2,
                margin: "0 0 8px",
                color: "#0b080f",
              }}
            >
              the stream.
            </h1>
            <p
              style={{
                ...serif,
                fontSize: 15.5,
                color: "#6b4a5c",
                margin: 0,
                maxWidth: "46ch",
              }}
            >
              no algorithm. no upvotes. the room reshapes only when you ask it
              to.
            </p>
          </div>
        </section>

        {/* Feed */}
        <section style={{ padding: "16px 0 100px" }}>
          <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
            <div
              style={{
                display: "flex",
                gap: 13,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                  minWidth: 0,
                }}
              >
                {colA.map((r, i) => (
                  <div key={r.id} style={{ display: "contents" }}>
                    <RoomTile r={r} />
                    {i === 0 && <NudgeTile msg={NUDGES[0]} />}
                  </div>
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 13,
                  minWidth: 0,
                }}
              >
                {colB.map((r, i) => (
                  <div key={r.id} style={{ display: "contents" }}>
                    <RoomTile r={r} />
                    {i === 1 && <NudgeTile msg={NUDGES[1]} />}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                ...serif,
                marginTop: 32,
                paddingTop: 20,
                borderTop: ".5px solid rgba(11,8,15,.08)",
                textAlign: "center",
                fontSize: 15,
                color: "#6b4a5c",
              }}
            >
              something happened to you too.{" "}
              <span className="prose-link">the room is open. →</span>
            </div>
          </div>
        </section>
      </main>

      {/* Floating companion bubble */}
      <div
        role="button"
        aria-label="Ask the companion"
        style={{
          position: "fixed",
          left: "calc(50% - 29px)",
          bottom: 24,
          zIndex: 35,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "rgba(231,84,138,0.18)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          boxShadow: "0 12px 30px -8px rgba(60,10,30,.35)",
          cursor: "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "shutap-pulse 4s infinite",
        }}
      >
        <svg
          viewBox="0 0 56 56"
          fill="none"
          style={{ width: 32, height: 32, display: "block", pointerEvents: "none" }}
        >
          <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
          <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
          <ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG)" />
          <ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG)" />
        </svg>
      </div>
    </div>
  );
}
