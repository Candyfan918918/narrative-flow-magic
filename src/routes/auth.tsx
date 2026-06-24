import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { rollAlias, isAdult, type Alias } from "@/lib/shutap-alias";
import { EyeDefs } from "@/components/shutap";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "shutap — before the room hears you, you need a name." },
      {
        name: "description",
        content:
          "Shutap is a pseudonymous community where people vent about relationships, marriage, family, and work — and share what actually happened next.",
      },
      { property: "og:title", content: "shutap — speak up" },
      {
        property: "og:description",
        content: "No real name. No email if you don't want. Just a room and your voice.",
      },
    ],
  }),
  component: AuthPage,
});

type Step = "auth" | "age" | "alias" | "contract";

const dark = {
  bg: "#1a0a12",
  surface: "rgba(255,255,255,0.05)",
  surfaceHover: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.14)",
  borderStrong: "rgba(255,255,255,0.25)",
  text: "#f7e8f0",
  text2: "#c4a0b2",
  text3: "#9e7a8c",
  pink: "#e7548a",
};

const sora: React.CSSProperties = { fontFamily: "'Sora',system-ui,sans-serif" };
const serif: React.CSSProperties = {
  fontFamily: "'Newsreader',Georgia,serif",
  fontStyle: "italic",
};

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 18+ gate
  const today = new Date();
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear() - 25);

  // alias
  const [alias, setAlias] = useState<Alias>(() => rollAlias());

  useEffect(() => {
    document.body.classList.add("shutap-dark");
    return () => document.body.classList.remove("shutap-dark");
  }, []);

  // Detect existing session — skip auth step; route based on alias existence.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted || !data.session) return;
      const uid = data.session.user.id;
      const { data: existing } = await supabase
        .from("aliases")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();
      if (existing) {
        navigate({ to: "/" });
      } else {
        setStep("age");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function signInGoogle() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Google sign-in failed.");
  }

  async function signInApple() {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin + "/auth",
    });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "Apple sign-in failed.");
  }

  async function signInEmail() {
    setError(null);
    if (!email || !password) {
      setError("we need an email and a password.");
      return;
    }
    setBusy(true);
    const fn = authMode === "signup" ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { data, error } = await fn({
      email,
      password,
      ...(authMode === "signup"
        ? { options: { emailRedirectTo: window.location.origin + "/auth" } }
        : {}),
    } as never);
    setBusy(false);
    if (error) {
      setError(error.message.toLowerCase());
      return;
    }
    if (data.session) setStep("age");
    else setError("check your email to confirm, then come back.");
  }

  function confirmAge() {
    setError(null);
    if (!isAdult(year, month, day)) {
      setError("shutap is 18 and over. come back when life has caught up with you.");
      return;
    }
    setStep("alias");
  }

  async function commitAlias() {
    setError(null);
    setBusy(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) {
      setBusy(false);
      setError("your session expired. let's try again.");
      setStep("auth");
      return;
    }
    const { error } = await supabase.from("aliases").upsert({
      user_id: uid,
      emotion: alias.emotion,
      nation: alias.nation,
      creature: alias.creature,
      emoji: alias.emoji,
      display_name: alias.display_name,
      birth_year: year,
      birth_month: month,
      birth_day: day,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    try {
      localStorage.setItem(
        "shutap_alias",
        JSON.stringify({ name: alias.display_name, emoji: alias.emoji }),
      );
    } catch {
      /* ignore */
    }
    setStep("contract");
  }

  function finish() {
    try {
      localStorage.setItem("shutap_seen_contract", "1");
    } catch {
      /* ignore */
    }
    let target = "/";
    try {
      target = sessionStorage.getItem("shutap_returnTo") || "/";
      sessionStorage.removeItem("shutap_returnTo");
    } catch {
      /* ignore */
    }
    navigate({ to: target });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark.bg,
        color: dark.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <EyeDefs />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          animation: "shutap-fadeup .42s ease both",
        }}
      >
        {step === "auth" && (
          <AuthStep
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
            mode={authMode}
            setMode={setAuthMode}
            busy={busy}
            error={error}
            onGoogle={signInGoogle}
            onApple={signInApple}
            onEmail={signInEmail}
          />
        )}
        {step === "age" && (
          <AgeStep
            day={day}
            month={month}
            year={year}
            setDay={setDay}
            setMonth={setMonth}
            setYear={setYear}
            onNext={confirmAge}
            error={error}
          />
        )}
        {step === "alias" && (
          <AliasStep
            alias={alias}
            onReroll={() => setAlias(rollAlias())}
            onAccept={commitAlias}
            busy={busy}
            error={error}
          />
        )}
        {step === "contract" && <ContractStep alias={alias} onFinish={finish} />}
      </div>
    </div>
  );
}

/* ---------- Step components ---------- */

