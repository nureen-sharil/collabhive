import { useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import { buildApiUrl } from "../../lib/api";

export type Priority   = "High" | "Medium" | "Low";
export type TaskStatus = "todo" | "inprogress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  dueTime: string;
  assignee: string;
  assigneeName: string;
  assigneeColor: string;
  comments: number;
  progress?: number;
  workspaceId: string;
}

const API_BASE_URL = buildApiUrl("/api");

// ─── module-level singleton ───────────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _tasks: Task[] = [];

function _notify() { _listeners.forEach((l) => l()); }

function formatFromBackend(data: any): Task {
  return {
    id:            String(data.id),
    workspaceId:   String(data.workspace_id),
    title:         data.title,
    description:   data.description || "",
    priority:      (data.priority as Priority) || "Medium",
    status:        (data.status as TaskStatus) || "todo",
    dueDate:       data.due_date || "",
    dueTime:       data.due_time || "",
    assignee:      data.assignee || "",
    assigneeName:  data.assignee_name || "",
    assigneeColor: data.assignee_color || "",
    progress:      data.progress ?? 0,
    comments:      0,
  };
}

export const taskStore = {
  getAll: () => _tasks,
  get: (id: string) => _tasks.find((t) => t.id === id),

  syncFromBackend: async (workspaceId: string): Promise<void> => {
    try {
      const res = await axios.get(`${API_BASE_URL}/workspaces/${workspaceId}/tasks`);
      const incoming: Task[] = Array.isArray(res.data) ? res.data.map(formatFromBackend) : [];
      // Merge: replace tasks for this workspace, keep others
      _tasks = [
        ..._tasks.filter((t) => t.workspaceId !== workspaceId),
        ...incoming,
      ];
      _notify();
      // Trigger progress recalculation in WorkspaceContext
      window.dispatchEvent(new CustomEvent("collabhive-tasks-changed", { detail: { workspaceId } }));
    } catch (err) {
      console.error("Failed to sync tasks from backend:", err);
    }
  },

  add: async (task: Omit<Task, "id" | "comments">): Promise<void> => {
    try {
      const res = await axios.post(`${API_BASE_URL}/workspaces/${task.workspaceId}/tasks`, {
        title:          task.title,
        description:    task.description,
        priority:       task.priority,
        status:         task.status,
        due_date:       task.dueDate,
        due_time:       task.dueTime,
        assignee:       task.assignee,
        assignee_name:  task.assigneeName,
        assignee_color: task.assigneeColor,
        progress:       task.progress ?? 0,
      });
      _tasks = [formatFromBackend(res.data), ..._tasks];
      _notify();
      window.dispatchEvent(new CustomEvent("collabhive-tasks-changed", { detail: { workspaceId: task.workspaceId } }));
    } catch (err) {
      console.error("Failed to create task:", err);
      throw err;
    }
  },

  update: async (id: string, patch: Partial<Task>): Promise<void> => {
    try {
      const payload: Record<string, any> = {};
      if (patch.title          !== undefined) payload.title          = patch.title;
      if (patch.description    !== undefined) payload.description    = patch.description;
      if (patch.priority       !== undefined) payload.priority       = patch.priority;
      if (patch.status         !== undefined) payload.status         = patch.status;
      if (patch.dueDate        !== undefined) payload.due_date       = patch.dueDate;
      if (patch.dueTime        !== undefined) payload.due_time       = patch.dueTime;
      if (patch.assignee       !== undefined) payload.assignee       = patch.assignee;
      if (patch.assigneeName   !== undefined) payload.assignee_name  = patch.assigneeName;
      if (patch.assigneeColor  !== undefined) payload.assignee_color = patch.assigneeColor;
      if (patch.progress       !== undefined) payload.progress       = patch.progress;

      const res = await axios.put(`${API_BASE_URL}/tasks/${id}`, payload);
      const updated = formatFromBackend(res.data);
      _tasks = _tasks.map((t) => (t.id === id ? { ...updated, comments: t.comments } : t));
      _notify();
      if (updated.workspaceId) {
        window.dispatchEvent(new CustomEvent("collabhive-tasks-changed", { detail: { workspaceId: updated.workspaceId } }));
      }
    } catch (err) {
      console.error("Failed to update task:", err);
      throw err;
    }
  },

  remove: async (id: string): Promise<void> => {
    const task = _tasks.find((t) => t.id === id);
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${id}`);
      _tasks = _tasks.filter((t) => t.id !== id);
      _notify();
      if (task?.workspaceId) {
        window.dispatchEvent(new CustomEvent("collabhive-tasks-changed", { detail: { workspaceId: task.workspaceId } }));
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      throw err;
    }
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useTasks(workspaceId?: string) {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);

    if (workspaceId) {
      taskStore.syncFromBackend(workspaceId);
    }

    return () => { _listeners.delete(listener); };
  }, [workspaceId]);

  return {
    tasks:      _tasks,
    addTask:    taskStore.add,
    updateTask: taskStore.update,
    removeTask: taskStore.remove,
    getTask:    taskStore.get,
  };
}

export function TaskProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Current user initials (for "My Tasks" filter)
export const MY_INITIALS = (() => {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return "U";
    const parsed = JSON.parse(raw) as { name?: string };
    return deriveInitials(parsed.name ?? "");
  } catch {
    return "U";
  }
})();
