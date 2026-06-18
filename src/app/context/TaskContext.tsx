import { useState, useEffect } from "react";

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

let _tasks: Task[] = [
  {
    id: "1", workspaceId: "1",
    title: "Design system documentation", description: "Document all components and usage guidelines.",
    priority: "High", status: "todo", dueDate: "Jun 15", dueTime: "10:00 AM",
    assignee: "JD", assigneeName: "John Doe", assigneeColor: "#2563EB", comments: 3,
  },
  {
    id: "2", workspaceId: "1",
    title: "User research interviews", description: "Conduct interviews with 5 target users.",
    priority: "Medium", status: "todo", dueDate: "Jun 16", dueTime: "02:00 PM",
    assignee: "SM", assigneeName: "Sara Miller", assigneeColor: "#7C3AED", comments: 5,
  },
  {
    id: "3", workspaceId: "1",
    title: "Database schema update", description: "Update schema for new user profile fields.",
    priority: "High", status: "inprogress", dueDate: "Jun 14", dueTime: "09:00 AM",
    assignee: "AB", assigneeName: "Alex Brown", assigneeColor: "#DB2777", comments: 2, progress: 60,
  },
  {
    id: "4", workspaceId: "1",
    title: "API endpoint testing", description: "Write integration tests for all REST endpoints.",
    priority: "Medium", status: "inprogress", dueDate: "Jun 17", dueTime: "11:00 AM",
    assignee: "JD", assigneeName: "John Doe", assigneeColor: "#2563EB", comments: 1, progress: 35,
  },
  {
    id: "5", workspaceId: "1",
    title: "Landing page redesign", description: "Implement new marketing landing page design.",
    priority: "Low", status: "done", dueDate: "Jun 12", dueTime: "03:00 PM",
    assignee: "SM", assigneeName: "Sara Miller", assigneeColor: "#7C3AED", comments: 8,
  },
  {
    id: "6", workspaceId: "1",
    title: "User authentication flow", description: "Implement OAuth2 login and session handling.",
    priority: "High", status: "done", dueDate: "Jun 11", dueTime: "10:00 AM",
    assignee: "AB", assigneeName: "Alex Brown", assigneeColor: "#DB2777", comments: 4,
  },
];

function _notify() { _listeners.forEach((l) => l()); }

export const taskStore = {
  getAll: () => _tasks,
  get: (id: string) => _tasks.find((t) => t.id === id),
  add: (task: Omit<Task, "id" | "comments">) => {
    _tasks = [{ ...task, id: Date.now().toString(), comments: 0 }, ..._tasks];
    _notify();
  },
  update: (id: string, patch: Partial<Task>) => {
    _tasks = _tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useTasks() {
  const [, rerender] = useState(0);

  useEffect(() => {
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

// Current user initials (for "My Tasks" filter)
export const MY_INITIALS = "JD";
