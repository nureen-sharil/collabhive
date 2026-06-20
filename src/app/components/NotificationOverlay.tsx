import React, { useState } from "react";
import { motion, AnimatePresence } from "../motion-compat";
import { Bell, X, Clock, AlertCircle, CheckCircle, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import { useWorkspaces } from "../context/WorkspaceContext";
import { useTasks } from "../context/TaskContext";
import { useMeetings } from "../context/MeetingContext";

interface NotificationOverlayProps {
  onClose: () => void;
}

type OverlayNotification = {
  id: number;
  icon: any;
  type: "warning" | "info" | "success" | "alert";
  title: string;
  message: string;
  time: string;
  workspace: string;
};

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  warning: { bg: "#FEF3C7", text: "#D97706" },
  info:    { bg: "#DBEAFE", text: "#2563EB" },
  success: { bg: "#DCFCE7", text: "#15803D" },
  alert:   { bg: "#FEE2E2", text: "#DC2626" },
};

export function NotificationOverlay({ onClose }: NotificationOverlayProps) {
  const { workspaces } = useWorkspaces();
  const { tasks } = useTasks();
  const { polls } = useMeetings();

  const workspaceById = new Map(workspaces.map((ws) => [ws.id, ws.title]));

  const allNotifications: OverlayNotification[] = [
    ...tasks.map((task, index) => ({
      id: Number(`${task.id}`.replace(/\D/g, "")) || Date.now() + index,
      icon: task.status === "done" ? CheckCircle : task.priority === "High" ? AlertCircle : Clock,
      type: task.status === "done" ? "success" as const : task.priority === "High" ? "alert" as const : "warning" as const,
      title: task.status === "done" ? "Task Completed" : "Task Update",
      message: task.title,
      time: "Recent",
      workspace: workspaceById.get(task.workspaceId) || "Workspace",
    })),
    ...polls.map((poll, index) => ({
      id: Number(`${poll.id}`.replace(/\D/g, "")) || Date.now() + 1000 + index,
      icon: Calendar,
      type: "info" as const,
      title: "Meeting Poll",
      message: poll.agenda || "Meeting details available",
      time: "Recent",
      workspace: workspaceById.get(poll.workspaceId) || "Workspace",
    })),
  ];

  const [viewAll, setViewAll] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [readIds,   setReadIds]   = useState<Set<number>>(new Set());

  const visible    = allNotifications.filter((n) => !dismissed.has(n.id));
  const preview    = visible.slice(0, 4);
  const displayed  = viewAll ? visible : preview;
  const unreadCount = visible.filter((n) => !readIds.has(n.id)).length;

  const markRead = (id: number) => setReadIds((prev) => new Set(prev).add(id));
  const dismiss  = (id: number) => { setDismissed((prev) => new Set(prev).add(id)); setReadIds((prev) => new Set(prev).add(id)); };
  const markAll  = () => setReadIds(new Set(visible.map((n) => n.id)));

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
        style={{ maxHeight: "80%" , display: "flex", flexDirection: "column" }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
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
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up ✓"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAll}
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

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {displayed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Bell size={32} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No notifications</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>You're all caught up!</p>
            </div>
          ) : (
            displayed.map((n, index) => {
              const Icon    = n.icon;
              const style   = TYPE_STYLE[n.type];
              const isRead  = readIds.has(n.id);
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => markRead(n.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #F9FAFB",
                    cursor: "pointer",
                    background: isRead ? "white" : "#FAFBFF",
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Unread dot */}
                  <div style={{ paddingTop: 4, flexShrink: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: isRead ? "transparent" : "#2563EB" }} />
                  </div>

                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={style.text} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: isRead ? 500 : 700, color: "#111827", marginBottom: 2 }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4, marginBottom: 4 }}>{n.message}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{n.time}</span>
                      <span style={{ fontSize: 10, color: "#D1D5DB" }}>·</span>
                      <span style={{ fontSize: 10, color: style.text, fontWeight: 500, background: style.bg, borderRadius: 10, padding: "1px 6px" }}>
                        {n.workspace.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    style={{ width: 24, height: 24, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    className="hover:bg-red-50"
                  >
                    <Trash2 size={13} color="#D1D5DB" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer */}
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

        {viewAll && visible.length === 0 && null}
      </motion.div>
    </motion.div>
  );
}
