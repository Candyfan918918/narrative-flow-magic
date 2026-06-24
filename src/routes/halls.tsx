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
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
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
            color: "var(--text-2)",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--mood-ask)",
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
            fontSize: "var(--text-3xl)",
            lineHeight: 1.15,
            letterSpacing: "var(--tracking-tight)",
            margin: "0 0 8px",
            color: "var(--ink)",
          }}
        >
          the rooms the stream kept coming back to.
        </h1>
        <p style={{ ...serif, fontSize: 15.5, color: "var(--text-2)", margin: "0 0 32px", maxWidth: "52ch" }}>
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
                  borderBottom: ".5px solid var(--border)",
                  paddingBottom: 10,
                }}
              >
                <h2
                  style={{
                    ...sans,
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "var(--tracking-tight)",
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {HALL_LABEL[hall]}
                </h2>
                <span style={{ ...serif, fontSize: 13, color: "var(--text-3)" }}>{HALL_BLURB[hall]}</span>
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
                        background: "var(--surface)",
                        border: ".5px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "16px 18px",
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "var(--surface-2)",
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
                          <span style={{ ...serif, fontSize: 12, color: "var(--text-3)" }}>{r.alias}</span>
                        </div>
                        <div
                          style={{
                            ...sans,
                            fontWeight: 600,
                            fontSize: 14.5,
                            lineHeight: 1.35,
                            color: "var(--ink)",
                          }}
                        >
                          {r.title}
                        </div>
                      </div>
                      <div style={{ ...serif, textAlign: "right", color: "var(--text-3)", fontSize: 12.5, flex: "none" }}>
                        <div>
                          <b style={{ color: "var(--pink)", fontStyle: "normal" }}>{r.relates}</b> said 'omg same'
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
