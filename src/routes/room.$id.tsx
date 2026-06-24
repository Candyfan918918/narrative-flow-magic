import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { REACTIONS, ROOMS, type Reactions } from "@/lib/shutap-data";

export const Route = createFileRoute("/room/$id")({
  loader: ({ params }) => {
    const room = ROOMS.find((r) => r.id === params.id);
    if (!room) throw notFound();
    return { room };
  },
  head: ({ loaderData }) => {
    const r = loaderData?.room;
    return {
      meta: [
        { title: r ? `${r.title.replace(/\.$/, "")} — a room on Shutap` : "Room — Shutap" },
        { name: "description", content: r ? r.body.slice(0, 155) : "An open room on Shutap." },
        { property: "og:title", content: r ? r.title : "Room — Shutap" },
        { property: "og:description", content: r ? r.body.slice(0, 155) : "An open room on Shutap." },
      ],
    };
  },
  notFoundComponent: () => (
    <div style={{ background: "#fdf0f5", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 22px", textAlign: "center" }}>
        <h1 style={{ ...serif, fontSize: 28, color: "#0b080f", margin: "0 0 10px" }}>this room has rested.</h1>
        <p style={{ ...serif, color: "#6b4a5c", marginBottom: 22 }}>but the stream is still open.</p>
        <Link to="/" className="prose-link" style={{ ...serif, textDecoration: "none" }}>
          back to the stream →
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div style={{ padding: 40, fontFamily: "'Newsreader', serif", fontStyle: "italic" }}>
      something didn't land. <button onClick={reset}>try again</button>
    </div>
  ),
  component: RoomPage,
});

function RoomPage() {
  const { room: r } = Route.useLoaderData();
  useShutapBody();
  const navigate = useNavigate();
  const [reacted, setReacted] = useState<Record<keyof Reactions, boolean>>({
    heard: false,
    same: false,
    strong: false,
    time: false,
    brave: false,
  });
  const [related, setRelated] = useState(false);
  const [comment, setComment] = useState("");
  const [offered, setOffered] = useState(false);

  const n = Math.min(r.sitting, 16);
  const dotEmojis = ["🌸", "✦", "○", "·", "◦"];

  return (
    <div style={{ background: "#fdf0f5", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "24px 22px 120px" }}>
        <button
          onClick={() => navigate({ to: "/" })}
          style={{
            ...serif,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13.5,
            color: "#6b4a5c",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            marginBottom: 20,
          }}
        >
          ← back to rooms
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 14 }}>
          <SupportPill heard={r.support === "heard"} />
          <span style={{ ...serif, fontSize: 12.5, color: "#9e7a8c" }}>{r.hours} ago</span>
        </div>

        <h1
          style={{
            ...sans,
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "clamp(20px,4vw,26px)",
            lineHeight: 1.2,
            margin: "0 0 14px",
            color: "#0b080f",
            letterSpacing: "-.01em",
          }}
        >
          {r.title}
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#f7e8f0",
              display: "grid",
              placeItems: "center",
              fontSize: 16,
              flex: "none",
            }}
          >
            {r.emoji}
          </span>
          <span style={{ ...serif, fontSize: 14, color: "#6b4a5c" }}>{r.alias}</span>
        </div>

        <p
          style={{
            fontFamily: "'Newsreader', serif",
            fontSize: 17,
            lineHeight: 1.65,
            color: "#2e1a26",
            margin: "0 0 26px",
            whiteSpace: "pre-line",
          }}
        >
          {r.body}
        </p>

        {/* Companion */}
        <div
          style={{
            background: "linear-gradient(160deg,#2e0d1a,#1a0a12)",
            borderRadius: 16,
            padding: "18px 20px",
            marginBottom: 26,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <Eye w={22} h={16} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                ...sans,
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: 9.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "#f7b8d4",
                marginBottom: 6,
              }}
            >
              companion
            </div>
            <div style={{ ...serif, fontSize: 15, lineHeight: 1.55, color: "#f7e8f0" }}>{r.reflection}</div>
          </div>
        </div>

        {/* Presence */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#5DCAA5",
                animation: "shutap-breathe 2.8s ease-in-out infinite",
                display: "block",
              }}
            />
            <span
              style={{
                ...sans,
                fontStyle: "normal",
                fontWeight: 600,
                fontSize: 10.5,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#6b4a5c",
              }}
            >
              {r.sitting} sitting in right now
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {Array.from({ length: n }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,rgba(231,84,138,.15),rgba(193,33,107,.25))",
                  border: ".5px solid rgba(231,84,138,.2)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 15,
                  animation: `shutap-breathe ${2.4 + i * 0.18}s ease-in-out infinite`,
                }}
              >
                {dotEmojis[i % 5]}
              </span>
            ))}
            {r.sitting > n && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 10px",
                  height: 28,
                  borderRadius: 14,
                  background: "#f7e8f0",
                  ...serif,
                  fontSize: 12,
                  color: "#9e7a8c",
                }}
              >
                and {r.sitting - n} more
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              ...sans,
              fontStyle: "normal",
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "#9e7a8c",
              marginBottom: 9,
            }}
          >
            how the room is holding this
          </div>
          <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex", gap: 1, marginBottom: 13 }}>
            {REACTIONS.map((rx) => (
              <span key={rx.k} style={{ flex: r.reactions[rx.k], background: rx.color }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REACTIONS.map((rx) => {
              const active = reacted[rx.k];
              return (
                <button
                  key={rx.k}
                  onClick={() => setReacted((p) => ({ ...p, [rx.k]: !p[rx.k] }))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? rx.color : "rgba(11,8,15,.10)"}`,
                    background: active ? "#f7e8f0" : "#fff",
                    cursor: "pointer",
                    ...serif,
                    fontSize: 14,
                    color: rx.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{rx.emoji}</span>
                  <span>{rx.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Relate / share */}
        <div
          style={{
            borderTop: ".5px solid rgba(11,8,15,.08)",
            paddingTop: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <button
            onClick={() => setRelated(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 999,
              border: `1.5px solid ${related ? "#c1216b" : "rgba(11,8,15,.12)"}`,
              background: related ? "#fdf0f5" : "#fff",
              cursor: "pointer",
              ...serif,
              fontSize: 14.5,
              color: "#4a3040",
            }}
          >
            🫂 omg same{" "}
            <b style={{ fontStyle: "normal", fontFamily: "Inter", fontWeight: 600, color: "#c1216b" }}>
              {r.relates + (related ? 1 : 0)}
            </b>
          </button>
          <span style={{ ...serif, fontSize: 14, color: "#c1216b", cursor: "pointer" }}>share →</span>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: ".5px solid rgba(11,8,15,.08)" }}>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 14 }}>
            <Eye w={24} h={17} />
            <div>
              <div
                style={{
                  ...sans,
                  fontStyle: "normal",
                  fontWeight: 600,
                  fontSize: 9.5,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#c1216b",
                  marginBottom: 5,
                }}
              >
                companion
              </div>
              <div style={{ ...serif, fontSize: 15.5, lineHeight: 1.5, color: "#0b080f" }}>
                {r.support === "heard"
                  ? "they asked just to be heard. how does this land with you?"
                  : "they're open to advice — but start with what you felt."}
              </div>
            </div>
          </div>
          <div style={{ marginLeft: 35 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 9,
                background: "#fff",
                border: "1px solid rgba(11,8,15,.10)",
                borderRadius: 14,
                padding: "13px 15px",
              }}
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="vent here — it doesn't have to be advice. say how it lands for you…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#0b080f",
                  ...serif,
                  fontSize: 15,
                  resize: "none",
                  maxHeight: 160,
                  lineHeight: 1.5,
                }}
              />
              <button
                onClick={() => {
                  if (!comment.trim()) return;
                  setOffered(true);
                  setComment("");
                  setTimeout(() => setOffered(false), 3000);
                }}
                style={{
                  ...sans,
                  fontStyle: "normal",
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#fff",
                  background: "#e7548a",
                  border: "none",
                  borderRadius: 999,
                  padding: "7px 14px",
                  cursor: "pointer",
                  flex: "none",
                }}
              >
                offer it →
              </button>
            </div>
            <div style={{ ...serif, fontSize: 12.5, color: "#9e7a8c", marginTop: 8 }}>
              {offered ? "offered. the room felt that." : "seen without your real name."}
            </div>
          </div>
        </div>
      </div>
      <CompanionBubble />
    </div>
  );
}