function BrandHeader({ tagline }: { tagline: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 28 }}>
      <span
        style={{
          display: "block",
          width: 52,
          height: 37,
          margin: "0 auto 18px",
          animation: "shutap-eblink 3.4s infinite",
          transformOrigin: "center",
        }}
      >
        <svg viewBox="0 0 140 96" fill="none" style={{ display: "block", width: "100%", height: "100%" }}>
          <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
          <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
          <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
          <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        </svg>
      </span>
      <div style={{ ...sora, fontWeight: 800, fontSize: 26, letterSpacing: "-.04em", marginBottom: 10 }}>
        shut<span style={{ color: dark.pink }}>ap</span>
      </div>
      <div style={{ ...serif, fontSize: 18, lineHeight: 1.45, color: dark.text2 }}>{tagline}</div>
    </div>
  );
}

function OAuthBtn({
  onClick,
  busy,
  children,
}: {
  onClick: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
        padding: "15px 20px",
        borderRadius: 14,
        border: `1px solid ${dark.border}`,
        background: dark.surface,
        cursor: busy ? "wait" : "pointer",
        fontFamily: "Inter,sans-serif",
        fontWeight: 600,
        fontSize: 15,
        color: dark.text,
        transition: ".18s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = dark.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = dark.surface)}
    >
      {children}
    </button>
  );
}

function AuthStep(props: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  mode: "signin" | "signup";
  setMode: (m: "signin" | "signup") => void;
  busy: boolean;
  error: string | null;
  onGoogle: () => void;
  onApple: () => void;
  onEmail: () => void;
}) {
  return (
    <>
      <BrandHeader
        tagline={
          <>
            before the room hears you,
            <br />
            <span style={{ color: dark.text }}>you need a name.</span>
          </>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <OAuthBtn onClick={props.onGoogle} busy={props.busy}>
          <GoogleIcon /> continue with Google
        </OAuthBtn>
        <OAuthBtn onClick={props.onApple} busy={props.busy}>
          <AppleIcon /> continue with Apple
        </OAuthBtn>
        <Divider />
        <input
          type="email"
          placeholder="your email"
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
          autoComplete="email"
          style={inputStyle}
        />
        <input
          type="password"
          placeholder={props.mode === "signup" ? "set a password" : "your password"}
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && props.onEmail()}
          autoComplete={props.mode === "signup" ? "new-password" : "current-password"}
          style={inputStyle}
        />
        <button
          onClick={props.onEmail}
          disabled={props.busy}
          style={{
            ...sora,
            padding: "13px 18px",
            background: dark.pink,
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: props.busy ? "wait" : "pointer",
          }}
        >
          {props.mode === "signup" ? "join →" : "sign in →"}
        </button>
        <button
          onClick={() => props.setMode(props.mode === "signup" ? "signin" : "signup")}
          style={{
            ...serif,
            background: "transparent",
            border: "none",
            color: dark.text3,
            fontSize: 13,
            padding: 4,
            cursor: "pointer",
          }}
        >
          {props.mode === "signup" ? "already have an alias? sign in →" : "new here? make an alias →"}
        </button>
      </div>
      {props.error && <ErrorLine>{props.error}</ErrorLine>}
      <div
        style={{
          textAlign: "center",
          ...serif,
          fontSize: 12.5,
          color: dark.text3,
          marginTop: 22,
        }}
      >
        18+ only · your real name is never attached to anything here
      </div>
    </>
  );
}

function AgeStep(props: {
  day: number;
  month: number;
  year: number;
  setDay: (n: number) => void;
  setMonth: (n: number) => void;
  setYear: (n: number) => void;
  onNext: () => void;
  error: string | null;
}) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => thisYear - 18 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, textAlign: "center" }}>
      <div>
        <div style={{ ...serif, fontSize: 22, lineHeight: 1.4, marginBottom: 8 }}>one small thing first.</div>
        <div
          style={{
            ...serif,
            fontSize: 15,
            color: dark.text2,
            lineHeight: 1.55,
            maxWidth: "34ch",
            margin: "0 auto",
          }}
        >
          shutap is 18 and over. some of what's shared here is honest in ways that need a little life experience to hold.
        </div>
      </div>
      <div>
        <div
          style={{
            ...sora,
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: dark.text3,
            marginBottom: 14,
          }}
        >
          your date of birth
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <SpinnerSelect label="Day" value={props.day} onChange={props.setDay} options={days} />
          <SpinnerSelect
            label="Month"
            value={props.month}
            onChange={props.setMonth}
            options={months.map((_, i) => i + 1)}
            renderOption={(v) => months[v - 1]!}
            width={100}
          />
          <SpinnerSelect label="Year" value={props.year} onChange={props.setYear} options={years} width={92} />
        </div>
      </div>
      {props.error && <ErrorLine>{props.error}</ErrorLine>}
      <button
        onClick={props.onNext}
        style={{
          ...sora,
          padding: "15px 22px",
          background: dark.pink,
          border: "none",
          borderRadius: 14,
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        i'm 18 or older →
      </button>
    </div>
  );
}

