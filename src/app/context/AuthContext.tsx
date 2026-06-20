import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * AuthContext provides global state management for the authenticated user.
 * It handles user data persistence using localStorage to maintain state across refreshes.
 */

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on initialization for persistence across page refreshes
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("ch_auth_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to parse auth user from storage", e);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("ch_auth_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ch_auth_user");
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem("ch_auth_user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
