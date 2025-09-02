import { api } from "../lib/api";
import { useEffect, useState } from "react";

export type Group = {
  _id: string;
  name: string;
  description?: string;
  memberIds: string[];
  active: boolean;
};

export function useGroups() {
  const [data, setData] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const r = await api.get("/groups");
      if (mounted) setData(r.data);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);
  return {
    data,
    loading,
    refresh: async () => {
      const r = await api.get("/groups");
      setData(r.data);
    },
  };
}

export async function createGroup(payload: { name: string; description?: string; memberIds: string[] }) {
  const r = await api.post("/groups", payload);
  return r.data as Group;
}

export async function updateGroup(id: string, payload: { name: string; description?: string; memberIds: string[] }) {
  const r = await api.put(`/groups/${id}`, payload);
  return r.data as Group;
}

export async function addGroupMembers(id: string, memberIds: string[]) {
  const r = await api.post(`/groups/${id}/add-members`, { memberIds });
  return r.data as Group;
}

export async function scheduleGroupSessions(id: string, payload: { dates: string[]; durationMinutes: number; notes?: string }) {
  const r = await api.post(`/groups/${id}/schedule`, payload);
  return r.data as { ok: true; created: number };
}

