import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import { useGroups, createGroup, updateGroup, scheduleGroupSessions, type Group } from "../../hooks/groups";
import { useStudents, type Student } from "../../hooks/students";

export default function GroupsPage() {
  const { data: groups, loading, refresh } = useGroups();
  const { data: students } = useStudents({ q: "" });
  const studentById = useMemo(() => Object.fromEntries(students.map(s => [s._id, s])), [students]);

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [scheduling, setScheduling] = useState<Group | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Groups</div>
          <div className="text-sm text-slate-500">Create groups and schedule sessions (e.g., Theory)</div>
        </div>
        <Button onClick={() => setShowCreate(true)}>New Group</Button>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="text-slate-500">Loading.</div>
        ) : groups.length === 0 ? (
          <div className="text-slate-500">No groups yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Members</th>
                <th className="p-2">Notes</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g._id} className="border-t">
                  <td className="p-2 font-medium">{g.name}</td>
                  <td className="p-2">
                    <div className="max-w-md truncate" title={g.memberIds.map(id => studentById[id]?.name || id).join(", ")}>{g.memberIds.length} members</div>
                  </td>
                  <td className="p-2 text-slate-500">{g.description || "-"}</td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setEditing(g)}>Edit</Button>
                      <Button onClick={() => setScheduling(g)}>Schedule</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <UpsertModal
          title="Create group"
          students={students}
          onClose={() => setShowCreate(false)}
          onSave={async (p) => { await createGroup(p); setShowCreate(false); await refresh(); }}
        />
      )}

      {editing && (
        <UpsertModal
          title="Edit group"
          group={editing}
          students={students}
          onClose={() => setEditing(null)}
          onSave={async (p) => { await updateGroup(editing._id, p); setEditing(null); await refresh(); }}
        />
      )}

      {scheduling && (
        <ScheduleModal
          group={scheduling}
          onClose={() => setScheduling(null)}
          onDone={async () => { setScheduling(null); await refresh(); }}
        />
      )}
    </div>
  );
}

function UpsertModal({ title, group, students, onClose, onSave }:{
  title: string;
  group?: Group;
  students: Student[];
  onClose: ()=>void;
  onSave: (p:{ name: string; description?: string; memberIds: string[] })=>void;
}) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [memberIds, setMemberIds] = useState<string[]>(group?.memberIds || []);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  function toggleMember(id: string) {
    setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function save() {
    setErr(null); setSaving(true);
    try {
      await onSave({ name, description: description || undefined, memberIds });
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Could not save");
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Group name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} />
        <div className="max-h-64 overflow-auto rounded-xl border p-2">
          <div className="mb-1 text-sm font-medium">Members</div>
          <ul className="space-y-1 text-sm">
            {students.map(s => (
              <li key={s._id}>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={memberIds.includes(s._id)} onChange={() => toggleMember(s._id)} />
                  <span>{s.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !name.trim()} onClick={save}>{saving ? "Saving." : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ScheduleModal({ group, onClose, onDone }:{ group: Group; onClose: ()=>void; onDone: ()=>void; }) {
  const [date1, setDate1] = useState<string>("");
  const [date2, setDate2] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  async function submit() {
    setErr(null); setSaving(true);
    try {
      const dates = [date1, date2].filter(Boolean).map(s => new Date(s).toISOString());
      if (dates.length === 0) throw new Error("Pick at least one date/time");
      await scheduleGroupSessions(group._id, { dates, durationMinutes: duration, notes: notes || undefined });
      onDone();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message || "Could not schedule");
      setSaving(false);
    }
  }

  return (
    <Modal title={`Schedule for ${group.name}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            <div className="text-slate-600">Date/time 1</div>
            <input type="datetime-local" value={date1} onChange={e=>setDate1(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="text-sm">
            <div className="text-slate-600">Date/time 2</div>
            <input type="datetime-local" value={date2} onChange={e=>setDate2(e.target.value)} className="w-full rounded-xl border px-3 py-2" />
          </label>
        </div>
        <label className="text-sm">
          <div className="text-slate-600">Duration (minutes)</div>
          <input type="number" min={15} max={240} value={duration} onChange={e=>setDuration(Number(e.target.value)||60)} className="w-40 rounded-xl border px-3 py-2" />
        </label>
        <label className="text-sm">
          <div className="text-slate-600">Notes (optional)</div>
          <input className="w-full rounded-xl border px-3 py-2" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g., Theory session" />
        </label>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={submit}>{saving ? "Scheduling." : "Schedule"}</Button>
        </div>
      </div>
    </Modal>
  );
}

