import { useEffect, useState, type MouseEvent } from "react";
import { motion } from "../motion-compat";
import { Bell, X, Clock, AlertCircle, CheckCircle, Calendar, ArrowLeft, Users } from "lucide-react";
import { buildApiUrl } from "../../lib/api";

interface NotificationOverlayProps {
  onClose: () => void;
}

type OverlayNotification = {
  id: number;
  type: "warning" | "info" | "success" | "alert";
  title: string;
  message: string;
  created_at: string;
  workspace_id: number | null;
  source_type: string | null;
  is_read: boolean;
};

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  warning: { bg: "#FEF3C7", text: "#D97706" },
  info:    { bg: "#DBEAFE", text: "#2563EB" },
  success: { bg: "#DCFCE7", text: "#15803D" },
  alert:   { bg: "#FEE2E2", text: "#DC2626" },
};

function getStoredUserId() {
  const keys = ["currentUser", "collabhive.auth.currentUser"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { id?: unknown; user_id?: unknown };
      const id = Number(parsed.id ?? parsed.user_id);
      if (Number.isFinite(id)) return id;
    } catch {
      // Ignore malformed session storage.
    }
  }
  return null;
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function iconForNotification(notification: OverlayNotification) {
  if (notification.source_type === "workspace_invite") return Users;
  if (notification.source_type?.startsWith("task")) return Clock;
  if (notification.type === "success") return CheckCircle;
  if (notification.type === "alert") return AlertCircle;
  if (notification.type === "info") return Calendar;
  return Clock;
}

export function NotificationOverlay({ onClose }: NotificationOverlayProps) {
  const [viewAll, setViewAll] = useState(false);
  const [notifications, setNotifications] = useState<OverlayNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = getStoredUserId();

  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(buildApiUrl(`/api/users/${userId}/notifications`), {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Failed to load notifications: ${response.status}`);

        const data = await response.json() as OverlayNotification[];
        if (!cancelled) setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [userId]);

  const visible = notifications.filter((n) => !n.is_read);
  const preview = visible.slice(0, 4);
  const displayed = viewAll ? visible : preview;
  const unreadCount = visible.length;

  const markRead = async (id: number) => {
    if (!userId) return;

    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(buildApiUrl(`/api/notifications/${id}/read?current_user_id=${userId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const markAll = async () => {
    if (!userId) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await fetch(buildApiUrl(`/api/users/${userId}/notifications/read-all`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm"
      style={{ borderRadius: 52, overflow: "hidden" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl w-full mt-14"
        style={{ maxHeight: "80%", display: "flex", flexDirection: "column" }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {viewAll && (
              <button
                onClick={() => setViewAll(false)}
                style={{ width: 28, height: 28, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ArrowLeft size={15} color="#374151" />
              </button>
            )}
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} color="#2563EB" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                {viewAll ? "All Notifications" : "Notifications"}
              </h3>
              <p style={{ fontSize: 11, color: "#6B7280" }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAll()}
                style={{ fontSize: 11, color: "#2563EB", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={15} color="#6B7280" />
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Bell size={32} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Loading notifications...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Bell size={32} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>You're all caught up!</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>No unread notifications.</p>
            </div>
          ) : (
            displayed.map((n, index) => {
              const Icon = iconForNotification(n);
              const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.info;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #F9FAFB",
                    background: "#FAFBFF",
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <div style={{ paddingTop: 4, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563EB" }} />
                  </div>

                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={style.text} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4, marginBottom: 4 }}>{n.message}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{formatNotificationTime(n.created_at)}</span>
                      <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
                      <span style={{ fontSize: 10, color: style.text, fontWeight: 500, background: style.bg, borderRadius: 10, padding: "1px 6px" }}>
                        {n.source_type === "workspace_invite" ? "Workspace" : "Task"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => void markRead(n.id)}
                    title="Mark as Read"
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    className="hover:bg-blue-50"
                  >
                    <CheckCircle size={15} color="#9CA3AF" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {!viewAll && visible.length > 4 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid #F3F4F6", flexShrink: 0 }}>
            <button
              onClick={() => setViewAll(true)}
              style={{ width: "100%", padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", background: "#EFF6FF", color: "#2563EB", fontSize: 13, fontWeight: 600 }}
            >
              View All Notifications ({visible.length})
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
