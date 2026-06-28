import { useNavigate, useParams } from "../router";
import { useState } from "react";
import { ArrowLeft, Plus, Calendar, MessageSquare, CheckCircle } from "lucide-react";
import { motion } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";
import { useTasks, type Task } from "../context/TaskContext";
import { GlobalToast } from "./GlobalToast";

type Filter = "All" | "Low Priority" | "Medium Priority" | "High Priority" | "My Tasks";

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  High:   { bg: "#FEE2E2", text: "#B91C1C" },
  Medium: { bg: "#FEF3C7", text: "#B45309" },
  Low:    { bg: "#DBEAFE", text: "#1D4ED8" },
};

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const ps = PRIORITY_STYLE[task.priority];
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm"
      style={{ border: "1px solid #F3F4F6", cursor: "pointer" }}
    >
      <div className="flex items-start justify-between mb-3" style={{ gap: 8 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 600, flex: 1,
          color: task.status === "done" ? "#9CA3AF" : "#111827",
          textDecoration: task.status === "done" ? "line-through" : "none",
        }}>
          {task.title}
        </h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: ps.text, background: ps.bg, borderRadius: 20, padding: "3px 8px", flexShrink: 0 }}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p
          className="line-clamp-2"
          style={{
            fontSize: 12, color: "#6B7280", marginBottom: 12, lineHeight: 1.45,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}
        >
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

function SectionHeader({ dot, label, count }: { dot: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{label}</span>
      <span style={{ fontSize: 13, color: "#9CA3AF" }}>({count})</span>
    </div>
  );
}

export function TaskBoard() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { tasks } = useTasks(id);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");


  // Only show tasks for this workspace
  const workspaceTasks = tasks.filter((t) => t.workspaceId === id || t.workspaceId === "1");

  const filtered = workspaceTasks.filter((t) => {
    if (activeFilter === "Low Priority")    return t.priority === "Low";
    if (activeFilter === "Medium Priority") return t.priority === "Medium";
    if (activeFilter === "High Priority")   return t.priority === "High";
    if (activeFilter === "My Tasks")        return t.assignee === "JD";
    return true;
  });

  const byStatus = {
    todo:       filtered.filter((t) => t.status === "todo"),
    inprogress: filtered.filter((t) => t.status === "inprogress"),
    done:       filtered.filter((t) => t.status === "done"),
  };

  const goEdit = (taskId: string) => navigate(`/workspace/${id}/tasks/${taskId}/edit`);

  const emptyState = filtered.length === 0 && (
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <CheckCircle size={36} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
        {activeFilter === "Low Priority"    ? "No low priority tasks"    :
         activeFilter === "Medium Priority" ? "No medium priority tasks" :
         activeFilter === "My Tasks"        ? "No tasks assigned to you" :
                                             "No high priority tasks"}
      </p>
      <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Try switching filters above</p>
    </div>
  );

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/workspace/${id}`)} className="p-1">
            <ArrowLeft size={22} strokeWidth={2} color="#374151" />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Task Management</span>
        </div>
        <button className="p-1" onClick={() => navigate(`/workspace/${id}/tasks/new`)}>
          <Plus size={22} strokeWidth={2} color="#2563EB" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="bg-white flex-shrink-0 px-4 py-3 flex gap-2"
        style={{ borderBottom: "1px solid #F3F4F6", overflowX: "auto", scrollbarWidth: "none" }}>
        {(["All", "Low Priority", "Medium Priority", "High Priority", "My Tasks"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
            background: activeFilter === f ? "#111827" : "#F3F4F6",
            color: activeFilter === f ? "#fff" : "#4B5563",
            border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}>
        {emptyState}

        {filtered.length > 0 && (
          <div className="space-y-5">
            {/* To Do */}
            {byStatus.todo.length > 0 && (
              <div>
                <SectionHeader dot="#9CA3AF" label="To Do" count={byStatus.todo.length} />
                <div className="space-y-2.5">
                  {byStatus.todo.map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => goEdit(t.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {byStatus.inprogress.length > 0 && (
              <div>
                <SectionHeader dot="#F97316" label="In Progress" count={byStatus.inprogress.length} />
                <div className="space-y-2.5">
                  {byStatus.inprogress.map((t) => (
                    <TaskCard key={t.id} task={t} onClick={() => goEdit(t.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Done */}
            {byStatus.done.length > 0 && (
              <div>
                <SectionHeader dot="#22C55E" label="Done" count={byStatus.done.length} />
                <div className="space-y-2.5">
                  {byStatus.done.map((t) => (
                    <div key={t.id} style={{ opacity: 0.72 }}>
                      <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ border: "1px solid #F3F4F6" }}>
                        <div className="flex items-start gap-3">
                          <CheckCircle size={16} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <TaskCard task={t} onClick={() => goEdit(t.id)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <GlobalToast />
    </PhoneFrame>
  );
}
