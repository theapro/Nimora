"use client";

import React, { createContext, useContext, useState } from "react";
import { API_URL, apiCall } from "@/utils/api";

interface User {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  checkTokenValidity: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = React.useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  }, []);

  React.useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Refresh user data to get latest profile image
        try {
          const res = await apiCall(`/api/user/${userData.id}`);

          if (res.status === 401) {
            // Token expired or invalid
            logout();
            return;
          }

          if (res.ok) {
            const data = await res.json();
            const updatedUser = {
              id: data.user.id,
              username: data.user.username,
              email: data.user.email,
              profile_image: data.user.profile_image,
              role: data.user.role,
            };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Error refreshing user:", error);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [logout]);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
  };

  const checkTokenValidity = React.useCallback(async (): Promise<boolean> => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      return false;
    }

    try {
      const res = await apiCall("/api/auth/verify", {
        method: "GET",
      });

      if (res.status === 401) {
        // Token expired or invalid
        logout();
        return false;
      }

      return res.ok;
    } catch (error) {
      console.error("Error checking token validity:", error);
      return false;
    }
  }, [logout]);

  // Automatically check token validity on mount and periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      checkTokenValidity();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkTokenValidity]);

  const refreshUser = React.useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) return;

    try {
      const userData = JSON.parse(storedUser);
      const res = await apiCall(`/api/user/${userData.id}`);

      if (res.status === 401) {
        // Token expired or invalid
        logout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          profile_image: data.user.profile_image,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isLoading,
        checkTokenValidity,
      }}
    >
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
