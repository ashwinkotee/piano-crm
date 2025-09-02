import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import StudentsPage from "../views/admin/StudentsPage";
import SchedulePage from "../views/admin/SchedulePage";
import RequestsPage from "../views/admin/RequestsPage";

export default function AdminApp() {
  const nav = useNavigate();
  const { logout } = useAuth();
  function doLogout(){ logout(); nav("/login", { replace: true }); }
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">Piano CRM - Admin</div>
          <nav className="flex gap-2 text-sm">
            <Tab to="/admin/students" label="Students" />
            <Tab to="/admin/schedule" label="Schedule" />
            <Tab to="/admin/requests" label="Requests" />
            <button onClick={doLogout} className="rounded-lg border px-3 py-1 hover:bg-slate-100">Logout</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="*" element={<div className="text-slate-600">Pick a tab.</div>} />
        </Routes>
      </main>
    </div>
  );
}

function Tab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1 ${isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`
      }
    >
      {label}
    </NavLink>
  );
}
