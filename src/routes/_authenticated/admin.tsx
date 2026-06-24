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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Shutap" },
      { name: "description", content: "Quiet keepers' panel." },
    ],
  }),
  component: AdminPage,
});

type AliasRow = {
  user_id: string;
  display_name: string;
  emoji: string;
  emotion: string;
  nation: string;
  creature: string;
  created_at: string;
};

function AdminPage() {
  useShutapBody();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [aliases, setAliases] = useState<AliasRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!active) return;
      if (!role) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      const { data: rows } = await supabase
        .from("aliases")
        .select("user_id,display_name,emoji,emotion,nation,creature,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!active) return;
      setAliases((rows as AliasRow[] | null) ?? []);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (allowed === null) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <EyeDefs />
        <SiteHeader />
        <main style={{ maxWidth: 740, margin: "0 auto", padding: 32 }}>
          <p style={{ ...serif, color: "var(--text-3)" }}>checking the keys…</p>
        </main>
      </div>
    );
  }

  if (allowed === false) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <EyeDefs />
        <SiteHeader />
        <main style={{ maxWidth: 540, margin: "0 auto", padding: "48px 22px", textAlign: "center" }}>
          <h1 style={{ ...serif, fontWeight: 400, fontSize: "var(--text-2xl)", color: "var(--ink)", margin: "0 0 10px" }}>
            this room isn't for you — yet.
          </h1>
          <p style={{ ...serif, fontSize: 15, color: "var(--text-2)" }}>
            the admin panel is for the keepers. ask one to add your name.
          </p>
        </main>
      </div>
    );
  }

  const filtered = query.trim()
    ? aliases.filter((a) => a.display_name.toLowerCase().includes(query.toLowerCase()))
    : aliases;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <EyeDefs />
      <SiteHeader />
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "32px 22px 120px" }}>
        <div style={{ ...serif, fontSize: 14, color: "var(--text-2)", marginBottom: 10 }}>
          quiet keepers
        </div>
        <h1
          style={{
            ...serif,
            fontWeight: 400,
            fontSize: "var(--text-3xl)",
            lineHeight: 1.15,
            margin: "0 0 6px",
            color: "var(--ink)",
          }}
        >
          {aliases.length} aliases in the stream.
        </h1>
        <p style={{ ...serif, fontSize: 15, color: "var(--text-2)", margin: "0 0 24px" }}>
          read-only for now. no upvotes here either.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search by alias…"
          style={{
            ...sans,
            width: "100%",
            padding: "12px 16px",
            border: ".5px solid var(--border)",
            background: "var(--surface)",
            borderRadius: 999,
            fontSize: 14,
            color: "var(--ink)",
            marginBottom: 18,
            outline: "none",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((a) => (
            <div
              key={a.user_id}
              style={{
                background: "var(--surface)",
                border: ".5px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--surface-2)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  flex: "none",
                }}
              >
                {a.emoji}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...sans, fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
                  {a.display_name}
                </div>
                <div style={{ ...serif, fontSize: 12, color: "var(--text-3)" }}>
                  {a.emotion} · {a.nation} · {a.creature}
                </div>
              </div>
              <div style={{ ...serif, fontSize: 12, color: "var(--text-3)", flex: "none" }}>
                {new Date(a.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ ...serif, color: "var(--text-3)", textAlign: "center", padding: 32 }}>
              nobody by that name in the stream yet.
            </p>
          )}
        </div>
      </main>
      <CompanionBubble />
    </div>
  );
}
