import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatarColor?: string;
}

interface RegisteredUser extends AuthUser {
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (name: string, email: string, password: string) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_CURRENT_USER = "collabhive.auth.currentUser";
const STORAGE_REGISTERED_USERS = "collabhive.auth.registeredUsers";

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures
  }
}

function deriveNameFromEmail(email: string) {
  const local = email.split("@")[0].replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!local) return "Team Member";
  return local
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

let _currentUser: AuthUser | null = readStorage<AuthUser>(STORAGE_CURRENT_USER);
let _registeredUsers: RegisteredUser[] = readStorage<RegisteredUser[]>(STORAGE_REGISTERED_USERS) ?? [];
const _listeners = new Set<() => void>();

function persistAuthState() {
  writeStorage(STORAGE_CURRENT_USER, _currentUser);
  writeStorage(STORAGE_REGISTERED_USERS, _registeredUsers);
}

function notifyListeners() {
  _listeners.forEach((listener) => listener());
}

export function login(email: string, password: string) {
  const normalized = email.trim().toLowerCase();

  const registered = _registeredUsers.find((entry) => entry.email === normalized);
  if (registered) {
    if (registered.password !== password) {
      throw new Error("Incorrect email or password. Please try again.");
    }
    _currentUser = {
      name: registered.name,
      email: registered.email,
      role: registered.role,
      phone: registered.phone,
      location: registered.location,
      bio: registered.bio,
      avatarColor: registered.avatarColor,
    };
  } else {
    _currentUser = {
      name: deriveNameFromEmail(normalized),
      email: normalized,
      role: "",
      phone: "",
      location: "",
      bio: "",
      avatarColor: "#2563EB",
    };
  }

  persistAuthState();
  notifyListeners();
}

export function logout() {
  _currentUser = null;
  persistAuthState();
  notifyListeners();
}

export function register(name: string, email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  if (_registeredUsers.some((entry) => entry.email === normalized)) {
    throw new Error("Email already exists");
  }
  _registeredUsers.push({
    name: name.trim() || deriveNameFromEmail(normalized),
    email: normalized,
    password,
    role: "",
    phone: "",
    location: "",
    bio: "",
    avatarColor: "#2563EB",
  });
  persistAuthState();
}

export function updateUser(updates: Partial<AuthUser>) {
  if (!_currentUser) return;
  const oldEmail = _currentUser.email;
  const normalizedEmail = updates.email?.trim().toLowerCase() ?? oldEmail;
  _currentUser = {
    ..._currentUser,
    ...updates,
    email: normalizedEmail,
    name: updates.name?.trim() ?? _currentUser.name,
  };

  const existingIndex = _registeredUsers.findIndex((entry) => entry.email === oldEmail);
  if (existingIndex !== -1) {
    _registeredUsers[existingIndex] = {
      ..._registeredUsers[existingIndex],
      ..._currentUser,
      email: normalizedEmail,
    };
    if (oldEmail !== normalizedEmail) {
      const duplicateIndex = _registeredUsers.findIndex(
        (entry, index) => index !== existingIndex && entry.email === normalizedEmail
      );
      if (duplicateIndex !== -1) {
        _registeredUsers.splice(duplicateIndex, 1);
      }
    }
  } else {
    _registeredUsers.push({ ..._currentUser, password: "" });
  }

  persistAuthState();
  notifyListeners();
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(_currentUser);

  useEffect(() => {
    const listener = () => setUser(_currentUser);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  const value: AuthContextValue = {
    user,
    login,
    logout,
    register,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
