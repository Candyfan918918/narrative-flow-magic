import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Eye,
  EyeDefs,
  SiteHeader,
  sans,
  serif,
  useShutapBody,
} from "@/components/shutap";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Join Shutap — pick an alias" },
      {
        name: "description",
        content: "Join Shutap with a pseudonymous alias. No real name. No phone number. Just a room and your voice.",
      },
      { property: "og:title", content: "Join Shutap — pick an alias" },
      { property: "og:description", content: "Pick an alias. Open the rooms." },
    ],
  }),
  component: WelcomePage,
});

const ADJECTIVES = ["Quiet", "Defiant", "Mortified", "Patient", "Wistful", "Tender", "Hopeful", "Stubborn", "Gentle", "Restless"];
const ORIGINS = ["Nigerian", "Kenyan", "Polish", "Indian", "Ethiopian", "Brazilian", "Korean", "Greek", "Argentine", "Lebanese"];
const ANIMALS = [
  { name: "Swan", emoji: "🦢" },
  { name: "Lion", emoji: "🦁" },
  { name: "Hedgehog", emoji: "🦔" },
  { name: "Dove", emoji: "🕊" },
  { name: "Butterfly", emoji: "🦋" },
  { name: "Hare", emoji: "🐇" },
  { name: "Owl", emoji: "🦉" },
  { name: "Fox", emoji: "🦊" },
];

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function WelcomePage() {
  useShutapBody();
  const navigate = useNavigate();
  const initial = useMemo(() => {
    const a = pick(ADJECTIVES);
    const o = pick(ORIGINS);
    const an = pick(ANIMALS);
    return { name: `${a} ${o} ${an.name}`, emoji: an.emoji };
  }, []);
  const [alias, setAlias] = useState(initial);

  const reroll = () => {
    const a = pick(ADJECTIVES);
    const o = pick(ORIGINS);
    const an = pick(ANIMALS);
    setAlias({ name: `${a} ${o} ${an.name}`, emoji: an.emoji });
  };

  const accept = () => {
    try {
      localStorage.setItem("shutap_alias", JSON.stringify(alias));
    } catch {
      /* ignore */
    }
    navigate({ to: "/" });
  };

  return (
    <div style={{ background: "#fdf0f5", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "48px 22px 120px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Eye w={64} h={46} blink />
        </div>
        <h1
          style={{
            ...serif,
            fontWeight: 400,
            fontSize: "clamp(26px,5vw,34px)",
            lineHeight: 1.2,
            margin: "0 0 10px",
            color: "#0b080f",
          }}
        >
          you don't sign in here. you slip in.
        </h1>
        <p style={{ ...serif, fontSize: 15.5, color: "#6b4a5c", margin: "0 0 36px" }}>
          no real name. no email if you don't want. just an alias the room will
          remember you by.
        </p>

        <div
          style={{
            background: "#fff",
            border: ".5px solid rgba(11,8,15,.08)",
            borderRadius: 22,
            padding: "32px 26px",
            boxShadow: "0 18px 40px -28px rgba(60,10,30,.35)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f060a0,#890041)",
              display: "grid",
              placeItems: "center",
              fontSize: 36,
              margin: "0 auto 18px",
              boxShadow: "0 10px 24px -10px rgba(193,33,107,.45)",
            }}
          >
            {alias.emoji}
          </div>
          <div
            style={{
              ...sans,
              fontStyle: "normal",
              fontWeight: 700,
              fontSize: 20,
              color: "#0b080f",
              marginBottom: 6,
              letterSpacing: "-.01em",
            }}
          >
            {alias.name}
          </div>
          <div style={{ ...serif, fontSize: 13, color: "#9e7a8c", marginBottom: 22 }}>
            this is who you are in the rooms.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reroll}
              style={{
                ...serif,
                background: "#fff",
                border: "1.5px solid rgba(11,8,15,.12)",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 14,
                color: "#4a3040",
                cursor: "pointer",
              }}
            >
              reshape this one →
            </button>
            <button
              onClick={accept}
              style={{
                ...sans,
                fontStyle: "normal",
                background: "#e7548a",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "11px 22px",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              i'll be them →
            </button>
          </div>
        </div>

        <p style={{ ...serif, fontSize: 13, color: "#9e7a8c", marginTop: 22 }}>
          you can leave any room. you can leave shutap. nothing is kept that you
          didn't say out loud.
        </p>
      </main>
    </div>
  );
}
