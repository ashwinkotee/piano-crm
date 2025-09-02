import express from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import studentsRoutes from "./routes/students.routes";
import lessonsRoutes from "./routes/lessons.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true })); // ✅ fix "truse" typo

app.use("/auth", authRoutes);
app.use("/students", studentsRoutes);
app.use("/lessons", lessonsRoutes);

// ❌ Requests feature deferred
// import requestsRoutes from "./routes/requests.routes";
// app.use("/requests", requestsRoutes);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
// console.log("Connecting to:", (process.env.MONGO_URI || "Empty").replace(/\/\/.*:.*@/,"//<redacted>:<redacted>@"));


const MONGO = process.env.MONGO_URL || "mongodb+srv://ashwinkumar7496:p6XgpYSKxWN7Wgfk@cluster0.guprpvw.mongodb.net/piano-crm?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(MONGO)
  .then(async () => {
    const db = mongoose.connection.db?.databaseName;
    console.log("Mongo connected to DB:", db); // <- should print 'piano' (or your db)
    const port = Number(process.env.PORT || 4000);
    app.listen(port, () => console.log(`API on :${port}`));
    
  })
  .catch((e) => {
    console.error("Mongo connect error", e);
    process.exit(1);
  });
