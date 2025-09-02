import React, { useMemo, useState } from "react";
import type { Student } from "../../hooks/students";
import { useStudents, createStudent, updateStudent } from "../../hooks/students";

type Group = "One-on-one" | "Group 6-9" | "Group 10-14" | "Group 15+";

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const { data, loading, refresh } = useStudents({ q: search });

  const groups = useMemo(() => {
    const res: Record<Group, Student[]> = {
      "One-on-one": [],
      "Group 6-9": [],
      "Group 10-14": [],
      "Group 15+": [],
    };
    data.forEach(s => {
      if (s.program === "One-on-one") res["One-on-one"].push(s);
      else {
        const key = s.ageGroup === "6-9" ? "Group 6-9" : s.ageGroup === "10-14" ? "Group 10-14" : "Group 15+";
        res[key].push(s);
      }
    });
    return res;
  }, [data]);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [invite, setInvite] = useState<{ email: string; tempPassword: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Students</div>
          <div className="text-sm text-slate-500">Grouped by program / age group</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-60 rounded-xl border px-3 py-2"
          />
          <button onClick={() => setAdding(true)} className="rounded-xl bg-indigo-600 text-white px-3 py-2">
            Add Student
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <StudentTable title="One-on-one" items={groups["One-on-one"]} onEdit={setEditing} />
          <StudentTable title="Group 1 (Age 6-9)" items={groups["Group 6-9"]} onEdit={setEditing} />
          <StudentTable title="Group 2 (Age 10-14)" items={groups["Group 10-14"]} onEdit={setEditing} />
          {/* <StudentTable title="Group 3 (Age 15+)" items={groups["Group 15+"]} onEdit={setEditing} /> */}
        </div>
      )}

      {adding && (
        <AddStudentModal
          onClose={() => setAdding(false)}
          onCreated={async (res) => {
            setAdding(false);
            await refresh();
            if (res.tempPassword) setInvite({ email: res.portalUser.email, tempPassword: res.tempPassword });
          }}
        />
      )}
      {editing && (
        <EditStudentModal
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh(); }}
        />
      )}
      {invite && (
        <TempPasswordDialog info={invite} onClose={() => setInvite(null)} />
      )}
    </div>
  );
}

