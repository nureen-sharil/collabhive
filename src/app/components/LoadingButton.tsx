import { useState, useEffect, CSSProperties, ReactNode } from "react";

type BtnState = "idle" | "loading" | "success";

interface LoadingButtonProps {
  /** Called after the success animation completes — use this to navigate */
  onComplete: () => void;
  /** Disable the button before it's tapped (e.g. form not valid) */
  disabled?: boolean;
  label: ReactNode;
  successLabel?: ReactNode;
  style?: CSSProperties;
  /** ms for the loading phase (default 1400) */
  loadingMs?: number;
  /** ms for the success phase before onComplete fires (default 900) */
  successMs?: number;
}

// Simple SVG spinner — no external dep, no React context
function Spinner({ color = "white" }: { color?: string }) {
  return (
    <svg
      width={20} height={20} viewBox="0 0 20 20"
      style={{ animation: "collabhive-spin 0.8s linear infinite", flexShrink: 0 }}
    >
      <circle cx={10} cy={10} r={8} fill="none" stroke={color} strokeWidth={2.5} strokeOpacity={0.25} />
      <path d="M10 2 a8 8 0 0 1 8 8" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <style>{`@keyframes collabhive-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// Animated checkmark
function Checkmark({ color = "white" }: { color?: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
      <circle cx={10} cy={10} r={9} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.4} />
      <polyline
        points="5,10 8.5,13.5 15,7"
        fill="none" stroke={color} strokeWidth={2.2}
        strokeLinecap="round" strokeLinejoin="round"
        style={{
          strokeDasharray: 20,
          strokeDashoffset: 0,
          animation: "collabhive-draw 0.35s ease-out forwards",
        }}
      />
      <style>{`@keyframes collabhive-draw { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  );
}

export function LoadingButton({
  onComplete,
  disabled = false,
  label,
  successLabel,
  style = {},
  loadingMs = 1400,
  successMs = 900,
}: LoadingButtonProps) {
  const [state, setState] = useState<BtnState>("idle");

  const handleClick = () => {
    if (disabled || state !== "idle") return;
    setState("loading");
  };

  useEffect(() => {
    if (state === "loading") {
      const t = setTimeout(() => setState("success"), loadingMs);
      return () => clearTimeout(t);
    }
    if (state === "success") {
      const t = setTimeout(() => { setState("idle"); onComplete(); }, successMs);
      return () => clearTimeout(t);
    }
  }, [state]);

  const isLoading = state === "loading";
  const isSuccess = state === "success";
  const isActive  = !disabled && state === "idle";

  const baseStyle: CSSProperties = {
    width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
    fontSize: 15, fontWeight: 700, cursor: isActive ? "pointer" : "default",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "background 0.25s, transform 0.1s",
    transform: isLoading ? "scale(0.98)" : "scale(1)",
    ...style,
    background:
      isSuccess ? "#16A34A" :
      isLoading ? (style.background ? String(style.background) : "#374151") :
      disabled   ? "#E5E7EB" :
      (style.background ?? "#111827"),
    color: disabled && !isLoading && !isSuccess ? "#9CA3AF" : "white",
  };

  return (
    <button onClick={handleClick} disabled={disabled && state === "idle"} style={baseStyle}>
      {isLoading && <Spinner />}
      {isSuccess && <Checkmark />}
      {isLoading ? "Processing…" : isSuccess ? (successLabel ?? "Done!") : label}
    </button>
  );
}
