import { useState, useEffect } from "react";

export interface Workspace {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: "Not Started" | "In Progress" | "Completed";
  color: string;
  members: string[];
  deadline: string;
  createdAt: string;
}

// ─── module-level singleton ───────────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _workspaces: Workspace[] = [
  {
    id: "1", title: "Software Methodology Project",
    description: "Agile software development methodology study",
    progress: 65, status: "In Progress", color: "#2563EB",
    members: ["JD", "SM", "AB"], deadline: "June 20, 2026", createdAt: "2026-05-01",
  },
  {
    id: "2", title: "Software Testing Project",
    description: "Comprehensive testing and QA processes",
    progress: 30, status: "In Progress", color: "#7C3AED",
    members: ["JD", "AB"], deadline: "June 28, 2026", createdAt: "2026-05-10",
  },
  {
    id: "3", title: "UI/UX Case Study",
    description: "Design research and user experience case study",
    progress: 0, status: "Not Started", color: "#DB2777",
    members: ["SM"], deadline: "July 5, 2026", createdAt: "2026-06-01",
  },
];

function _notify() { _listeners.forEach((l) => l()); }

// ─── public store API (no React) ─────────────────────────────────────────────
export const workspaceStore = {
  getAll: () => _workspaces,
  get: (id: string) => _workspaces.find((w) => w.id === id),
  add: (data: Omit<Workspace, "id" | "progress" | "status" | "createdAt">): string => {
    const id = Date.now().toString();
    _workspaces = [
      ..._workspaces,
      { ...data, id, progress: 0, status: "Not Started", createdAt: new Date().toISOString().split("T")[0] },
    ];
    _notify();
    return id;
  },
  remove: (id: string) => {
    _workspaces = _workspaces.filter((w) => w.id !== id);
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useWorkspaces() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return {
    workspaces: _workspaces,
    addWorkspace:    workspaceStore.add,
    getWorkspace:    workspaceStore.get,
    removeWorkspace: workspaceStore.remove,
  };
}
