import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Login() {
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Persist and update auth store so Protected routes see the new state
      setAuth(data.token, data.user);

      if (data.user.role === "portal" && data.user.mustChangePassword) {
        nav("/portal/change-password");
      } else {
        nav(data.user.role === "admin" ? "/admin" : "/portal", { replace: true });
      }
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-card space-y-3">
        <div className="text-xl font-semibold">Sign in</div>
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <button disabled={loading} className="w-full rounded-xl bg-indigo-600 text-white px-3 py-2">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
