import { useEffect, useState } from "react";
import { api } from "../lib/api";

export type Lesson = {
  _id: string;
  type: "one" | "group";
  studentId: string;
  groupId?: string;
  start: string; // ISO
  end: string;   // ISO
  status: "Scheduled" | "Cancelled" | "Completed";
  notes?: string;
};

export function useLessons(params: { view: "week"|"month"; startISO: string; studentId?: string }) {
  const [data, setData] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const r = await api.get("/lessons", { params: { view: params.view, start: params.startISO, studentId: params.studentId } });
      if (mounted) setData(r.data);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [params.view, params.startISO, params.studentId]);
  return { data, loading, refresh: async () => {
    const r = await api.get("/lessons", { params: { view: params.view, start: params.startISO, studentId: params.studentId } });
    setData(r.data);
  }};
}

export async function generateMonth(payload: { year: number; month: number; durationMinutes?: number; includeFifth?: boolean }) {
  const r = await api.post("/lessons/generate-month", payload);
  return r.data as { ok: boolean; created: number };
}

export async function updateLesson(id: string, patch: Partial<Pick<Lesson, "start"|"end"|"status"|"notes">>) {
  const r = await api.put(`/lessons/${id}`, patch);
  return r.data as Lesson;
}

export async function deleteLesson(id: string) {
  const r = await api.delete(`/lessons/${id}`);
  return r.data as { ok: boolean };
}

export async function createLesson(payload: {
  studentId: string;
  type: "one" | "group";
  start: string; // ISO
  end: string;   // ISO
  notes?: string;
}) {
  const r = await api.post("/lessons", payload);
  return r.data as Lesson;
}
