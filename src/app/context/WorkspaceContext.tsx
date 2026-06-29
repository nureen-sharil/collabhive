import { useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import { buildApiUrl } from "../../lib/api";
import { taskStore } from "./TaskContext";

export interface Workspace {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: "Not Started" | "In Progress" | "Completed";
  color: string;
  members: string[];
  memberDetails: WorkspaceMember[];
  deadline: string;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: number;
  name: string;
  email: string;
  role: string;
}

type WorkspaceMutation = {
  title: string;
  description: string;
  color: string;
  deadline: string;
  members?: string[];
};

const API_BASE_URL = buildApiUrl("/api");

// ─── module-level singleton state ─────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _workspaces: Workspace[] = [];

function _notify() {
  _listeners.forEach((l) => l());
}

type StoredUser = {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  email?: string;
};

const USER_STORAGE_KEYS = ["currentUser", "collabhive.auth.currentUser", "ch_auth_user", "user"];

function readStoredUser(): StoredUser | null {
  for (const key of USER_STORAGE_KEYS) {
    const sessionStr = localStorage.getItem(key);
    if (!sessionStr) continue;

    try {
      const parsed = JSON.parse(sessionStr) as StoredUser;
      if (parsed && typeof parsed === "object") return parsed;
    } catch (e) {
      console.warn(`Failed to parse ${key} session string:`, e);
    }
  }

  return null;
}

function getStoredUserId(): number | null {
  const user = readStoredUser();
  const rawId = user?.id ?? user?.user_id;
  const id = typeof rawId === "string" ? Number(rawId) : rawId;
  return Number.isFinite(id) ? Number(id) : null;
}

function getStoredUserEmail(): string | null {
  return readStoredUser()?.email?.trim().toLowerCase() || null;
}

function clearWorkspaceCache() {
  _workspaces = [];
  _notify();
}

// ─── Data conversion adapter utilities ────────────────────────────────────────
function formatFromBackend(backendData: any): Workspace {
  const memberDetails = Array.isArray(backendData.members)
    ? backendData.members.map((m: any) => ({
        userId: Number(m.user_id),
        name: String(m.name || m.email || m.user_id || "Member"),
        email: String(m.email || ""),
        role: String(m.role || "member"),
      }))
    : [];

  return {
    id: String(backendData.id),
    title: backendData.workspace_name,
    description: backendData.description || "",
    progress: backendData.progress ?? 0,
    status: backendData.progress === 100 ? "Completed" : backendData.progress > 0 ? "In Progress" : "Not Started",
    color: backendData.color || "#2563EB",
    members: memberDetails.map((m: WorkspaceMember) => m.name),
    memberDetails,
    
    // Maps the backend database field dynamically instead of hardcoding "TBD"
    deadline: backendData.deadline ? backendData.deadline.split("T")[0] : "No Deadline", 
    
    createdAt: backendData.created_at ? backendData.created_at.split("T")[0] : new Date().toISOString().split("T")[0]
  };
}

// ─── public store API (refactored to perform backend persistence) ─────────────
export const workspaceStore = {
  getAll: () => _workspaces,
  
  get: (id: string) => _workspaces.find((w) => w.id === id),

  // Synchronizes full database records matching the current authenticated user context
  syncFromBackend: async (userId: number): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/workspaces`);
      _workspaces = Array.isArray(response.data) ? response.data.map(formatFromBackend) : [];
      _notify();
    } catch (err) {
      console.error("Failed to load workspace updates from database record layer:", err);
    }
  },

  // Expects 'deadline' input parameters matching frontend creation states
  add: async (data: WorkspaceMutation): Promise<string> => {
    const currentUserId = getStoredUserId();
    if (!currentUserId) {
      throw new Error("User session context missing. Please log in again.");
    }

    try {
      const currentUserEmail = getStoredUserEmail();
      const memberEmails = Array.from(new Set(
        (data.members ?? [])
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email && email !== currentUserEmail)
      ));

      const response = await axios.post(`${API_BASE_URL}/workspaces`, {
        workspace_name: data.title,
        description: data.description,
        color: data.color,
        owner_id: currentUserId,
        deadline: data.deadline,
        member_emails: memberEmails
      });

      const parsedNewWorkspace = formatFromBackend(response.data);
      _workspaces = [..._workspaces, parsedNewWorkspace];
      _notify();
      
      return parsedNewWorkspace.id;
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Database workspace insertion failed";
      throw new Error(msg);
    }
  },

  update: async (id: string, data: WorkspaceMutation): Promise<void> => {
    const currentUserId = getStoredUserId();
    if (!currentUserId) {
      throw new Error("User session context missing. Please log in again.");
    }

    try {
      const currentUserEmail = getStoredUserEmail();
      const memberEmails = Array.from(new Set(
        (data.members ?? [])
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email && email !== currentUserEmail)
      ));

      const response = await axios.put(
        `${API_BASE_URL}/workspaces/${id}`,
        {
          workspace_name: data.title,
          description: data.description,
          color: data.color,
          deadline: data.deadline,
          member_emails: memberEmails,
        },
        { params: { current_user_id: currentUserId } }
      );

      const parsedWorkspace = formatFromBackend(response.data);
      _workspaces = _workspaces.map((w) => w.id === id ? parsedWorkspace : w);
      _notify();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Database workspace update failed";
      throw new Error(msg);
    }
  },

  remove: async (id: string): Promise<void> => {
    const currentUserId = getStoredUserId();
    if (!currentUserId) {
      throw new Error("User session context missing. Please log in again.");
    }

    try {
      await axios.delete(`${API_BASE_URL}/workspaces/${id}`, {
        params: { current_user_id: currentUserId }
      });
      _workspaces = _workspaces.filter((w) => w.id !== id);
      _notify();
    } catch (err) {
      console.error("Failed to remove workspace record from backend instance data store:", err);
    }
  },

  updateProgress: async (workspaceId: string): Promise<void> => {
    const allTasks = taskStore.getAll().filter((t) => t.workspaceId === workspaceId);
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.status === "done").length;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);

    // Update local state immediately so the UI reflects the change without waiting for the network
    _workspaces = _workspaces.map((w) =>
      w.id === workspaceId
        ? { ...w, progress, status: progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started" }
        : w
    );
    _notify();

    const currentUserId = getStoredUserId();
    if (!currentUserId) return;
    try {
      await axios.put(
        `${API_BASE_URL}/workspaces/${workspaceId}`,
        { progress },
        { params: { current_user_id: currentUserId } }
      );
    } catch {
      // Local state already updated above; backend will sync on next load
    }
  },
};

// Module-level listener: recalculate workspace progress whenever any task is added or changed
if (typeof window !== "undefined") {
  window.addEventListener("collabhive-tasks-changed", (e) => {
    const workspaceId = (e as CustomEvent<{ workspaceId: string }>).detail?.workspaceId;
    if (workspaceId) void workspaceStore.updateProgress(workspaceId);
  });
}

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useWorkspaces() {
  const [, rerender] = useState(0);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(() => getStoredUserId());

  useEffect(() => {
    // Setup component notification listener
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);

    // FIX: Trigger database synchronization whenever a valid user ID is detected or changed
    if (loggedInUserId) {
      console.log(`🔄 User session shift detected (ID: ${loggedInUserId}). Syncing database...`);
      workspaceStore.syncFromBackend(loggedInUserId);
    }

    if (!loggedInUserId) {
      clearWorkspaceCache();
    }

    const refreshUserContext = () => {
      setLoggedInUserId(getStoredUserId());
    };

    window.addEventListener("storage", refreshUserContext);
    window.addEventListener("collabhive-auth-change", refreshUserContext);

    return () => {
      _listeners.delete(listener);
      window.removeEventListener("storage", refreshUserContext);
      window.removeEventListener("collabhive-auth-change", refreshUserContext);
    };
  }, [loggedInUserId]); // 👈 Added dependency tracking to re-sync on login changes!

  return {
    workspaces: _workspaces,
    addWorkspace: (data: WorkspaceMutation) => workspaceStore.add(data),
    updateWorkspace: (id: string, data: WorkspaceMutation) => workspaceStore.update(id, data),
    getWorkspace: (id: string) => workspaceStore.get(id),
    removeWorkspace: (id: string) => workspaceStore.remove(id),
  };
}


export function WorkspaceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
