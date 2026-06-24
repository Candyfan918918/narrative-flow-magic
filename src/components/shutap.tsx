import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

export function useShutapBody() {
  useEffect(() => {
    document.body.classList.add("shutap");
    return () => document.body.classList.remove("shutap");
  }, []);
}

export const serif: React.CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontStyle: "italic",
};
export const sans: React.CSSProperties = { fontFamily: "'Sora', sans-serif" };

export function EyeDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
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

export function Eye({ w, h, blink = false }: { w: number; h: number; blink?: boolean }) {
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
      <svg viewBox="0 0 140 96" fill="none" style={{ display: "block", width: "100%", height: "100%" }}>
        <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
        <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
        <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
        <path d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z" fill="#fff" opacity=".95" />
        <path d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z" fill="#fff" opacity=".95" />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  return (
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
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
          <Eye w={32} h={23} blink />
          <span style={{ ...sans, fontStyle: "normal", fontWeight: 800, fontSize: 19, letterSpacing: "-.04em", color: "#0b080f" }}>
            shut<span style={{ color: "#e7548a" }}>ap</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            to="/halls"
            style={{ ...serif, fontSize: 14, color: "#6b4a5c", textDecoration: "none", padding: "6px 12px" }}
          >
            halls
          </Link>
          <Link
            to="/profile"
            style={{ ...serif, fontSize: 14, color: "#6b4a5c", textDecoration: "none", padding: "6px 12px" }}
          >
            you
          </Link>
          <Link
            to="/auth"
            style={{
              ...sans,
              display: "inline-flex",
              alignItems: "center",
              background: "#e7548a",
              color: "#fff",
              borderRadius: 999,
              padding: "9px 18px",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            join →
          </Link>
        </div>
      </div>
    </header>
  );
}

export function CompanionBubble() {
  return (
    <Link
      to="/auth"
      aria-label="Open a room"
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "shutap-pulse 4s infinite",
        textDecoration: "none",
      }}
    >
      <svg viewBox="0 0 56 56" fill="none" style={{ width: 32, height: 32, display: "block", pointerEvents: "none" }}>
        <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
        <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
        <ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG)" />
        <ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG)" />
      </svg>
    </Link>
  );
}

export function SupportPill({ heard }: { heard: boolean }) {
  return (
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
  );
}
