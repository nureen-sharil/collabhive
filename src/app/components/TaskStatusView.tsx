import { useNavigate, useParams } from "../router";
import { ArrowLeft, Plus, Calendar, MessageSquare, CheckCircle } from "lucide-react";
import { motion } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";
import { useTasks, type Task, type TaskStatus } from "../context/TaskContext";

const STATUS_META: Record<string, { label: string; dot: string; accent: string }> = {
  todo:       { label: "To Do",       dot: "#9CA3AF", accent: "#6B7280" },
  inprogress: { label: "In Progress", dot: "#F97316", accent: "#F97316" },
  done:       { label: "Done",        dot: "#22C55E", accent: "#22C55E" },
};

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  High:   { bg: "#FEE2E2", text: "#B91C1C" },
  Medium: { bg: "#FEF3C7", text: "#B45309" },
  Low:    { bg: "#DBEAFE", text: "#1D4ED8" },
};

function TaskRow({ task, onTap }: { task: Task; onTap: () => void }) {
  const ps   = PRIORITY_STYLE[task.priority];
  const done = task.status === "done";

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className="bg-white rounded-2xl p-4 shadow-sm"
      style={{ border: "1px solid #F3F4F6", cursor: "pointer" }}
    >
      <div className="flex items-start justify-between mb-3" style={{ gap: 8 }}>
        <div className="flex items-start gap-2 flex-1">
          {done && (
            <CheckCircle size={15} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          <h3 style={{
            fontSize: 13, fontWeight: 600, flex: 1,
            color: done ? "#9CA3AF" : "#111827",
            textDecoration: done ? "line-through" : "none",
          }}>
            {task.title}
          </h3>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, color: ps.text,
          background: ps.bg, borderRadius: 20, padding: "3px 8px", flexShrink: 0,
        }}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p style={{
          fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {task.description}
        </p>
      )}

      {task.progress !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 11, color: "#6B7280" }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#F97316" }}>{task.progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#FED7AA", overflow: "hidden" }}>
            <div style={{ width: `${task.progress}%`, height: "100%", borderRadius: 3, background: "#F97316" }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3" style={{ color: "#6B7280" }}>
          <div className="flex items-center gap-1">
            <Calendar size={13} />
            <span style={{ fontSize: 12 }}>{task.dueDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare size={13} />
            <span style={{ fontSize: 12 }}>{task.comments}</span>
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: task.assigneeColor, color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
        }}>
          {task.assignee}
        </div>
      </div>
    </motion.div>
  );
}

export function TaskStatusView() {
  const navigate        = useNavigate();
  const { id, status }  = useParams();
  const { tasks }       = useTasks();

  const safeStatus = (status ?? "todo") as TaskStatus;
  const meta       = STATUS_META[safeStatus] ?? STATUS_META.todo;

  const filtered = tasks.filter(
    (t) => (t.workspaceId === id || t.workspaceId === "1") && t.status === safeStatus
  );

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div
        className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/workspace/${id}/tasks`)} className="p-1">
            <ArrowLeft size={22} strokeWidth={2} color="#374151" />
          </button>
          <div className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.dot }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>{meta.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span style={{
            fontSize: 12, fontWeight: 700, color: meta.accent,
            background: "#F3F4F6", borderRadius: 20, padding: "3px 10px",
          }}>
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </span>
          <button onClick={() => navigate(`/workspace/${id}/tasks/new`)} className="p-1">
            <Plus size={22} strokeWidth={2} color="#2563EB" />
          </button>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <CheckCircle size={40} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No tasks here</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Tap + to add a new task</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ opacity: safeStatus === "done" ? 0.75 : 1 }}
              >
                <TaskRow
                  task={task}
                  onTap={() => navigate(`/workspace/${id}/tasks/${task.id}/edit`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
