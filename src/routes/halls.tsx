import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CompanionBubble,
  EyeDefs,
  SiteHeader,
  SupportPill,
  sans,
  serif,
  useShutapBody,
} from "@/components/shutap";
import { HALL_LABEL, ROOMS, type Hall } from "@/lib/shutap-data";

export const Route = createFileRoute("/halls")({
  head: () => ({
    meta: [
      { title: "Halls of Fame — Shutap" },
      {
        name: "description",
        content: "Rooms the community returned to — the healing, the brave, the relatable, the loving.",
      },
      { property: "og:title", content: "Halls of Fame — Shutap" },
      { property: "og:description", content: "Rooms the community returned to." },
    ],
  }),
  component: HallsPage,
});

const HALL_BLURB: Record<Hall, string> = {
  healing: "rooms where something quietly shifted.",
  brave: "rooms where someone said the unsayable.",
  relatable: "rooms where the whole stream went 'omg same.'",
  loving: "rooms that held more love than they meant to.",
};

const HALL_ORDER: Hall[] = ["healing", "brave", "relatable", "loving"];

function HallsPage() {
  useShutapBody();
  return (
    <div style={{ background: "#fdf0f5", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <main style={{ maxWidth: 740, margin: "0 auto", padding: "32px 22px 120px" }}>
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
              background: "#c1a02b",
              animation: "shutap-breathe 3s ease-in-out infinite",
              display: "block",
            }}
          />
          halls of fame
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
          the rooms the stream kept coming back to.
        </h1>
        <p style={{ ...serif, fontSize: 15.5, color: "#6b4a5c", margin: "0 0 32px", maxWidth: "52ch" }}>
          nothing is upvoted here. these are the ones the room sat with longest.
        </p>

        {HALL_ORDER.map((hall) => {
          const rooms = ROOMS.filter((r) => r.hall === hall);
          if (rooms.length === 0) return null;
          return (
            <section key={hall} style={{ marginBottom: 36 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  borderBottom: ".5px solid rgba(11,8,15,.08)",
                  paddingBottom: 10,
                }}
              >
                <h2
                  style={{
                    ...sans,
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "-.01em",
                    color: "#0b080f",
                    margin: 0,
                  }}
                >
                  {HALL_LABEL[hall]}
                </h2>
                <span style={{ ...serif, fontSize: 13, color: "#9e7a8c" }}>{HALL_BLURB[hall]}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rooms.map((r) => (
                  <Link
                    key={r.id}
                    to="/room/$id"
                    params={{ id: r.id }}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        border: ".5px solid rgba(11,8,15,.08)",
                        borderRadius: 16,
                        padding: "16px 18px",
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        boxShadow: "0 8px 22px -20px rgba(60,10,30,.35)",
                      }}
                    >
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "#f7e8f0",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 20,
                          flex: "none",
                        }}
                      >
                        {r.emoji}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <SupportPill heard={r.support === "heard"} />
                          <span style={{ ...serif, fontSize: 12, color: "#9e7a8c" }}>{r.alias}</span>
                        </div>
                        <div
                          style={{
                            ...sans,
                            fontStyle: "normal",
                            fontWeight: 600,
                            fontSize: 14.5,
                            lineHeight: 1.35,
                            color: "#0b080f",
                          }}
                        >
                          {r.title}
                        </div>
                      </div>
                      <div style={{ ...serif, textAlign: "right", color: "#9e7a8c", fontSize: 12.5, flex: "none" }}>
                        <div>
                          <b style={{ color: "#c1216b", fontStyle: "normal" }}>{r.relates}</b> said 'omg same'
                        </div>
                        <div style={{ marginTop: 3 }}>{r.sitting} sitting in</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <CompanionBubble />
    </div>
  );
}
