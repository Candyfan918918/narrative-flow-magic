import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CompanionBubble,
  EyeDefs,
  SiteHeader,
  sans,
  serif,
  useShutapBody,
} from "@/components/shutap";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your alias — Shutap" },
      { name: "description", content: "The pseudonym the stream knows you by." },
    ],
  }),
  component: ProfilePage,
});

type AliasRow = {
  emotion: string;
  nation: string;
  creature: string;
  emoji: string;
  display_name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  created_at: string;
};

function ProfilePage() {
  useShutapBody();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [alias, setAlias] = useState<AliasRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user || !active) return;
      setEmail(u.user.email ?? "");
      const [aliasRes, roleRes] = await Promise.all([
        supabase
          .from("aliases")
          .select("emotion,nation,creature,emoji,display_name,birth_year,birth_month,birth_day,created_at")
          .eq("user_id", u.user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle(),
      ]);
      if (!active) return;
      setAlias((aliasRes.data as AliasRow | null) ?? null);
      setIsAdmin(!!roleRes.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 22px 120px" }}>
        <div style={{ ...serif, fontSize: 14, color: "var(--text-2)", marginBottom: 10 }}>
          your corner of the stream
        </div>
        <h1
          style={{
            ...serif,
            fontWeight: 400,
            fontSize: "var(--text-3xl)",
            lineHeight: 1.15,
            letterSpacing: "var(--tracking-tight)",
            margin: "0 0 24px",
            color: "var(--ink)",
          }}
        >
          {alias ? `the stream knows you as ${alias.display_name.toLowerCase()}.` : "your alias is still forming."}
        </h1>

        {loading ? (
          <p style={{ ...serif, color: "var(--text-3)" }}>gathering your shape…</p>
        ) : alias ? (
          <section
            style={{
              background: "var(--surface)",
              border: ".5px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              boxShadow: "var(--shadow-card)",
              marginBottom: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <span
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 32,
                  flex: "none",
                }}
              >
                {alias.emoji}
              </span>
              <div>
                <div style={{ ...sans, fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>
                  {alias.display_name}
                </div>
                <div style={{ ...serif, fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
                  joined {new Date(alias.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </div>
              </div>
            </div>
            <dl style={{ ...serif, fontSize: 14, color: "var(--text-2)", display: "grid", gap: 8, margin: 0 }}>
              <Row label="emotion" value={alias.emotion} />
              <Row label="nation" value={alias.nation} />
              <Row label="creature" value={alias.creature} />
              <Row label="email" value={email} />
            </dl>
          </section>
        ) : (
          <p style={{ ...serif, color: "var(--text-3)" }}>
            no alias yet — finish the ceremony first.
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {isAdmin && (
            <a
              href="/admin"
              style={{
                ...sans,
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 16px",
                borderRadius: 999,
                background: "var(--ink)",
                color: "var(--bg)",
                textDecoration: "none",
              }}
            >
              admin →
            </a>
          )}
          <button
            onClick={signOut}
            style={{
              ...sans,
              fontWeight: 600,
              fontSize: 13,
              padding: "10px 16px",
              borderRadius: 999,
              background: "transparent",
              color: "var(--text-2)",
              border: ".5px solid var(--border)",
              cursor: "pointer",
            }}
          >
            sign out
          </button>
        </div>
      </main>
      <CompanionBubble />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderTop: ".5px solid var(--border)", paddingTop: 8 }}>
      <dt style={{ ...sans, fontStyle: "normal", fontSize: 12, color: "var(--text-3)", letterSpacing: ".05em", textTransform: "uppercase" }}>
        {label}
      </dt>
      <dd style={{ margin: 0, color: "var(--ink)" }}>{value}</dd>
    </div>
  );
}
