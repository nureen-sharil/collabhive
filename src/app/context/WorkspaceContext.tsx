import { useState, useEffect } from "react";
import { workspaceAPI } from "../../lib/api";

export interface Workspace {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: "Not Started" | "In Progress" | "Completed";
  color: string;
  deadline: string | null;
  creator_id: number;
  created_at: string;
  updated_at: string;
  members: any[];
}

// ─── module-level singleton ───────────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _workspaces: Workspace[] = [];
let _loading = true;
let _error: string | null = null;

function _notify() {
  _listeners.forEach((l) => l());
}

// ─── public store API (no React) ─────────────────────────────────────────────
export const workspaceStore = {
  getAll: () => _workspaces,
  get: (id: number) => _workspaces.find((w) => w.id === id),
  setWorkspaces: (workspaces: Workspace[]) => {
    _workspaces = workspaces;
    _notify();
  },
  setLoading: (loading: boolean) => {
    _loading = loading;
    _notify();
  },
  setError: (error: string | null) => {
    _error = error;
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useWorkspaces() {
  const [, rerender] = useState(0);
  const [isLoading, setIsLoading] = useState(_loading);
  const [error, setError] = useState(_error);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);

    // Fetch workspaces
    const fetchWorkspaces = async () => {
      try {
        workspaceStore.setLoading(true);
        const workspaces = await workspaceAPI.list();
        workspaceStore.setWorkspaces(workspaces);
        workspaceStore.setLoading(false);
      } catch (err: any) {
        workspaceStore.setError(err.message);
        workspaceStore.setLoading(false);
      }
    };

    fetchWorkspaces();

    return () => {
      _listeners.delete(listener);
    };
  }, []);

  return {
    workspaces: _workspaces,
    isLoading: _loading,
    error: _error,
    addWorkspace: async (data: any) => {
      try {
        const newWorkspace = await workspaceAPI.create(data);
        workspaceStore.setWorkspaces([..._workspaces, newWorkspace]);
        return newWorkspace;
      } catch (err: any) {
        workspaceStore.setError(err.message);
        throw err;
      }
    },
    getWorkspace: (id: number) => _workspaces.find((w) => w.id === id),
    removeWorkspace: async (id: number) => {
      try {
        await workspaceAPI.delete(id);
        workspaceStore.setWorkspaces(_workspaces.filter((w) => w.id !== id));
      } catch (err: any) {
        workspaceStore.setError(err.message);
        throw err;
      }
    },
  };
}
