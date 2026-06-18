import { useState, useEffect } from "react";
import { taskAPI } from "../../lib/api";

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "todo" | "inprogress" | "done";

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  progress: number;
  workspace_id: number;
  creator_id: number;
  created_at: string;
  updated_at: string;
  assignees: any[];
  comments: any[];
}

// ─── module-level singleton ───────────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _tasks: Task[] = [];
let _loading = true;
let _error: string | null = null;

function _notify() {
  _listeners.forEach((l) => l());
}

export const taskStore = {
  getAll: () => _tasks,
  get: (id: number) => _tasks.find((t) => t.id === id),
  setTasks: (tasks: Task[]) => {
    _tasks = tasks;
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
export function useTasks(workspaceId?: number) {
  const [, rerender] = useState(0);
  const [isLoading, setIsLoading] = useState(_loading);
  const [error, setError] = useState(_error);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);

    // Fetch tasks if workspaceId provided
    if (workspaceId) {
      const fetchTasks = async () => {
        try {
          taskStore.setLoading(true);
          const tasks = await taskAPI.list(workspaceId);
          taskStore.setTasks(tasks);
          taskStore.setLoading(false);
        } catch (err: any) {
          taskStore.setError(err.message);
          taskStore.setLoading(false);
        }
      };
      fetchTasks();
    }

    return () => {
      _listeners.delete(listener);
    };
  }, [workspaceId]);

  return {
    tasks: _tasks,
    isLoading: _loading,
    error: _error,
    addTask: async (data: any) => {
      try {
        const newTask = await taskAPI.create(workspaceId!, data);
        taskStore.setTasks([..._tasks, newTask]);
        return newTask;
      } catch (err: any) {
        taskStore.setError(err.message);
        throw err;
      }
    },
    updateTask: async (id: number, data: any) => {
      try {
        const updated = await taskAPI.update(workspaceId!, id, data);
        taskStore.setTasks(
          _tasks.map((t) => (t.id === id ? updated : t))
        );
        return updated;
      } catch (err: any) {
        taskStore.setError(err.message);
        throw err;
      }
    },
    deleteTask: async (id: number) => {
      try {
        await taskAPI.delete(workspaceId!, id);
        taskStore.setTasks(_tasks.filter((t) => t.id !== id));
      } catch (err: any) {
        taskStore.setError(err.message);
        throw err;
      }
    },
    getTask: (id: number) => _tasks.find((t) => t.id === id),
  };
}
