import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import UpcomingPage from "../views/portal/UpcomingPage";

export default function PortalApp() {
  const nav = useNavigate();
  const { logout } = useAuth();
  function doLogout(){ logout(); nav("/login", { replace: true }); }
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">Piano CRM - Portal</div>
          <nav className="flex gap-2 text-sm">
            <Tab to="/portal/upcoming" label="Upcoming" />
            <button onClick={doLogout} className="rounded-lg border px-3 py-1 hover:bg-slate-100">Logout</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Routes>
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="*" element={<div className="text-slate-600">Pick a tab.</div>} />
        </Routes>
      </main>
    </div>
  );
}
function Tab({ to, label }:{ to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`
      }
    >{label}</NavLink>
  );
}
