import { useState } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, Camera, User, Mail, Briefcase, Phone, MapPin, CheckCircle } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { LoadingButton } from "./LoadingButton";

const AVATAR_COLORS = [
  "#2563EB", "#7C3AED", "#DB2777", "#16A34A",
  "#EA580C", "#0891B2", "#D97706", "#DC2626",
];

export function EditProfile() {
  const navigate = useNavigate();

  // Initialize with values from localStorage if available
  const getInitialUser = () => {
    try {
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed && typeof parsed === "object") {
          return {
            name: parsed.name || "",
            email: parsed.email || "",
            role: parsed.role || "",
            phone: parsed.phone || "",
            location: parsed.location || "",
            bio: parsed.bio || "",
            avatarColor: parsed.avatarColor || "#2563EB",
          };
        }
      }
    } catch (error) {
      console.error("Failed to parse initial user details:", error);
    }
    return { name: "", email: "", role: "", phone: "", location: "", bio: "", avatarColor: "#2563EB" };
  };

  const initialUser = getInitialUser();

  const [name,     setName]     = useState(initialUser.name);
  const [email,    setEmail]    = useState(initialUser.email);
  const [role,     setRole]     = useState(initialUser.role);
  const [phone,    setPhone]    = useState(initialUser.phone);
  const [location, setLocation] = useState(initialUser.location);
  const [bio,      setBio]      = useState(initialUser.bio);
  const [avatarColor, setAvatarColor] = useState(initialUser.avatarColor);
  const [saved,    setSaved]    = useState(false);

  const initials = String(name).trim().split(" ").map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");

  const handleSave = () => {
    // Save updated user profile back to localStorage
    const userStr = localStorage.getItem("currentUser");
    const user = userStr ? JSON.parse(userStr) : {};
    localStorage.setItem("currentUser", JSON.stringify({ ...user, name, email, role, phone, location, bio, avatarColor }));
    navigate("/");
  };

  const inputStyle = (val: string): React.CSSProperties => ({
    width: "100%", border: `1.5px solid ${val ? "#E5E7EB" : "#E5E7EB"}`,
    borderRadius: 12, padding: "11px 14px", fontSize: 14,
    color: "#111827", background: "#FAFAFA", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  });

  const Field = ({
    icon: Icon, label, value, onChange, placeholder, type = "text", multiline = false,
  }: {
    icon: any; label: string; value: string;
    onChange: (v: string) => void; placeholder?: string;
    type?: string; multiline?: boolean;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <Icon size={13} color="#6B7280" /> {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle(value), resize: "none", lineHeight: 1.5 }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle(value)}
        />
      )}
    </div>
  );

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div
        className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1">
            <ArrowLeft size={22} strokeWidth={2} color="#374151" />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Edit Profile</span>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F5" }}>

        {/* Avatar section */}
        <div style={{ background: "linear-gradient(135deg,#1E3A5F,#2563EB)", padding: "28px 20px 32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Avatar circle */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <div style={{
              width: 88, height: 88, borderRadius: "50%",
              background: avatarColor, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 32, fontWeight: 700, color: "white",
              border: "3px solid rgba(255,255,255,0.4)",
            }}>
              {initials || "SJ"}
            </div>
            {/* Camera badge */}
            <div style={{
              position: "absolute", bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: "50%",
              background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}>
              <Camera size={14} color="#374151" />
            </div>
          </div>

          {/* Avatar colour picker */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 10, fontWeight: 500, letterSpacing: 0.4 }}>
            CHOOSE COLOUR
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAvatarColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: c, border: "none", cursor: "pointer",
                  outline: avatarColor === c ? "2.5px solid white" : "2.5px solid transparent",
                  outlineOffset: 2,
                  boxShadow: avatarColor === c ? `0 0 0 3px ${c}88` : "none",
                  transition: "outline 0.15s",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 16px 8px" }}>

          {/* Personal info card */}
          <div style={{ background: "white", borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 14, letterSpacing: 0.5 }}>PERSONAL INFO</p>
            <Field icon={User}    label="Full Name"    value={name}     onChange={setName}     placeholder="Your full name" />
            <Field icon={Mail}    label="Email"        value={email}    onChange={setEmail}    placeholder="your@email.com" type="email" />
            <Field icon={Phone}   label="Phone"        value={phone}    onChange={setPhone}    placeholder="+1 234 567 8900" />
            <Field icon={MapPin}  label="Location"     value={location} onChange={setLocation} placeholder="City, Country" />
          </div>

          {/* Professional info card */}
          <div style={{ background: "white", borderRadius: 20, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", marginBottom: 14, letterSpacing: 0.5 }}>PROFESSIONAL</p>
            <Field icon={Briefcase} label="Role / Title" value={role} onChange={setRole} placeholder="e.g. Frontend Developer" />
            <div style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                <User size={13} color="#6B7280" /> Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your team about yourself..."
                rows={3}
                style={{ ...inputStyle(bio), resize: "none", lineHeight: 1.5 }}
              />
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4, textAlign: "right" }}>{bio.length}/160</p>
            </div>
          </div>

          <div style={{ height: 4 }} />
        </div>
      </div>

      {/* Save button */}
      <div className="bg-white flex-shrink-0 px-4 pt-2 pb-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        <LoadingButton
          disabled={!name.trim()}
          onComplete={handleSave}
          label="Save Changes"
          successLabel="Profile Updated!"
          style={{ background: name.trim() ? "#2563EB" : "#E5E7EB" }}
          loadingMs={1200}
        />
      </div>
    </PhoneFrame>
  );
}
