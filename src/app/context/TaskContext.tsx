import { useState, useEffect, type ReactNode } from "react";

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

// ─── module-level singleton ───────────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

const STORAGE_KEY = "collabhive.tasks";

function readTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

function writeTasksToStorage(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore storage write failures
  }
}

function deriveInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

let _tasks: Task[] = readTasksFromStorage();

function _notify() { _listeners.forEach((l) => l()); }

export const taskStore = {
  getAll: () => _tasks,
  get: (id: string) => _tasks.find((t) => t.id === id),
  add: (task: Omit<Task, "id" | "comments">) => {
    _tasks = [{ ...task, id: Date.now().toString(), comments: 0 }, ..._tasks];
    writeTasksToStorage(_tasks);
    _notify();
  },
  update: (id: string, patch: Partial<Task>) => {
    _tasks = _tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    writeTasksToStorage(_tasks);
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useTasks() {
  const [, rerender] = useState(0);

  useEffect(() => {
    _tasks = readTasksFromStorage();
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return {
    tasks: _tasks,
    addTask:    taskStore.add,
    updateTask: taskStore.update,
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
