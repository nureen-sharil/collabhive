import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../../lib/api";

// ─── User interface ──────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  location?: string;
  bio?: string;
  role?: string;
  avatar_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Module-level singleton for user state ───────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _currentUser: AuthUser | null = null;
let _loading = false;
let _error: string | null = null;

function _notify() {
  _listeners.forEach((l) => l());
}

// ─── Helper to get user from localStorage ────────────────────────────────────
function _getUserFromStorage(): AuthUser | null {
  try {
    const stored = localStorage.getItem("current_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// ─── Helper to save user to localStorage ─────────────────────────────────────
function _saveUserToStorage(user: AuthUser | null) {
  if (user) {
    localStorage.setItem("current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("current_user");
  }
}

// ─── Initialize user from localStorage on module load ───────────────────────
_currentUser = _getUserFromStorage();

// ─── Public store API (no React) ─────────────────────────────────────────────
export const authStore = {
  getCurrentUser: () => _currentUser,
  setCurrentUser: (user: AuthUser | null) => {
    _currentUser = user;
    _saveUserToStorage(user);
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
  logout: () => {
    _currentUser = null;
    _saveUserToStorage(null);
    _notify();
  },
};

// ─── Hook to use authenticated user ──────────────────────────────────────────
export function useAuth() {
  const [, rerender] = useState(0);
  const [isLoading, setIsLoading] = useState(_loading);
  const [error, setError] = useState(_error);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);

    return () => {
      _listeners.delete(listener);
    };
  }, []);

  // Fetch current user from backend if token exists but user data is missing
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !_currentUser) {
      authStore.setLoading(true);
      authAPI
        .getCurrentUser()
        .then((user) => {
          authStore.setCurrentUser(user);
          authStore.setLoading(false);
        })
        .catch((err) => {
          authStore.setError(err.message);
          authStore.setLoading(false);
        });
    }
  }, []);

  return {
    // COMMENT: Retrieve the currently authenticated user from the module-level store
    currentUser: _currentUser,
    // COMMENT: Track loading state during user data fetches
    isLoading: _loading,
    // COMMENT: Track any errors during authentication operations
    error: _error,
    // COMMENT: Helper to set current user (stores in both memory and localStorage)
    setCurrentUser: authStore.setCurrentUser,
    // COMMENT: Helper to clear current user on logout
    logout: authStore.logout,
  };
}
