// web/src/components/Protected.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import React from "react";   // 👈 import React so TS knows about React types

export function Protected({ children, role }: { children: React.ReactNode; role: "admin" | "portal" }) {
  const { user, token } = useAuth();

  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  return <>{children}</>;
}

