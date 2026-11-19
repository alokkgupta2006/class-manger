import { z } from "zod";
import { prisma } from "../config/prisma.js";

const subjectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(20),
  instructor: z.string().trim().max(100).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  target: z.number().int().min(1).max(100).default(75)
});

const withStats = (subject) => {
  const attended = subject.attendance.filter((entry) => entry.status === "Present").length;
  const missed = subject.attendance.filter((entry) => entry.status === "Absent").length;
  const held = attended + missed;
  const percentage = held ? Math.round((attended / held) * 100) : 0;
  const recoveryImpossible = subject.target === 100 && missed > 0;
  const canMiss = percentage >= subject.target && percentage < 100
    ? Math.max(0, Math.floor((attended - subject.target * held / 100) / (subject.target / 100)))
    : 0;
  const mustAttend = percentage < subject.target
    ? recoveryImpossible
      ? null
      : Math.max(1, held === 0 ? 1 : Math.ceil((subject.target * held / 100 - attended) / (1 - subject.target / 100)))
    : 0;
  return { ...subject, attendance: undefined, attended, missed, held, percentage, canMiss, mustAttend, recoveryImpossible };
};

export async function listSubjects(req, res) {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId },
    include: { attendance: { select: { status: true, date: true } } },
    orderBy: { createdAt: "asc" }
  });
  const requestedToday = typeof req.query.today === "string" ? req.query.today : "";
  const today = /^\d{4}-\d{2}-\d{2}$/.test(requestedToday)
    ? requestedToday
    : new Date().toISOString().slice(0, 10);
  return res.json({
    subjects: subjects.map((subject) => ({
      ...withStats(subject),
      todayStatus: subject.attendance.find((entry) => entry.date.toISOString().slice(0, 10) === today)?.status
    }))
  });
}

export async function getSubject(req, res) {
  const subject = await prisma.subject.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { attendance: { orderBy: { date: "desc" } } }
  });
  if (!subject) return res.status(404).json({ message: "Subject not found." });
  return res.json({ subject: { ...withStats(subject), attendance: subject.attendance } });
}

export async function createSubject(req, res) {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const subject = await prisma.subject.create({ data: { ...parsed.data, code: parsed.data.code.toUpperCase(), userId: req.userId } });
  return res.status(201).json({ subject: withStats({ ...subject, attendance: [] }) });
}

export async function updateSubject(req, res) {
  const parsed = subjectSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const owned = await prisma.subject.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!owned) return res.status(404).json({ message: "Subject not found." });
  const data = { ...parsed.data };
  if (data.code) data.code = data.code.toUpperCase();
  const subject = await prisma.subject.update({ where: { id: owned.id }, data });
  return res.json({ subject });
}

export async function deleteSubject(req, res) {
  const result = await prisma.subject.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  if (!result.count) return res.status(404).json({ message: "Subject not found." });
  return res.json({ message: "Subject deleted." });
}

const csvEscape = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function exportSubjectsCsv(req, res) {
  const subjects = await prisma.subject.findMany({
    where: { userId: req.userId },
    include: { attendance: { orderBy: { date: "asc" } } },
    orderBy: { createdAt: "asc" }
  });
  const header = ["name", "code", "instructor", "target", "color", "date", "status"];
  const rows = [header.join(",")];
  for (const subject of subjects) {
    if (!subject.attendance.length) {
      rows.push(["name", "code", "instructor", "target", "color", "date", "status"].map((column) => {
        const values = { name: subject.name, code: subject.code, instructor: subject.instructor, target: subject.target, color: subject.color, date: "", status: "" };
        return csvEscape(values[column]);
      }).join(","));
      continue;
    }
    for (const entry of subject.attendance) {
      rows.push([
        subject.name,
        subject.code,
        subject.instructor,
        subject.target,
        subject.color,
        entry.date.toISOString().slice(0, 10),
        entry.status
      ].map(csvEscape).join(","));
    }
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="attendance-export.csv"');
  return res.send(`\uFEFF${rows.join("\n")}`);
}
