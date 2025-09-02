// api/src/__tests__/auth.test.ts
import request from "supertest";
import app from "../index"; // your express app
import mongoose from "mongoose";

let adminToken: string;
let studentToken: string;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI!);

  const adminRes = await request(app)
    .post("/auth/login")
    .send({ email: "admin@piano.local", password: "admin123" });
  adminToken = adminRes.body.accessToken;

  const studentRes = await request(app)
    .post("/auth/login")
    .send({ email: "student@piano.local", password: "student123" });
  studentToken = studentRes.body.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Auth Middleware", () => {
  it("rejects without token", async () => {
    const res = await request(app).get("/api/admin/data");
    expect(res.status).toBe(401);
  });

  it("accepts admin token", async () => {
    const res = await request(app)
      .get("/api/admin/data")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it("rejects student token", async () => {
    const res = await request(app)
      .get("/api/admin/data")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});
