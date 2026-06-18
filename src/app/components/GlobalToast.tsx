import { CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "../context/ToastStore";

export function GlobalToast() {
  const toast = useToast();
  if (!toast) return null;

  const config = {
    success: { bg: "#111827", icon: CheckCircle, color: "#22C55E" },
    info:    { bg: "#1D4ED8", icon: Info,         color: "#93C5FD" },
    error:   { bg: "#B91C1C", icon: AlertCircle,  color: "#FCA5A5" },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      key={toast.id}
      style={{
        position: "absolute",
        top: 58,          // just below the status bar
        left: 16,
        right: 16,
        background: config.bg,
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 70,
        boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        animation: "toast-slide 0.32s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      <style>{`
        @keyframes toast-slide {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      <Icon size={18} color={config.color} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "white", flex: 1 }}>
        {toast.message}
      </span>
    </div>
  );
}
