import { useState, useEffect, type ReactNode } from "react";

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

const STORAGE_KEY = "collabhive.workspaces";

function readWorkspacesFromStorage(): Workspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Workspace[]) : [];
  } catch {
    return [];
  }
}

function writeWorkspacesToStorage(workspaces: Workspace[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  } catch {
    // ignore storage write failures
  }
}

let _workspaces: Workspace[] = readWorkspacesFromStorage();

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
    writeWorkspacesToStorage(_workspaces);
    _notify();
    return id;
  },
  remove: (id: string) => {
    _workspaces = _workspaces.filter((w) => w.id !== id);
    writeWorkspacesToStorage(_workspaces);
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useWorkspaces() {
  const [, rerender] = useState(0);

  useEffect(() => {
    _workspaces = readWorkspacesFromStorage();
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
