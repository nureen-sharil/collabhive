import { useState, useEffect, type ReactNode } from "react";
import axios from "axios";

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

const API_BASE_URL = "http://localhost:8000/api";

// ─── module-level singleton state ─────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _workspaces: Workspace[] = [];

function _notify() {
  _listeners.forEach((l) => l());
}

// ─── Data conversion adapter utilities ────────────────────────────────────────
function formatFromBackend(backendData: any): Workspace {
  return {
    id: String(backendData.id),
    title: backendData.workspace_name,
    description: backendData.description || "",
    progress: backendData.progress ?? 0,
    status: backendData.progress === 100 ? "Completed" : backendData.progress > 0 ? "In Progress" : "Not Started",
    color: backendData.color || "#2563EB",
    members: Array.isArray(backendData.members) ? backendData.members.map((m: any) => m.name || m.user_id) : [],
    
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
  add: async (data: { title: string; description: string; color: string; deadline: string }): Promise<string> => {
    let currentUserId = 1;

    const sessionStr = localStorage.getItem("user");
    if (sessionStr) {
      try {
        const currentUser = JSON.parse(sessionStr);
        if (currentUser && (currentUser.id || currentUser.user_id)) {
          currentUserId = currentUser.id || currentUser.user_id;
        }
      } catch (e) {
        console.warn("Failed to parse user session string:", e);
      }
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/workspaces`, {
        workspace_name: data.title,
        description: data.description,
        color: data.color,
        owner_id: currentUserId,
        deadline: data.deadline // Sends deadline straight to your FastAPI backend route
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

  update: async (id: string, data: { title: string; description: string; color: string; deadline: string }): Promise<void> => {
    const currentUserId = getStoredUserId();
    if (!currentUserId) {
      throw new Error("User session context missing. Please log in again.");
    }
    try {
      const response = await axios.put(
        `${API_BASE_URL}/workspaces/${id}`,
        {
          workspace_name: data.title,
          description: data.description,
          color: data.color,
          deadline: data.deadline,
        },
        { params: { current_user_id: currentUserId } }
      );
      const updated = formatFromBackend(response.data);
      _workspaces = _workspaces.map((w) => (w.id === id ? updated : w));
      _notify();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update workspace";
      throw new Error(msg);
    }
  },

  remove: async (id: string): Promise<void> => {
<<<<<<< Updated upstream
    const sessionStr = localStorage.getItem("user");
    if (!sessionStr) return;
    const currentUser = JSON.parse(sessionStr);
=======
    const currentUserId = getStoredUserId();
    if (!currentUserId) {
      throw new Error("User session context missing. Please log in again.");
    }
>>>>>>> Stashed changes

    try {
      await axios.delete(`${API_BASE_URL}/workspaces/${id}`, {
        params: { current_user_id: currentUser.id }
      });
      _workspaces = _workspaces.filter((w) => w.id !== id);
      _notify();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to delete workspace";
      throw new Error(msg);
    }
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useWorkspaces() {
  const [, rerender] = useState(0);

  // Read the active storage token context directly during render evaluation
  const sessionStr = localStorage.getItem("user");
  let loggedInUserId: number | null = null;

  if (sessionStr) {
    try {
      const user = JSON.parse(sessionStr);
      if (user?.id) {
        loggedInUserId = user.id;
      }
    } catch (e) {
      console.error("Error parsing user context string:", e);
    }
  }

  useEffect(() => {
    // Setup component notification listener
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);

    // FIX: Trigger database synchronization whenever a valid user ID is detected or changed
    if (loggedInUserId) {
      console.log(`🔄 User session shift detected (ID: ${loggedInUserId}). Syncing database...`);
      workspaceStore.syncFromBackend(loggedInUserId);
    }

    return () => {
      _listeners.delete(listener);
    };
  }, [loggedInUserId]); // 👈 Added dependency tracking to re-sync on login changes!

  return {
    workspaces: _workspaces,
<<<<<<< Updated upstream
    addWorkspace: (data: { title: string; description: string; color: string; deadline: string }) => workspaceStore.add(data),
=======
    addWorkspace: (data: { title: string; description: string; color: string; deadline: string; members?: string[] }) => workspaceStore.add(data),
    updateWorkspace: (id: string, data: { title: string; description: string; color: string; deadline: string }) => workspaceStore.update(id, data),
>>>>>>> Stashed changes
    getWorkspace: (id: string) => workspaceStore.get(id),
    removeWorkspace: (id: string) => workspaceStore.remove(id),
  };
}


export function WorkspaceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}