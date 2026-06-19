import { useState, useEffect } from "react";
import { useNavigate } from "../router";
import {
  ArrowLeft, HelpCircle, Bell, Lock, UserCircle,
  Globe, Moon, Trash2, ChevronRight, Shield, MessageSquare,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";

interface SettingRow {
  icon: any;
  color: string;
  bg: string;
  label: string;
  description?: string;
  onTap?: () => void;
  danger?: boolean;
}

export function Settings() {
  const navigate = useNavigate();

  // State to hold the current user details for the settings banner
  const [currentUser, setCurrentUser] = useState({ name: "Seroja Jane", email: "seroja.jane@collabhive.io" });

  useEffect(() => {
    // Retrieve the authenticated user from localStorage when component mounts
    try {
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed && typeof parsed === "object") {
          setCurrentUser({
            name: parsed.name || "Seroja Jane",
            email: parsed.email || "seroja.jane@collabhive.io"
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse user details:", error);
    }
  }, []);

  // Compute initials for the avatar based on the user's name
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = String(name).trim().split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (String(name)[0] || "U").toUpperCase();
  };

  const sections: { title: string; rows: SettingRow[] }[] = [
    {
      title: "Account",
      rows: [
        { icon: UserCircle, color: "#2563EB", bg: "#DBEAFE", label: "Edit Profile",        description: "Update name, photo, and role",       onTap: () => navigate("/edit-profile") },
        { icon: Lock,       color: "#7C3AED", bg: "#F3E8FF", label: "Change Password",      description: "Update your login password",          onTap: () => {} },
        { icon: Shield,     color: "#16A34A", bg: "#DCFCE7", label: "Account Security",     description: "Two-factor auth & sessions",          onTap: () => {} },
      ],
    },
    {
      title: "Preferences",
      rows: [
        { icon: Bell,   color: "#F97316", bg: "#FEF3C7", label: "Notifications",  description: "Manage alerts and reminders",  onTap: () => {} },
        { icon: Moon,   color: "#6B7280", bg: "#F3F4F6", label: "Appearance",     description: "Dark mode and theme options",  onTap: () => {} },
        { icon: Globe,  color: "#0891B2", bg: "#CFFAFE", label: "Language",       description: "English (default)",            onTap: () => {} },
      ],
    },
    {
      title: "Support",
      rows: [
        { icon: HelpCircle,    color: "#2563EB", bg: "#DBEAFE", label: "Help & FAQ",       description: "Browse common questions",          onTap: () => navigate("/faq") },
        { icon: MessageSquare, color: "#DB2777", bg: "#FCE7F3", label: "Contact Support",  description: "Chat with our support team",       onTap: () => {} },
      ],
    },
    {
      title: "Danger Zone",
      rows: [
        { icon: Trash2, color: "#EF4444", bg: "#FEE2E2", label: "Delete Account", description: "Permanently remove your account", onTap: () => {}, danger: true },
      ],
    },
  ];

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div
        className="bg-white flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}
      >
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft size={22} strokeWidth={2} color="#374151" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Settings</span>
      </div>

      {/* Profile banner */}
      <div style={{ background: "linear-gradient(135deg,#1E3A5F,#2563EB)", padding: "18px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "white" }}>
            {/* Display dynamically computed initials */}
            {getInitials(currentUser.name)}
          </div>
          <div>
            {/* Display actual logged-in user name and email */}
            <p style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{currentUser.name}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{currentUser.email}</p>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, paddingLeft: 4, letterSpacing: 0.5 }}>
              {section.title.toUpperCase()}
            </p>
            <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {section.rows.map((row, i) => {
                const Icon = row.icon;
                return (
                  <button
                    key={row.label}
                    onClick={row.onTap}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "13px 14px", border: "none", cursor: "pointer",
                      background: "white", textAlign: "left",
                      borderBottom: i < section.rows.length - 1 ? "1px solid #F9FAFB" : "none",
                    }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: row.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={row.color} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: row.danger ? "#EF4444" : "#111827" }}>{row.label}</p>
                      {row.description && (
                        <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>{row.description}</p>
                      )}
                    </div>
                    <ChevronRight size={16} color="#D1D5DB" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 8 }}>
          CollabHive v1.0.0 · © 2026 CollabHive Inc.
        </p>
      </div>
    </PhoneFrame>
  );
}
