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
import { REACTIONS, ROOMS, type Reactions, type Room } from "@/lib/shutap-data";
import { dbRoomToRoom, fetchRoomById, fetchRoomCounts, isUuid, toggleRelate } from "@/lib/rooms";

export const Route = createFileRoute("/room/$id")({
  loader: async ({ params }) => {
    if (!isUuid(params.id)) {
      const room = ROOMS.find((r) => r.id === params.id);
      if (!room) throw notFound();
      return { room };
    }
    const db = await fetchRoomById(params.id);
    if (!db) throw notFound();
    const counts = await fetchRoomCounts(params.id);
    return { room: dbRoomToRoom(db, counts) };
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
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 22px", textAlign: "center" }}>
        <h1 style={{ ...serif, fontSize: 28, color: "var(--ink)", margin: "0 0 10px" }}>this room has rested.</h1>
        <p style={{ ...serif, color: "var(--text-2)", marginBottom: 22 }}>but the stream is still open.</p>
        <Link to="/" className="prose-link" style={{ ...serif, textDecoration: "none" }}>
          back to the stream →
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div style={{ padding: 40, ...serif }}>
      something didn't land.{" "}
      <button onClick={reset} className="prose-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
        try again
      </button>
    </div>
  ),
  component: RoomPage,
});

const MOOD_BY_HALL: Record<string, { label: string; color: string }> = {
  healing: { label: "healing", color: "var(--mood-view)" },
  brave: { label: "brave", color: "var(--mood-ask)" },
  relatable: { label: "relatable", color: "var(--mood-sit)" },
  loving: { label: "loving", color: "var(--purple)" },
};

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
  const mood = MOOD_BY_HALL[r.hall] ?? MOOD_BY_HALL.healing;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "20px 22px 120px" }}>
        <button
          onClick={() => navigate({ to: "/" })}
          style={{
            ...serif,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13.5,
            color: "var(--text-2)",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: 0,
            marginBottom: 16,
          }}
        >
          ← back to rooms
        </button>

        {/* Gradient cover */}
        <div
          style={{
            position: "relative",
            borderRadius: "var(--radius-2xl)",
            overflow: "hidden",
            background: `radial-gradient(120% 100% at 12% 0%, rgba(231,84,138,.22), transparent 55%), linear-gradient(160deg, var(--surface) 0%, var(--surface-2) 100%)`,
            border: ".5px solid var(--border)",
            padding: "22px 22px 20px",
            marginBottom: 22,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 14 }}>
            <SupportPill heard={r.support === "heard"} />
            <span
              style={{
                ...sans,
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: "var(--tracking-label)",
                textTransform: "uppercase",
                color: mood.color,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,.6)",
                border: `.5px solid ${mood.color}`,
              }}
            >
              {mood.label}
            </span>
            <span style={{ ...serif, fontSize: 12.5, color: "var(--text-3)", marginLeft: "auto" }}>{r.hours} ago</span>
          </div>

          <h1
            style={{
              ...serif,
              fontWeight: 400,
              fontSize: "var(--text-2xl)",
              lineHeight: 1.2,
              margin: "0 0 14px",
              color: "var(--ink)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {r.title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--surface)",
                border: ".5px solid var(--border)",
                display: "grid",
                placeItems: "center",
                fontSize: 17,
                flex: "none",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {r.emoji}
            </span>
            <span style={{ ...serif, fontSize: 14, color: "var(--text-2)" }}>{r.alias}</span>
          </div>
        </div>

        <p
          style={{
            ...serif,
            fontStyle: "normal",
            fontFamily: "var(--font-serif)",
            fontSize: 17.5,
            lineHeight: 1.7,
            color: "var(--ink)",
            margin: "0 0 26px",
            whiteSpace: "pre-line",
          }}
        >
          {r.body}
        </p>

        {/* Companion reflection */}
        <div
          style={{
            background: "linear-gradient(160deg, var(--dark-bg), var(--dark-surface))",
            borderRadius: "var(--radius-xl)",
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
                fontWeight: 700,
                fontSize: 9.5,
                letterSpacing: "var(--tracking-label)",
                textTransform: "uppercase",
                color: "var(--pink-soft)",
                marginBottom: 6,
              }}
            >
              companion
            </div>
            <div style={{ ...serif, fontSize: 15, lineHeight: 1.6, color: "var(--dark-text)" }}>{r.reflection}</div>
          </div>
        </div>

        {/* Presence seats */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--teal)",
                animation: "shutap-breathe 2.8s ease-in-out infinite",
                display: "block",
              }}
            />
            <span
              style={{
                ...sans,
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: "var(--tracking-label)",
                textTransform: "uppercase",
                color: "var(--text-2)",
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
                  background: "linear-gradient(135deg, rgba(207,59,124,.15), rgba(160,26,85,.25))",
                  border: ".5px solid rgba(207,59,124,.2)",
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
                  background: "var(--surface-2)",
                  ...serif,
                  fontSize: 12,
                  color: "var(--text-3)",
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
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "var(--tracking-label)",
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: 9,
            }}
          >
            how the room is holding this
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 5,
              overflow: "hidden",
              display: "flex",
              gap: 1,
              marginBottom: 13,
              background: "var(--surface-2)",
            }}
          >
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
                    border: `1.5px solid ${active ? rx.color : "var(--border)"}`,
                    background: active ? "var(--surface-2)" : "var(--surface)",
                    cursor: "pointer",
                    ...serif,
                    fontSize: 14,
                    color: rx.color,
                    whiteSpace: "nowrap",
                    transition: "transform .15s, border-color .15s",
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
            borderTop: ".5px solid var(--border)",
            paddingTop: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <button
            onClick={async () => {
              if (!isUuid(r.id)) {
                setRelated((v) => !v);
                return;
              }
              try {
                const next = await toggleRelate(r.id);
                setRelated(next);
              } catch {
                navigate({ to: "/auth" });
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 999,
              border: `1.5px solid ${related ? "var(--pink)" : "var(--border)"}`,
              background: related ? "var(--surface-2)" : "var(--surface)",
              cursor: "pointer",
              ...serif,
              fontSize: 14.5,
              color: "var(--ink)",
            }}
          >
            🫂 omg same{" "}
            <b
              style={{
                fontStyle: "normal",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--pink)",
              }}
            >
              {r.relates + (related ? 1 : 0)}
            </b>
          </button>
          <button
            className="prose-link"
            style={{
              ...serif,
              fontSize: 14,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            share →
          </button>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: ".5px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 14 }}>
            <Eye w={24} h={17} />
            <div>
              <div
                style={{
                  ...sans,
                  fontWeight: 700,
                  fontSize: 9.5,
                  letterSpacing: "var(--tracking-label)",
                  textTransform: "uppercase",
                  color: "var(--pink)",
                  marginBottom: 5,
                }}
              >
                companion
              </div>
              <div style={{ ...serif, fontSize: 15.5, lineHeight: 1.5, color: "var(--ink)" }}>
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
                background: "var(--surface)",
                border: ".5px solid var(--border)",
                borderRadius: "var(--radius-md)",
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
                  color: "var(--ink)",
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
                  fontWeight: 700,
                  fontSize: 12,
                  color: "#fff",
                  background: "var(--pink)",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 15px",
                  cursor: "pointer",
                  flex: "none",
                }}
              >
                offer it →
              </button>
            </div>
            <div style={{ ...serif, fontSize: 12.5, color: "var(--text-3)", marginTop: 8 }}>
              {offered ? "offered. the room felt that." : "seen without your real name."}
            </div>
          </div>
        </div>
      </div>
      <CompanionBubble />
    </div>
  );
}
