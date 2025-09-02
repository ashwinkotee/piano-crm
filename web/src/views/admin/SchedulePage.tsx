import React, { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import type { Lesson } from "../../hooks/lessons";
import { useLessons, generateMonth, updateLesson, createLesson, deleteLesson } from "../../hooks/lessons";
import { addMonths, format, parse, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth } from "date-fns";
import { useStudents } from "../../hooks/students";

/* ---------- Local <-> UTC helpers for inputs ----------
   Use native Date handling: a string like "YYYY-MM-DDTHH:mm" is interpreted
   in the user's local timezone. new Date(s).toISOString() yields the correct
   UTC instant without manual offset math. */
const toLocalInput = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");
const fromLocalInput = (s: string) => new Date(s).toISOString();

export default function SchedulePage() {
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [mode, setMode] = useState<"list"|"calendar">("list");
  const startParam = useMemo(() => format(cursor, "yyyy-MM-dd"), [cursor]);

  const { data, loading, refresh } = useLessons({ view: "month", startISO: startParam });
  const { data: students } = useStudents({ q: "" });
  const studentById = useMemo(() => Object.fromEntries(students.map(s => [s._id, s])), [students]);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [adding, setAdding] = useState<{ date?: Date } | null>(null);
  const grouped = useMemo(() => groupByDate(data), [data]);

  return (
    <div className="space-y-6">
      <Toolbar
        month={cursor}
        mode={mode}
        onPrev={() => setCursor(addMonths(cursor, -1))}
        onNext={() => setCursor(addMonths(cursor, 1))}
        onOpenGenerate={() => setGenOpen(true)}
        onAdd={() => setAdding({})}
        onToggleMode={() => setMode(m => (m === "list" ? "calendar" : "list"))}
      />

      {mode === "list" ? (
        <ListView loading={loading} grouped={grouped} onEdit={setEditing} studentById={studentById} />
      ) : (
        <CalendarMonth
          monthDate={cursor}
          lessons={data}
          loading={loading}
          studentById={studentById}
          onAddForDate={(d) => setAdding({ date: d })}
          onEdit={setEditing}
        />
      )}

      {editing && (
        <EditLessonModal
          lesson={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh(); }}
        />
      )}

      {adding && (
        <AddLessonModal
          defaultDate={adding.date}
          onClose={() => setAdding(null)}
          onSaved={async () => { setAdding(null); await refresh(); }}
        />
      )}

      <GenerateDialog month={cursor} onDone={async ()=>{ await refresh(); }} />
    </div>
  );
}

/* ---------- Toolbar ---------- */
function Toolbar({
  month, mode, onPrev, onNext, onOpenGenerate, onAdd, onToggleMode
}:{
  month: Date; mode: "list"|"calendar";
  onPrev: ()=>void; onNext: ()=>void;
  onOpenGenerate: ()=>void; onAdd: ()=>void;
  onToggleMode: ()=>void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="text-2xl font-semibold">{format(month, "MMMM yyyy")}</div>
        <div className="text-sm text-slate-500">Month schedule (4 per student)</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onPrev}>← Prev</Button>
        <Button variant="secondary" onClick={onNext}>Next →</Button>
        <Button variant="secondary" onClick={onToggleMode}>
          {mode === "list" ? "Calendar View" : "List View"}
        </Button>
        <Button variant="secondary" onClick={onAdd}>Add Lesson</Button>
        <Button onClick={onOpenGenerate}>Generate Month</Button>
      </div>
    </div>
  );
}

