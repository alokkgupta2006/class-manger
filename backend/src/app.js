import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";

const app = express();
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/subjects", requireAuth, subjectRoutes);
app.use("/api", requireAuth, attendanceRoutes);
app.use("/api/notes", requireAuth, noteRoutes);
app.use("/api/timetable", requireAuth, timetableRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
