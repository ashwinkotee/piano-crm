import { api } from "../lib/api";
import { useEffect, useState } from "react";

export type RequestItem = {
  _id: string;
  lessonId: string;
  studentId: string;
  type: "reschedule" | "cancel";
  message?: string;
  proposedStart?: string; // ISO
  status: "Pending" | "Approved" | "Rejected";
  decisionNote?: string;
  createdAt: string;
};

export function useRequests() {
  const [data, setData] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const r = await api.get("/requests");
      if (mounted) setData(r.data);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);
  return { data, loading, refresh: async () => {
    const r = await api.get("/requests");
    setData(r.data);
  }};
}

// createRequest removed as unused; add back when portal requests form is implemented

export async function decideRequest(id: string, payload: { status: "Approved"|"Rejected"; decisionNote?: string; newStart?: string }) {
  const r = await api.patch(`/requests/${id}`, payload);
  return r.data as { ok: true };
}