/* ---------- List view ---------- */
function Card({ children }:{ children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">{children}</div>;
}
function ListView({ loading, grouped, onEdit, studentById }:{
  loading: boolean; grouped: Record<string, Lesson[]>; onEdit: (l:Lesson)=>void; studentById: Record<string, { _id: string; name: string }>;
}) {
  if (loading) return <Card><div className="text-slate-500">Loading lessons…</div></Card>;
  if (Object.keys(grouped).length === 0) return <Card><div className="text-slate-500">No lessons scheduled.</div></Card>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Object.entries(grouped).map(([date, lessons]) => (
        <Card key={date}>
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">{format(parse(date, "yyyy-MM-dd", new Date()), "EEEE, MMM d")}</div>
            <Badge tone="muted">{lessons.length} lessons</Badge>
          </div>
          <ul className="divide-y divide-slate-200">
            {lessons.map(les => (
              <li key={les._id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-500 w-32">{format(new Date(les.start), "p")} - {format(new Date(les.end), "p")}</div>
                  <div className="text-sm">
                    <div className="font-medium">{les.type === "one" ? "One-on-one" : "Group"}</div>
                    <div className="text-slate-600">{studentById[les.studentId]?.name || "Unknown student"}</div>
                    {les.notes && <div className="text-slate-500">{les.notes}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={
                    les.status === "Scheduled" ? "ok" :
                    les.status === "Cancelled" ? "danger" : "muted"
                  }>
                    {les.status}
                  </Badge>
                  <Button variant="secondary" onClick={() => onEdit(les)}>Edit</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Calendar Month (mock style) ---------- */
/* ---------- Calendar Month (colorful, with student names) ---------- */
const studentColorPalette = [
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-lime-50 text-lime-700 border-lime-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];
function colorForStudent(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % studentColorPalette.length;
  return studentColorPalette[idx];
}
function EventPill({ l, onClick, studentName, color }:{ l: Lesson; onClick: ()=>void; studentName?: string; color: string }) {
  const cancelled = l.status === "Cancelled";
  const base = `${color} ${cancelled ? "opacity-60 line-through" : ""}`;
  return (
    <button
      onClick={onClick}
      className={`w-full truncate rounded-lg border px-2 py-1 text-left text-xs hover:shadow-sm ${base}`}
      title={`${format(new Date(l.start), "p")} ${(l.type === "one" ? "1:1" : "Group")} ${studentName ? "- "+studentName : ""}`}
    >
      <span className="font-semibold">{format(new Date(l.start), "p")}</span>
      <span className="opacity-80"> · {l.type === "one" ? "1:1" : "Group"}</span>
      {studentName && <span className="opacity-90"> · {studentName}</span>}
    </button>
  );
}

// function CalendarMonth({
//   monthDate, lessons, loading, onAddForDate, onEdit, studentById
// }:{
//   monthDate: Date;
//   lessons: Lesson[];
//   loading: boolean;
//   onAddForDate: (d: Date)=>void;
//   onEdit: (l:Lesson)=>void;
//   studentById: Record<string, { _id: string; name: string }>;
// }) {}

function CalendarMonth({
  monthDate, lessons, loading, onAddForDate, onEdit, studentById
}:{
  monthDate: Date;
  lessons: Lesson[];
  loading: boolean;
  onAddForDate: (d: Date)=>void;
  onEdit: (l:Lesson)=>void;
  studentById: Record<string, { _id: string; name: string }>;
}) {
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const end   = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 0 });

  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-1">{d}</div>)}
      </div>

      {loading ? (
        <div className="text-slate-500 px-2 py-6">Loading…</div>
      ) : (
        <div className="grid grid-cols-7 gap-px rounded-xl border bg-slate-200">
          {days.map(d => {
            const inMonth = isSameMonth(d, monthDate);
            const items = lessons.filter(l => isSameDay(new Date(l.start), d));
            const weekend = [0,6].includes(d.getDay());
            return (
              <div key={d.toISOString()}
                   className={`min-h-[130px] bg-white p-2 ${inMonth ? "" : "bg-slate-50 text-slate-400"} ${weekend && inMonth ? "bg-slate-50" : ""}`}>
                <div className="mb-1 flex items-center justify-between">
                  <div className={`text-xs font-semibold ${inMonth ? "text-slate-700" : "text-slate-400"}`}>{format(d, "d")}</div>
                  <button
                    className="rounded-full border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-100"
                    onClick={() => onAddForDate(d)}
                    title="Add lesson"
                  >＋</button>
                </div>
                <div className="space-y-1">
                  {items.length === 0 && <div className="text-xs text-slate-300">-</div>}
                  {items.map(l => {
                    const studentName = studentById[l.studentId]?.name;
                    const color = colorForStudent(l.studentId);
                    return (
                      <EventPill key={l._id} l={l} onClick={()=>onEdit(l)} studentName={studentName} color={color} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Edit existing lesson (fixed cancel) ---------- */
function EditLessonModal({ lesson, onClose, onSaved }:{
  lesson: Lesson; onClose: ()=>void; onSaved: ()=>void;
}) {
  const [status, setStatus] = useState<Lesson["status"]>(lesson.status);
  const [notes, setNotes] = useState(lesson.notes ?? "");
  const [start, setStart] = useState(toLocalInput(new Date(lesson.start)));
  const [end, setEnd] = useState(toLocalInput(new Date(lesson.end)));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      await updateLesson(lesson._id, {
        status,
        notes,
        start: fromLocalInput(start),
        end: fromLocalInput(end),
      });
      onSaved();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not save");
      setSaving(false);
    }
  }

  async function cancelLesson() {
    setErr(null); setSaving(true);
    try {
      await updateLesson(lesson._id, { status: "Cancelled" }); // only status
      onSaved();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not cancel");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this lesson permanently?")) return;
    setErr(null); setSaving(true);
    try {
      await deleteLesson(lesson._id);
      onSaved();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not delete");
      setSaving(false);
    }
  }
  // const [status, setStatus] = useState<Lesson["status"]>(lesson.status);
  // const [notes, setNotes] = useState(lesson.notes ?? "");
  // const [start, setStart] = useState(toLocalInput(new Date(lesson.start)));
  // const [end, setEnd] = useState(toLocalInput(new Date(lesson.end)));
  // const [saving, setSaving] = useState(false);
  // const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      await updateLesson(lesson._id, {
        status,
        notes,
        start: fromLocalInput(start),
        end: fromLocalInput(end),
      });
      onSaved();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not save");
      setSaving(false);
    }
  }

  async function cancelLesson() {
    setErr(null); setSaving(true);
    try {
      await updateLesson(lesson._id, { status: "Cancelled" }); // only status
      onSaved();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not cancel");
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit lesson" onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Start</div>
            <input type="datetime-local" className="w-full rounded-xl border px-3 py-2"
              value={start} onChange={e=>setStart(e.target.value)} />
          </label>
          <label className="text-sm">
            <div className="text-slate-600">End</div>
            <input type="datetime-local" className="w-full rounded-xl border px-3 py-2"
              value={end} onChange={e=>setEnd(e.target.value)} />
          </label>
        </div>
        <label className="text-sm">
          <div className="text-slate-600">Status</div>
          <select className="w-full rounded-xl border px-3 py-2" value={status} onChange={e=>setStatus(e.target.value as any)}>
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="text-slate-600">Notes</div>
          <textarea className="w-full rounded-xl border px-3 py-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
        </label>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex gap-2">
            <Button variant="danger" type="button" onClick={cancelLesson}>Cancel lesson</Button>
            <Button variant="danger" type="button" onClick={remove}>Delete</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>Close</Button>
            <Button disabled={saving}>{saving ? "Saving." : "Save changes"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Add new lesson ---------- */
function AddLessonModal({ defaultDate, onClose, onSaved }:{
  defaultDate?: Date; onClose: ()=>void; onSaved: ()=>void;
}) {
  const { data: students } = useStudents({ q: "" });
  const [studentId, setStudentId] = useState<string>("");
  const [type, setType] = useState<"one"|"group">("one");
  const base = defaultDate ?? new Date();
  const [date, setDate] = useState<string>(format(base, "yyyy-MM-dd"));
  const [time, setTime] = useState<string>(format(base, "HH:mm"));
  const [duration, setDuration] = useState<number>(30);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setSaving(true);
    try {
      const startISO = fromLocalInput(`${date}T${time}`);
      const localStart = new Date(`${date}T${time}`);
      const localEnd = new Date(localStart.getTime() + duration * 60000);
      const endISO = fromLocalInput(toLocalInput(localEnd));
      await createLesson({ studentId, type, start: startISO, end: endISO, notes: notes || undefined });
      onSaved();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not create");
      setSaving(false);
    }
  }

  return (
    <Modal title="Add lesson" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="text-sm">
          <div className="text-slate-600">Student</div>
          <select className="w-full rounded-xl border px-3 py-2" value={studentId} onChange={e=>setStudentId(e.target.value)} required>
            <option value="">Select student…</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}{s.ageGroup ? ` - ${s.ageGroup}` : ""}{s.program === "Group" ? " - Group" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Type</div>
            <select className="w-full rounded-xl border px-3 py-2" value={type} onChange={e=>setType(e.target.value as any)}>
              <option value="one">One-on-one</option>
              <option value="group">Group</option>
            </select>
          </label>
          <div />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Date</div>
            <input type="date" className="w-full rounded-xl border px-3 py-2"
              value={date} onChange={e=>setDate(e.target.value)} />
          </label>
          <label className="text-sm">
            <div className="text-slate-600">Start time</div>
            <input type="time" className="w-full rounded-xl border px-3 py-2"
              value={time} onChange={e=>setTime(e.target.value)} />
          </label>
          <label className="text-sm">
            <div className="text-slate-600">Duration</div>
            <select className="w-full rounded-xl border px-3 py-2" value={duration}
              onChange={e=>setDuration(Number(e.target.value))}>
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={75}>1:15 hrs</option>
              <option value={90}>1:30 hrs</option>
            </select>
          </label>
        </div>

        <label className="text-sm">
          <div className="text-slate-600">Notes (optional)</div>
          <textarea rows={3} className="w-full rounded-xl border px-3 py-2" value={notes} onChange={e=>setNotes(e.target.value)} />
        </label>

        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Close</Button>
          <Button disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Generate dialog ---------- */
function GenerateDialog({ month, onDone }:{ month: Date; onDone: ()=>void }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<number>(30);
  const [fifth, setFifth] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  React.useEffect(() => {
    // little trick so the Toolbar can open this by clicking "Generate Month"
    (window as any).__openGen = () => setOpen(true);
    return () => { delete (window as any).__openGen; };
  }, []);

  if (!open) {
    return <Button className="hidden" onClick={()=>setOpen(true)}>Open</Button>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await generateMonth({ year: month.getFullYear(), month: month.getMonth()+1, durationMinutes: duration, includeFifth: fifth });
      setOpen(false);
      onDone();
    } catch (e:any) {
      const msg = e?.response?.data?.error || e?.response?.statusText || e?.message || "Could not generate";
      setErr(msg);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Generate ${format(month, "MMMM yyyy")}`} onClose={()=>setOpen(false)}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Duration (minutes)</div>
            <input type="number" className="w-full rounded-xl border px-3 py-2"
              value={duration} onChange={e=>setDuration(Number(e.target.value))} min={15} max={180} />
          </label>
          <label className="text-sm flex items-end gap-2">
            <input type="checkbox" checked={fifth} onChange={e=>setFifth(e.target.checked)} />
            <span>Include 5th week if present</span>
          </label>
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={()=>setOpen(false)}>Close</Button>
          <Button disabled={busy}>{busy ? "Generating…" : "Generate"}</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- helpers ---------- */
function groupByDate(lessons: Lesson[]) {
  return lessons.reduce((acc: Record<string, Lesson[]>, l) => {
    // Group by LOCAL day, not UTC, to avoid previous/next-day shifts
    const key = format(new Date(l.start), "yyyy-MM-dd");
    (acc[key] ||= []).push(l);
    return acc;
  }, {});
}
