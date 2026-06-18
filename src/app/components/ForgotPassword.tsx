import { useState } from "react";
import { useNavigate } from "../router";
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function Spinner() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20"
      style={{ animation: "ch-spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx={10} cy={10} r={8} fill="none" stroke="white" strokeWidth={2.5} strokeOpacity={0.3} />
      <path d="M10 2 a8 8 0 0 1 8 8" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
      <style>{`@keyframes ch-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

type Step = "enter" | "loading" | "sent" | "notfound";

export function ForgotPassword() {
  const navigate = useNavigate();

  const [email,   setEmail]   = useState("");
  const [touched, setTouched] = useState(false);
  const [step,    setStep]    = useState<Step>("enter");

  const emailErr =
    touched && !email.trim()        ? "Email is required" :
    touched && !isValidEmail(email) ? "Email format is invalid" : "";

  const canSubmit = isValidEmail(email);

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;

    setStep("loading");
    setTimeout(() => {
      // Simulate: unknown email for demo
      if (email === "notfound@email.com") {
        setStep("notfound");
      } else {
        setStep("sent");
      }
    }, 1600);
  };

  const inputBox = (hasError: boolean): React.CSSProperties => ({
    width: "100%", border: `1.5px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 12, padding: "12px 14px 12px 38px", fontSize: 14, color: "#111827",
    background: hasError ? "#FFF5F5" : "#FAFAFA", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s",
  });

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={() => navigate("/login")} className="p-1">
          <ArrowLeft size={22} strokeWidth={2} color="#374151" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Forgot Password</span>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F5" }}>
        {step === "sent" ? (
          /* ── Success state ── */
          <div style={{ padding: "48px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Send size={36} color="#2563EB" />
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 12, textAlign: "center" }}>Check Your Email</p>
            <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.6, marginBottom: 8 }}>
              Reset link sent to:
            </p>
            <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "8px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#2563EB" }}>{email}</p>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 20, width: "100%", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Next steps:</p>
              {[
                "1. Open the email we just sent you",
                "2. Click the 'Reset Password' link",
                "3. Create your new password",
                "4. Sign in with your new password",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <CheckCircle size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: "#4B5563" }}>{step}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginBottom: 20 }}>
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button onClick={() => { setStep("enter"); setEmail(""); setTouched(false); }}
              style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", background: "none", border: "none", cursor: "pointer" }}>
              Try a different email
            </button>
          </div>
        ) : (
          /* ── Enter email state ── */
          <div style={{ padding: "32px 20px" }}>
            {/* Illustration */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Mail size={32} color="#2563EB" />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Reset your password</p>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
                Enter the email address linked to your account and we'll send you a reset link.
              </p>
            </div>

            {/* Not found banner */}
            {step === "notfound" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
                <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#B91C1C" }}>Email address not found</p>
                  <p style={{ fontSize: 12, color: "#DC2626", marginTop: 2 }}>No account is linked to this email address.</p>
                </div>
              </div>
            )}

            {/* Email input */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color={emailErr || step === "notfound" ? "#EF4444" : "#9CA3AF"}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (step === "notfound") setStep("enter"); }}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  style={inputBox(!!emailErr || step === "notfound")} />
              </div>
              {emailErr && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                  <AlertCircle size={12} color="#EF4444" />
                  <p style={{ fontSize: 12, color: "#EF4444" }}>{emailErr}</p>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button onClick={handleSubmit} disabled={step === "loading"}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: step === "loading" ? "#1D4ED8" : canSubmit ? "#2563EB" : "#93C5FD",
                color: "white", fontSize: 15, fontWeight: 700,
                cursor: step === "loading" || !canSubmit ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s", marginBottom: 20,
                boxShadow: canSubmit ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
              }}>
              {step === "loading" ? <><Spinner /> Sending Reset Link…</> : "Send Reset Link"}
            </button>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/login")}
                style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>
                ← Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
