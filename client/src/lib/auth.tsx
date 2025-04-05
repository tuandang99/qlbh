import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { useState, useEffect, createContext, useContext } from "react";
import React from "react";
import type { User, LoginData } from "../../../shared/schema";

// Types
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  error: string | null;
}

type AuthProviderProps = {
  children: React.ReactNode;
};

// Context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  error: null,
});

// Provider
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a token in local storage on initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // If parsing fails, clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Login mutation
  const { mutateAsync: loginMutation, isPending } = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const response = await apiRequest("POST", "/api/login", loginData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setError(null);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    },
    onError: (err: Error) => {
      setError(err.message);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  });

  const login = async (loginData: LoginData) => {
    try {
      await loginMutation(loginData);
    } catch (err) {
      // Error is handled by onError above
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear all queries from the cache
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: isPending, isAuthenticated: !!user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => useContext(AuthContext);

// Auth headers for queries
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Custom query hooks with auth
export const useAuthQuery = <T,>(key: string | string[], options = {}) => {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    ...options,
  });
};

// Helper function to fetch with auth headers
export const fetchWithAuth = async (url: string): Promise<Response> => {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    headers,
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Clear auth state if unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  
  return response;
};