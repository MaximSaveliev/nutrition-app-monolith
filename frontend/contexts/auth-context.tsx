/**
 * AuthContext - Context Provider Pattern
 * 
 * Centralized authentication state management using React Context API
 * Provides user state, login, logout, and refresh functionality across the application
 * Automatically fetches user data on mount if access token exists
 */
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_URL } from "@/lib/config";

interface User {
  id: string;
  email: string;
  nickname?: string;
  dietary_restrictions?: string[];
  preferred_cuisines?: string[];
  daily_calorie_goal?: number;
  daily_protein_goal?: number;
  daily_carbs_goal?: number;
  daily_fat_goal?: number;
  email_confirmed?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        // Token is invalid, remove it
        localStorage.removeItem("access_token");
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      localStorage.removeItem("access_token");
      setUser(null);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem("access_token", token);
    await fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = "/";
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      await fetchUser(token);
    }
  };

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("access_token");
    if (token) {
      fetchUser(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