function SpinnerSelect({
  label,
  value,
  onChange,
  options,
  renderOption,
  width = 74,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: number[];
  renderOption?: (v: number) => string;
  width?: number;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
      <span style={{ ...sora, fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: dark.text3 }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width,
          padding: "12px 8px",
          borderRadius: 14,
          background: dark.surface,
          border: `1px solid ${dark.border}`,
          color: dark.text,
          fontFamily: "Inter,sans-serif",
          fontSize: 15,
          textAlign: "center",
          appearance: "none",
        }}
      >
        {options.map((v) => (
          <option key={v} value={v} style={{ background: dark.bg }}>
            {renderOption ? renderOption(v) : v}
          </option>
        ))}
      </select>
    </label>
  );
}

function AliasStep(props: {
  alias: Alias;
  onReroll: () => void;
  onAccept: () => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, textAlign: "center" }}>
      <div>
        <div style={{ ...serif, fontSize: 22, lineHeight: 1.4, marginBottom: 8 }}>
          the room will remember you as…
        </div>
        <div style={{ ...serif, fontSize: 14, color: dark.text2, maxWidth: "32ch", margin: "0 auto" }}>
          tap reshape until one feels like you. no real name, ever.
        </div>
      </div>
      <div
        key={props.alias.display_name}
        style={{
          background: dark.surface,
          border: `1px solid ${dark.border}`,
          borderRadius: 22,
          padding: "32px 26px",
          animation: "shutap-pop .35s ease both",
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#f060a0,#3a1020)",
            display: "grid",
            placeItems: "center",
            fontSize: 42,
            margin: "0 auto 16px",
            boxShadow: "0 10px 24px -10px rgba(193,33,107,.55)",
          }}
        >
          {props.alias.emoji}
        </div>
        <div style={{ ...sora, fontWeight: 700, fontSize: 22, letterSpacing: "-.01em", marginBottom: 6 }}>
          {props.alias.display_name}
        </div>
        <div style={{ ...serif, fontSize: 13, color: dark.text3 }}>this is who you are in the rooms.</div>
      </div>
      {props.error && <ErrorLine>{props.error}</ErrorLine>}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={props.onReroll}
          disabled={props.busy}
          style={{
            ...serif,
            background: "transparent",
            border: `1.5px solid ${dark.border}`,
            borderRadius: 999,
            padding: "11px 20px",
            fontSize: 14,
            color: dark.text,
            cursor: "pointer",
          }}
        >
          reshape this one →
        </button>
        <button
          onClick={props.onAccept}
          disabled={props.busy}
          style={{
            ...sora,
            background: dark.pink,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 13,
            cursor: props.busy ? "wait" : "pointer",
          }}
        >
          {props.busy ? "saving…" : "i'll be them →"}
        </button>
      </div>
    </div>
  );
}

function ContractStep({ alias, onFinish }: { alias: Alias; onFinish: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, textAlign: "center" }}>
      <div style={{ fontSize: 44 }}>{alias.emoji}</div>
      <div>
        <div style={{ ...serif, fontSize: 24, lineHeight: 1.4, marginBottom: 10 }}>
          welcome, {alias.display_name.toLowerCase()}.
        </div>
        <p
          style={{
            ...serif,
            fontSize: 16,
            color: dark.text2,
            lineHeight: 1.6,
            maxWidth: "36ch",
            margin: "0 auto",
          }}
        >
          this is where you're heard. advice only if you ask. real people, no judging.
        </p>
      </div>
      <button
        onClick={onFinish}
        style={{
          ...sora,
          background: dark.pink,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "13px 26px",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          alignSelf: "center",
        }}
      >
        slip into the rooms →
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "6px 0" }}>
      <div style={{ flex: 1, height: 0.5, background: dark.border }} />
      <span style={{ ...serif, fontSize: 13, color: dark.text3 }}>or</span>
      <div style={{ flex: 1, height: 0.5, background: dark.border }} />
    </div>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        ...serif,
        fontSize: 13,
        color: "#ffb3b3",
        background: "rgba(226,75,74,.10)",
        border: "1px solid rgba(226,75,74,.30)",
        borderRadius: 12,
        padding: "10px 12px",
        textAlign: "center",
        marginTop: 6,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: dark.surface,
  border: `1px solid ${dark.border}`,
  borderRadius: 12,
  padding: "13px 15px",
  color: dark.text,
  fontFamily: "Inter,sans-serif",
  fontSize: 15,
  outline: "none",
};

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z" />
      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={dark.text} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
