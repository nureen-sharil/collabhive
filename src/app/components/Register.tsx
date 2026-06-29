import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { buildApiUrl } from "../../lib/api";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function getPasswordRequirements(pw: string) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[@#$%&!^*()_\-+=\[\]{};':"\\|,.<>\/?`~]/.test(pw),
  };
}

function getStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  const req = getPasswordRequirements(pw);
  const count = Object.values(req).filter(Boolean).length;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  return 3;
}

const STRENGTH_META = [
  { label: "",       color: "#E5E7EB" },
  { label: "Weak",   color: "#EF4444" },
  { label: "Medium", color: "#F97316" },
  { label: "Strong", color: "#16A34A" },
];

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

export function Register() {
  const navigate = useNavigate();

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched,     setTouch]       = useState({ name: false, email: false, password: false, confirm: false });
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [emailTaken,  setEmailTaken]  = useState(false);
  const [serverError, setServerError] = useState("");

  const strength = getStrength(password);
  const sm = STRENGTH_META[strength];
  const passwordReqs = getPasswordRequirements(password);
  const passwordValid = Object.values(passwordReqs).every(Boolean);

  // Field errors
  const nameErr    = touched.name    && !name.trim()            ? "Full name is required" : "";
  const emailErr   = touched.email   && !email.trim()           ? "Email is required" :
                     touched.email   && !isValidEmail(email)    ? "Email format is invalid" :
                     touched.email   && emailTaken              ? "Email already exists" : "";
  const passErr    = touched.password && !password              ? "Password is required" :
                     touched.password && !passwordValid         ? "Password does not meet all requirements" : "";
  const confirmErr = touched.confirm && !confirm                ? "Please confirm your password" :
                     touched.confirm && confirm !== password     ? "Passwords do not match" : "";

  const canSubmit = name.trim() && isValidEmail(email) && passwordValid && confirm === password;

  const handleRegister = async () => {
    setTouch({ name: true, email: true, password: true, confirm: true });
    if (!canSubmit) return;

    setLoading(true);
    setServerError("");

    try {
      // Send user data to your actual backend API to save it in the database
      const response = await fetch(buildApiUrl("/api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          setEmailTaken(true);
        } else {
          setServerError("Server error. Please check your backend.");
        }
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setServerError("Could not connect to the server. Is the backend running?");
    }
  };

  const inputBox = (hasError: boolean): React.CSSProperties => ({
    width: "100%", border: `1.5px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#111827",
    background: hasError ? "#FFF5F5" : "#FAFAFA", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.2s",
  });

  const FieldError = ({ msg }: { msg: string }) =>
    msg ? (
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
        <AlertCircle size={12} color="#EF4444" />
        <p style={{ fontSize: 12, color: "#EF4444" }}>{msg}</p>
      </div>
    ) : null;

  if (success) {
    return (
      <PhoneFrame indicatorBg="#F0FDF4">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: "#F0FDF4" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <CheckCircle size={36} color="#16A34A" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 10, textAlign: "center" }}>Account Created!</p>
          <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.5 }}>
            Account created successfully!{"\n"}Please log in to continue.
          </p>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>Redirecting to login…</p>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F5" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#1E3A5F,#2563EB)", padding: "40px 28px 30px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>🐝</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 4 }}>Create Account</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>Join CollabHive and collaborate better</p>
        </div>

        <div style={{ padding: "24px 20px" }}>
        {/* Server error banner */}
        {serverError && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#B91C1C", flex: 1 }}>{serverError}</p>
          </div>
        )}

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} color={nameErr ? "#EF4444" : "#9CA3AF"} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, name: true }))}
                placeholder="Your full name"
                style={{ ...inputBox(!!nameErr), paddingLeft: 38 }} />
            </div>
            <FieldError msg={nameErr} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color={emailErr ? "#EF4444" : "#9CA3AF"} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); }}
                onBlur={() => setTouch((t) => ({ ...t, email: true }))}
                placeholder="you@example.com"
                style={{ ...inputBox(!!emailErr), paddingLeft: 38 }} />
            </div>
            <FieldError msg={emailErr} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color={passErr ? "#EF4444" : "#9CA3AF"} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type={showPass ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, password: true }))}
                placeholder="Min. 8 characters"
                style={{ ...inputBox(!!passErr), paddingLeft: 38, paddingRight: 42 }} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                {showPass ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3].map((lvl) => (
                    <div key={lvl} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: strength >= lvl ? sm.color : "#E5E7EB",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: sm.color, fontWeight: 600 }}>
                  {sm.label && `Password strength: ${sm.label}`}
                </p>
              </div>
            )}

            {/* Requirements checklist */}
            {(password.length > 0 || touched.password) && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                {([
                  { key: "length",    label: "At least 8 characters" },
                  { key: "uppercase", label: "At least one uppercase letter (A–Z)" },
                  { key: "lowercase", label: "At least one lowercase letter (a–z)" },
                  { key: "number",    label: "At least one number (0–9)" },
                  { key: "special",   label: "At least one special character (@, #, $, %, &, !)" },
                ] as { key: keyof ReturnType<typeof getPasswordRequirements>; label: string }[]).map(({ key, label }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {passwordReqs[key]
                      ? <CheckCircle size={12} color="#16A34A" />
                      : <AlertCircle size={12} color={touched.password ? "#EF4444" : "#9CA3AF"} />}
                    <span style={{ fontSize: 11, color: passwordReqs[key] ? "#16A34A" : touched.password ? "#EF4444" : "#6B7280" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <FieldError msg={passErr} />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Confirm Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color={confirmErr ? "#EF4444" : "#9CA3AF"} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input type={showConfirm ? "text" : "password"} value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, confirm: true }))}
                placeholder="Re-enter password"
                style={{ ...inputBox(!!confirmErr), paddingLeft: 38, paddingRight: 42 }} />
              <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                {showConfirm ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
              </button>
            </div>
            {/* Match indicator */}
            {confirm.length > 0 && !confirmErr && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                <CheckCircle size={12} color="#16A34A" />
                <p style={{ fontSize: 12, color: "#16A34A" }}>Passwords match</p>
              </div>
            )}
            <FieldError msg={confirmErr} />
          </div>

          {/* Register button */}
          <button onClick={handleRegister} disabled={loading}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
              background: loading ? "#1D4ED8" : canSubmit ? "#2563EB" : "#93C5FD",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: loading || !canSubmit ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s", marginBottom: 20,
              boxShadow: canSubmit ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
            }}>
            {loading ? <><Spinner /> Creating Account…</> : "Create Account"}
          </button>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>Already have an account? </span>
            <button onClick={() => navigate("/login")} style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
