// web/src/hooks/useStudents.ts
import { api } from "../lib/api";

export async function createStudent(payload: {
  name: string;
  email: string;
  program: "One-on-one"|"Group";
  ageGroup?: "6-9"|"10-14"|"15+";
  monthlyFee?: number;
}) {
  const r = await api.post("/students", payload);
  return r.data as {
    student: any;
    portalUser: { id: string; email: string };
    tempPassword?: string;
  };
}
