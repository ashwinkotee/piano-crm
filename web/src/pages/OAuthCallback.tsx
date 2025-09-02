import { useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../store/auth";

export default function OAuthCallback() {
  const { setAuth } = useAuth();
  useEffect(() => {
    (async () => {
      const r = await api.post("/auth/refresh"); // refresh cookie -> access token
      const token = r.data.accessToken;
      const me = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      setAuth(token, me.data);
      window.location.href = me.data.role === "admin" ? "/admin" : "/portal";
    })();
  }, []);
  return <div className="p-6">Signing you in…</div>;
}
