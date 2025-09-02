import React, { useState } from "react";
import { useRequests, decideRequest, type RequestItem } from "../../hooks/requests";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { format } from "date-fns";

export default function RequestsPage() {
  const { data, loading, refresh } = useRequests();
  const [active, setActive] = useState<RequestItem | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xl font-semibold">Requests</div>
        <div className="text-sm text-slate-500">Reschedule / Cancel from portal</div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : data.length === 0 ? (
          <div className="text-slate-500">No requests.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="p-2">Created</th>
                <th className="p-2">Type</th>
                <th className="p-2">Proposed</th>
                <th className="p-2">Message</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => (
                <tr key={r._id} className="border-t">
                  <td className="p-2">{format(new Date(r.createdAt), "MMM d, p")}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{r.proposedStart ? format(new Date(r.proposedStart), "MMM d, p") : "—"}</td>
                  <td className="p-2">{r.message || "—"}</td>
                  <td className="p-2">
                    <Badge tone={
                      r.status === "Pending" ? "warn" :
                      r.status === "Approved" ? "ok" : "muted"
                    }>{r.status}</Badge>
                  </td>
                  <td className="p-2 text-right">
                    <Button variant="secondary" onClick={() => setActive(r)}>Review</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {active && (
        <ReviewModal
          reqItem={active}
          onClose={() => setActive(null)}
          onDone={async ()=>{ setActive(null); await refresh(); }}
        />
      )}
    </div>
  );
}

function ReviewModal({ reqItem, onClose, onDone }:{
  reqItem: RequestItem; onClose: ()=>void; onDone: ()=>void;
}) {
  const [note, setNote] = useState("");
  const [newStart, setNewStart] = useState<string>(reqItem.proposedStart ? reqItem.proposedStart.slice(0,16) : "");
  const [saving, setSaving] = useState<"approve"|"reject"|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function submit(status: "Approved"|"Rejected") {
    setErr(null); setSaving(status === "Approved" ? "approve" : "reject");
    try {
      await decideRequest(reqItem._id, {
        status,
        decisionNote: note || undefined,
        newStart: status === "Approved" && reqItem.type === "reschedule"
          ? newStart ? new Date(newStart).toISOString() : reqItem.proposedStart
          : undefined
      });
      onDone();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Could not save");
      setSaving(null);
    }
  }

  return (
    <Modal title="Review request" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-600">Type:</span> <span className="font-medium">{reqItem.type}</span></div>
          <div><span className="text-slate-600">Status:</span> <span className="font-medium">{reqItem.status}</span></div>
          <div><span className="text-slate-600">Proposed:</span> {reqItem.proposedStart ? format(new Date(reqItem.proposedStart), "PPpp") : "—"}</div>
          <div><span className="text-slate-600">Message:</span> {reqItem.message || "—"}</div>
        </div>
        {reqItem.type === "reschedule" && (
          <label className="text-sm">
            <div className="text-slate-600">New start (optional override)</div>
            <input type="datetime-local" className="w-full rounded-xl border px-3 py-2"
              value={newStart} onChange={e=>setNewStart(e.target.value)} />
          </label>
        )}
        <label className="text-sm">
          <div className="text-slate-600">Decision note (optional)</div>
          <textarea rows={3} className="w-full rounded-xl border px-3 py-2" value={note} onChange={e=>setNote(e.target.value)} />
        </label>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={saving!==null} onClick={()=>submit("Rejected")}>
            {saving==="reject" ? "Rejecting…" : "Reject"}
          </Button>
          <Button disabled={saving!==null} onClick={()=>submit("Approved")}>
            {saving==="approve" ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
