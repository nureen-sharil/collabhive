import { useState, type MouseEvent } from "react";
import { useNavigate, useParams } from "../router";
import { ArrowLeft, Bell, CheckCircle, Clock, Users, Calendar, X, AlertCircle, Info, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";
import { useWorkspaces } from "../context/WorkspaceContext";
import { useTasks } from "../context/TaskContext";

interface WorkspaceNotification {
  id: number;
  type: "warning" | "info" | "success" | "alert";
  title: string;
  message: string;
  time: string;
}

function WorkspaceNotificationPanel({
  notifications,
  workspaceColor,
  onClose,
}: {
  notifications: WorkspaceNotification[];
  workspaceColor: string;
  onClose: () => void;
}) {
  const iconMap = {
    warning: AlertCircle,
    alert: AlertCircle,
    info: Info,
    success: CheckCircle,
  };
  const colorMap = {
    warning: { bg: "#FEF3C7", text: "#D97706" },
    alert: { bg: "#FEE2E2", text: "#B91C1C" },
    info: { bg: "#DBEAFE", text: "#1D4ED8" },
    success: { bg: "#DCFCE7", text: "#15803D" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(2px)",
        zIndex: 50,
        borderRadius: 52,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "14px 12px 0",
      }}
    >
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: workspaceColor + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Bell size={18} color={workspaceColor} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Workspace Alerts</p>
              <p style={{ fontSize: 11, color: "#6B7280" }}>{notifications.length} notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "#F3F4F6", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Notification items */}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {notifications.map((n, i) => {
            const Icon = iconMap[n.type];
            const style = colorMap[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  padding: "12px 16px",
                  borderBottom: i < notifications.length - 1 ? "1px solid #F9FAFB" : "none",
                  display: "flex", gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: style.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={style.text} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, lineHeight: 1.4 }}>{n.message}</p>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{n.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #F3F4F6", textAlign: "center" }}>
          <button style={{ fontSize: 13, color: workspaceColor, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
            Mark All as Read
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function WorkspaceOverview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getWorkspace } = useWorkspaces();
  const [showNotifications, setShowNotifications] = useState(false);

  const workspace = getWorkspace(id ?? "") ?? {
    id: id ?? "",
    title: "",
    description: "",
    progress: 0,
    status: "Not Started" as const,
    color: "#2563EB",
    members: [],
    deadline: "TBD",
    createdAt: "",
  };

  const { tasks } = useTasks(id);

  const wsTasks    = tasks.filter((t) => t.workspaceId === id);
  const doneTasks  = wsTasks.filter((t) => t.status === "done");
  const pendingTasks = wsTasks.filter((t) => t.status !== "done"); // todo + inprogress

  const daysLeft = (() => {
    if (!workspace.deadline || workspace.deadline === "TBD") return "-";
    const target = new Date(workspace.deadline);
    if (Number.isNaN(target.getTime())) return "-";
    const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 0);
  })();

  const notifications: WorkspaceNotification[] = [
    ...(workspace.deadline && workspace.deadline !== "TBD"
      ? [{
          id: 1,
          type: "warning" as const,
          title: "Upcoming Deadline",
          message: `${workspace.title || "Workspace"} is due ${workspace.deadline}.`,
          time: "Recent",
        }]
      : []),
    ...pendingTasks.slice(0, 2).map((task, index) => ({
      id: 100 + index,
      type: task.priority === "High" ? ("alert" as const) : ("info" as const),
      title: task.priority === "High" ? "High Priority Task" : "Task Update",
      message: task.title,
      time: "Recent",
    })),
    ...(doneTasks.length > 0
      ? [{
          id: 200,
          type: "success" as const,
          title: "Task Completed",
          message: `${doneTasks.length} task${doneTasks.length > 1 ? "s" : ""} completed.`,
          time: "Recent",
        }]
      : []),
  ];

  const PRIORITY_DOT: Record<string, string> = {
    High:   "#EF4444",
    Medium: "#F97316",
    Low:    "#3B82F6",
  };

  const metrics = [
    { label: "Tasks Done",    value: doneTasks.length,    icon: CheckCircle, color: "text-green-600 bg-green-50"  },
    { label: "Pending Tasks", value: pendingTasks.length, icon: Clock,       color: "text-orange-600 bg-orange-50"},
    { label: "Members",       value: Math.max(workspace.members.length, 1), icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Days Left",     value: daysLeft, icon: Calendar,  color: "text-purple-600 bg-purple-50" },
  ];

  const navItems = [
    { label: "Tasks", icon: CheckCircle, path: `/workspace/${id}/tasks` },
    {
      label: "Chat",
      path: `/workspace/${id}/chat`,
      svg: (
        <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      label: "Files",
      path: `/workspace/${id}/files`,
      svg: (
        <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    { label: "Meetings", icon: Calendar, path: `/workspace/${id}/meetings` },
  ];

  return (
    <PhoneFrame indicatorBg="#F9FAFB">
      {/* App Header */}
      <div className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1">
            <ArrowLeft size={22} strokeWidth={2} color="#374151" />
          </button>
          <h1
            style={{
              fontSize: 15, fontWeight: 600, color: "#111827",
              maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {workspace.title}
          </h1>
        </div>
        <button
          className="relative p-1"
          onClick={() => setShowNotifications(true)}
        >
          <Bell size={20} strokeWidth={2} color="#374151" />
          {/* Unread dot */}
          <span
            style={{
              position: "absolute", top: 2, right: 2,
              width: 8, height: 8, borderRadius: "50%",
              background: "#EF4444", border: "1.5px solid white",
            }}
          />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F5" }}>

        {/* Workspace colour banner */}
        <div
          style={{
            height: 8, background: workspace.color,
            opacity: 0.85,
          }}
        />

        {/* Overall Progress Card */}
        <div className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 14 }}>Overall Progress</h3>
          <div className="flex items-center gap-4">
            <div className="relative" style={{ width: 88, height: 88, flexShrink: 0 }}>
              <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={44} cy={44} r={36} stroke="#E5E7EB" strokeWidth={8} fill="none" />
                <circle
                  cx={44} cy={44} r={36}
                  stroke={workspace.color} strokeWidth={8} fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - workspace.progress / 100)}`}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{workspace.progress}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>Project Deadline</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 }}>{workspace.deadline}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FEF3C7", borderRadius: 20, padding: "3px 10px" }}>
                <Clock size={12} color="#D97706" />
                <span style={{ fontSize: 12, fontWeight: 500, color: "#D97706" }}>{daysLeft === "-" ? "No deadline set" : `${daysLeft} day${Number(daysLeft) === 1 ? "" : "s"} remaining`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="px-4 mt-3 grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${metric.color}`}>
                  <Icon size={17} />
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{metric.value}</p>
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{metric.label}</p>
              </div>
            );
          })}
        </div>

        {/* Pending Tasks */}
        <div className="px-4 mt-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Pending Tasks</h3>
              <button
                onClick={() => navigate(`/workspace/${id}/tasks`)}
                style={{ fontSize: 12, color: workspace.color, fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}
              >
                View All
              </button>
            </div>
            {pendingTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <CheckCircle size={22} color="#16A34A" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>All tasks completed!</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>No pending tasks remaining.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/workspace/${id}/tasks/${task.id}/edit`)}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "#F9FAFB", cursor: "pointer" }}
                  >
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: task.assigneeColor || workspace.color,
                        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {task.assignee}
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <div
                      style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: PRIORITY_DOT[task.priority] ?? "#9CA3AF", flexShrink: 0,
                      }}
                    />
                  </div>
                ))}
                {pendingTasks.length > 4 && (
                  <button
                    onClick={() => navigate(`/workspace/${id}/tasks`)}
                    style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: "none", background: "#F3F4F6", color: "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    +{pendingTasks.length - 4} more tasks
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white flex-shrink-0" style={{ borderTop: "1px solid #F3F4F6" }}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 hover:text-blue-600 transition-colors px-3 py-1.5"
              style={{ color: "#6B7280" }}
            >
              {item.icon ? <item.icon size={20} /> : item.svg}
              <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Workspace-specific notification panel */}
      <AnimatePresence>
        {showNotifications && (
          <WorkspaceNotificationPanel
            notifications={notifications}
            workspaceColor={workspace.color}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
}