function StudentTable({ title, items, onEdit }:{
  title: string; items: Student[]; onEdit: (s: Student)=>void
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm overflow-x-auto">
      <div className="mb-2 font-semibold">{title}</div>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th className="p-2 whitespace-nowrap">Name</th>
            <th className="p-2 whitespace-nowrap">Program</th>
            <th className="p-2 whitespace-nowrap">Weekly slot</th>
            <th className="p-2 whitespace-nowrap">Fee</th>
            <th className="p-2 whitespace-nowrap">Status</th>
            <th className="p-2 whitespace-nowrap text-right pr-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => {
            const slot: any = (s as any).defaultSlot;
            const displaySlot = slot && typeof slot.weekday === "number" && slot.time
              ? `${WEEKDAYS[slot.weekday]} - ${slot.time}`
              : "-";
            const slotText = slot && typeof slot.weekday === "number" && slot.time
              ? `${WEEKDAYS[slot.weekday]} · ${slot.time}`
              : "—";
            return (
              <tr key={s._id} className="border-t">
                <td className="p-2 font-medium">{s.name}</td>
                <td className="p-2">{s.program}{s.ageGroup ? ` • ${s.ageGroup}` : ""}</td>
                <td className="p-2 text-slate-600">{displaySlot}</td>
                <td className="p-2">${s.monthlyFee ?? 0}</td>
                <td className="p-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold
                    ${s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => onEdit(s)} className="rounded-xl border px-3 py-1 hover:bg-slate-50">Edit</button>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr><td colSpan={6} className="p-3 text-slate-500">No students</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AddStudentModal({
  onClose,
  onCreated
}:{ onClose: ()=>void; onCreated: (res: Awaited<ReturnType<typeof createStudent>>) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState<"One-on-one"|"Group">("One-on-one");
  const [ageGroup, setAgeGroup] = useState<"6-9"|"10-14"|"15+">("6-9");
  const [monthlyFee, setMonthlyFee] = useState<number>(200);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      const payload = { name, email, program, ageGroup: program === "Group" ? ageGroup : undefined, monthlyFee };
      const res = await createStudent(payload);
      onCreated(res);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Could not create student");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Add Student">
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Student name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Portal email (parent/student)" value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="rounded-xl border px-3 py-2" value={program} onChange={e=>setProgram(e.target.value as any)}>
            <option>One-on-one</option>
            <option>Group</option>
          </select>
          {program === "Group" ? (
            <select className="rounded-xl border px-3 py-2" value={ageGroup} onChange={e=>setAgeGroup(e.target.value as any)}>
              <option value="6-9">Age 6–9</option>
              <option value="10-14">Age 10–14</option>
              <option value="15+">Age 15+</option>
            </select>
          ) : <div />}
        </div>
        <input className="w-full rounded-xl border px-3 py-2" type="number" placeholder="Monthly fee" value={monthlyFee} onChange={e=>setMonthlyFee(Number(e.target.value))} />
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-indigo-600 text-white px-3 py-2">{saving ? "Saving…" : "Create"}</button>
        </div>
      </form>
      <p className="mt-2 text-xs text-slate-500">A portal account is created automatically for this email with a temporary password.</p>
    </Modal>
  );
}

function EditStudentModal({ student, onClose, onSaved }:{
  student: Student; onClose: ()=>void; onSaved: ()=>void;
}) {
  const [name, setName] = useState(student.name);
  const [program, setProgram] = useState(student.program);
  const [ageGroup, setAgeGroup] = useState(student.ageGroup ?? "6-9");
  const [monthlyFee, setMonthlyFee] = useState<number>(student.monthlyFee ?? 0);
  const [active, setActive] = useState<boolean>(student.active);

  // NEW: weekly slot (default Tue 17:00 if missing)
  const existing = (student as any).defaultSlot || {};
  const [weekday, setWeekday] = useState<number>(
    typeof existing.weekday === "number" ? existing.weekday : 2
  );
  const [time, setTime] = useState<string>(
    typeof existing.time === "string" ? existing.time : "17:00"
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      await updateStudent(student._id, {
        name, program,
        ageGroup: program === "Group" ? ageGroup : undefined,
        monthlyFee, active,
        // write defaultSlot
        defaultSlot: { weekday, time }
      } as any);
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Could not save");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={`Edit ${student.name}`}>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full rounded-xl border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />

        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Program</div>
            <select className="w-full rounded-xl border px-3 py-2" value={program} onChange={e=>setProgram(e.target.value as any)}>
              <option>One-on-one</option>
              <option>Group</option>
            </select>
          </label>
          {program === "Group" ? (
            <label className="text-sm">
              <div className="text-slate-600">Age group</div>
              <select className="w-full rounded-xl border px-3 py-2" value={ageGroup} onChange={e=>setAgeGroup(e.target.value as any)}>
                <option value="6-9">Age 6–9</option>
                <option value="10-14">Age 10–14</option>
                <option value="15+">Age 15+</option>
              </select>
            </label>
          ) : <div /> }
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Monthly fee</div>
            <input className="w-full rounded-xl border px-3 py-2" type="number"
              value={monthlyFee} onChange={e=>setMonthlyFee(Number(e.target.value))} />
          </label>
          <label className="text-sm flex items-end gap-2">
            <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
            <span>Active</span>
          </label>
        </div>

        {/* NEW: Default weekly slot */}
        <div className="rounded-xl border bg-slate-50 p-3">
          <div className="mb-2 text-sm font-medium text-slate-700">Default weekly slot</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="text-slate-600">Weekday</div>
              <select className="w-full rounded-xl border px-3 py-2" value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </label>
            <label className="text-sm">
              <div className="text-slate-600">Start time</div>
              <input type="time" className="w-full rounded-xl border px-3 py-2" value={time} onChange={e=>setTime(e.target.value)} />
            </label>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Used by “Generate Month” to create 4 lessons automatically.
          </div>
        </div>

        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border px-3 py-2 hover:bg-slate-50">Cancel</button>
          <button disabled={saving} className="rounded-xl bg-indigo-600 text-white px-3 py-2">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

function TempPasswordDialog({ info, onClose }:{
  info: { email: string; tempPassword: string }; onClose: ()=>void;
}) {
  return (
    <Modal onClose={onClose} title="Portal account created">
      <div className="space-y-2">
        <div>Account email: <span className="font-medium">{info.email}</span></div>
        <div>Temporary password: <code className="rounded bg-slate-100 px-2 py-1">{info.tempPassword}</code></div>
        <p className="text-xs text-slate-500">Share this with the parent/student. They can sign in and we’ll add a change-password option later.</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-xl bg-indigo-600 text-white px-3 py-2">Done</button>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }:{
  title: string; children: React.ReactNode; onClose: ()=>void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 hover:bg-slate-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
