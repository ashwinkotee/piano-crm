// store/auth.ts
import { create } from "zustand";
import { api } from "../lib/api"; // axios instance with baseURL

type User = { id: string; email: string; role: "admin" | "portal" };

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: (() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
})(),
  token: localStorage.getItem("token"),
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
}));

// import { api } from "../lib/api";

export async function revalidateAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    useAuth.getState().logout();
    return;
  }

  try {
    const res = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    useAuth.getState().setAuth(token, res.data); // keep backend as source of truth
  } catch {
    useAuth.getState().logout();
    localStorage.removeItem("token");
  }
}
