import { createFileRoute, Link } from "@tanstack/react-router";
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
      { title: "Shutap — Story Stream" },
      {
        name: "description",
        content:
          "No algorithm. No upvotes. The room reshapes only when you ask it to. Open rooms of real, anonymous stories on Shutap.",
      },
      { property: "og:title", content: "Shutap — Story Stream" },
      {
        property: "og:description",
        content: "No algorithm. No upvotes. The room reshapes only when you ask it to.",
      },
    ],
  }),
  component: StreamPage,
});

const NUDGES = [
  "something happened to you too. the room is open.",
  "three people just found their 'omg same' moment. wondering if yours is still out there.",
];

function RoomTile({ r }: { r: Room }) {
  return (
    <Link
      to="/room/$id"
      params={{ id: r.id }}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="rtile">
        <div style={{ padding: "15px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11, flexWrap: "wrap" }}>
            <SupportPill heard={r.support === "heard"} />
            <span style={{ ...serif, fontSize: 11.5, color: "#9e7a8c", marginLeft: "auto" }}>{r.hours}</span>
          </div>
          <h4 style={{ ...sans, fontStyle: "normal", fontWeight: 700, fontSize: 15, lineHeight: 1.28, margin: "0 0 10px", color: "#0b080f" }}>
            {r.title}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#f7e8f0", display: "grid", placeItems: "center", fontSize: 12, flex: "none" }}>
              {r.emoji}
            </span>
            <span style={{ ...serif, fontSize: 12.5, color: "#6b4a5c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.alias}
            </span>
          </div>
          <div style={{ marginBottom: 9 }}>
            <div style={{ height: 6, borderRadius: 3, overflow: "hidden", display: "flex", gap: 1 }}>
              {REACTIONS.map((rx) => (
                <span key={rx.k} style={{ flex: r.reactions[rx.k], background: rx.color, height: "100%" }} />
              ))}
            </div>
          </div>
          <div style={{ ...serif, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: "#9e7a8c" }}>
            <span>
              <b style={{ color: "#c1216b", fontStyle: "normal" }}>{r.relates}</b> said 'omg same'
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5DCAA5", animation: "shutap-breathe 2.8s ease-in-out infinite", display: "block" }} />
              {r.sitting} in
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NudgeTile({ msg }: { msg: string }) {
  return (
    <Link to="/spill" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="nudge-tile">
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
          <Eye w={24} h={17} />
          <div style={{ flex: 1 }}>
            <div style={{ ...serif, fontSize: 15, lineHeight: 1.45, color: "#0b080f", marginBottom: 8 }}>{msg}</div>
            <div style={{ ...sans, fontStyle: "normal", fontWeight: 700, fontSize: 12, color: "#e7548a" }}>say something →</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StreamPage() {
  useShutapBody();
  const colA: Room[] = [];
  const colB: Room[] = [];
  ROOMS.forEach((r, i) => (i % 2 === 0 ? colA : colB).push(r));

  return (
    <div style={{ background: "#fdf0f5", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <main>
        <section style={{ padding: "32px 0 8px" }}>
          <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
            <div style={{ ...serif, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#6b4a5c", marginBottom: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#5DCAA5", animation: "shutap-breathe 3s ease-in-out infinite", display: "block" }} />
              rooms open right now
            </div>
            <h1 style={{ ...serif, fontWeight: 400, fontSize: "clamp(26px,5vw,36px)", lineHeight: 1.2, margin: "0 0 8px", color: "#0b080f" }}>
              the stream.
            </h1>
            <p style={{ ...serif, fontSize: 15.5, color: "#6b4a5c", margin: 0, maxWidth: "46ch" }}>
              no algorithm. no upvotes. the room reshapes only when you ask it to.
            </p>
          </div>
        </section>

        <section style={{ padding: "16px 0 100px" }}>
          <div style={{ maxWidth: 740, margin: "0 auto", padding: "0 22px" }}>
            <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 13, minWidth: 0 }}>
                {colA.map((r, i) => (
                  <div key={r.id} style={{ display: "contents" }}>
                    <RoomTile r={r} />
                    {i === 0 && <NudgeTile msg={NUDGES[0]} />}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 13, minWidth: 0 }}>
                {colB.map((r, i) => (
                  <div key={r.id} style={{ display: "contents" }}>
                    <RoomTile r={r} />
                    {i === 1 && <NudgeTile msg={NUDGES[1]} />}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...serif, marginTop: 32, paddingTop: 20, borderTop: ".5px solid rgba(11,8,15,.08)", textAlign: "center", fontSize: 15, color: "#6b4a5c" }}>
              something happened to you too.{" "}
              <Link to="/spill" className="prose-link" style={{ textDecoration: "none" }}>
                the room is open. →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <CompanionBubble />
    </div>
  );
}
