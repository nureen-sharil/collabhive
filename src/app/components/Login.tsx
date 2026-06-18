import { useState } from "react";
import { useNavigate } from "../router";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
// COMMENT: Import authentication API and auth context to manage user login and data storage
import { authAPI } from "../../lib/api";
import { authStore } from "../context/AuthContext";
import { apiClient } from "../../lib/apiClient";

type FieldState = "idle" | "error" | "success";
type FormState  = "idle" | "loading" | "success" | "error";

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

export function Login() {
  const navigate = useNavigate();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [touched,     setTouch]       = useState({ email: false, password: false });
  const [formState,   setFormState]   = useState<FormState>("idle");
  const [serverError, setServerError] = useState("");

  // Field-level errors
  const emailErr =
    touched.email && !email.trim()         ? "Email is required" :
    touched.email && !isValidEmail(email)  ? "Email format is invalid" : "";

  const passErr =
    touched.password && !password           ? "Password is required" :
    touched.password && password.length < 8 ? "Password must be at least 8 characters" : "";

  const canSubmit = isValidEmail(email) && password.length >= 8;

  const handleLogin = async () => {
    setTouch({ email: true, password: true });
    if (!canSubmit) return;
    setFormState("loading");
    setServerError("");

    try {
      // COMMENT: Call the real authentication API with user credentials
      const response = await authAPI.login({ email, password });
      
      // COMMENT: Store the JWT token in localStorage and in the API client
      apiClient.setToken(response.access_token);
      
      // COMMENT: Store the authenticated user's data (including name) in auth context and localStorage
      authStore.setCurrentUser(response.user);
      
      setFormState("success");
      // COMMENT: Wait for UI feedback, then redirect to dashboard
      setTimeout(() => navigate("/"), 1800);
    } catch (err: any) {
      // COMMENT: Handle authentication errors from the API
      setFormState("error");
      setServerError(err.message || "Incorrect email or password. Please try again.");
    }
  };

  const inputBox = (hasError: boolean, hasFocus?: boolean): React.CSSProperties => ({
    width: "100%",
    border: `1.5px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#111827",
    background: hasError ? "#FFF5F5" : "#FAFAFA",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

  if (formState === "success") {
    return (
      <PhoneFrame indicatorBg="#F0FDF4">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: "#F0FDF4" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <CheckCircle size={36} color="#16A34A" />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 10, textAlign: "center" }}>Login Successful!</p>
          <p style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 1.5 }}>
            Redirecting to your dashboard…
          </p>
          <div style={{ marginTop: 24, width: 40, height: 4, borderRadius: 2, background: "#DCFCE7", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#16A34A", borderRadius: 2, animation: "ch-progress 1.8s linear forwards" }} />
            <style>{`@keyframes ch-progress { from { width: 0% } to { width: 100% } }`}</style>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F5" }}>
        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg,#1E3A5F,#2563EB)", padding: "48px 28px 36px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 26 }}>🐝</span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: "white", marginBottom: 6 }}>Welcome back</p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>Sign in to your CollabHive account</p>
        </div>

        <div style={{ padding: "28px 20px" }}>
          {/* Server error banner */}
          {serverError && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#B91C1C", flex: 1 }}>{serverError}</p>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color={emailErr ? "#EF4444" : "#9CA3AF"} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, email: true }))}
                placeholder="you@example.com"
                style={{ ...inputBox(!!emailErr), paddingLeft: 38 }}
              />
            </div>
            {emailErr && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                <AlertCircle size={12} color="#EF4444" />
                <p style={{ fontSize: 12, color: "#EF4444" }}>{emailErr}</p>
              </div>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} color={passErr ? "#EF4444" : "#9CA3AF"} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouch((t) => ({ ...t, password: true }))}
                placeholder="Enter your password"
                style={{ ...inputBox(!!passErr), paddingLeft: 38, paddingRight: 42 }}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                {showPass ? <EyeOff size={16} color="#9CA3AF" /> : <Eye size={16} color="#9CA3AF" />}
              </button>
            </div>
            {passErr && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                <AlertCircle size={12} color="#EF4444" />
                <p style={{ fontSize: 12, color: "#EF4444" }}>{passErr}</p>
              </div>
            )}
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <button onClick={() => navigate("/forgot-password")} style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Forgot Password?
            </button>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={formState === "loading"}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
              background: formState === "loading" ? "#1D4ED8" : canSubmit ? "#2563EB" : "#93C5FD",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: formState === "loading" || !canSubmit ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s", marginBottom: 20,
              boxShadow: canSubmit ? "0 4px 14px rgba(37,99,235,0.35)" : "none",
            }}
          >
            {formState === "loading" ? <><Spinner /> Signing in…</> : "Sign In"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          {/* Register link */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 14, color: "#6B7280" }}>Don't have an account? </span>
            <button onClick={() => navigate("/register")} style={{ fontSize: 14, fontWeight: 700, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              Create Account
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
