import { z } from "zod";
import { prisma } from "../config/prisma.js";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const entryFieldsSchema = z.object({
  subject: z.string().trim().min(1).max(100),
  instructor: z.string().trim().max(100).default(""),
  location: z.string().trim().max(100).default(""),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(timePattern),
  endTime: z.string().regex(timePattern),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1")
});

const entrySchema = entryFieldsSchema.refine((entry) => entry.startTime < entry.endTime, {
  message: "End time must be later than start time.",
  path: ["endTime"]
});

export async function listTimetable(req, res) {
  const entries = await prisma.timetableEntry.findMany({
    where: { userId: req.userId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });
  return res.json({ entries });
}

export async function createTimetableEntry(req, res) {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const entry = await prisma.timetableEntry.create({
    data: { ...parsed.data, userId: req.userId }
  });
  return res.status(201).json({ entry });
}

export async function updateTimetableEntry(req, res) {
  const parsed = entryFieldsSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  if (!Object.keys(parsed.data).length) return res.status(400).json({ message: "Provide at least one valid field." });
  const existing = await prisma.timetableEntry.findFirst({
    where: { id: req.params.id, userId: req.userId }
  });
  if (!existing) return res.status(404).json({ message: "Timetable entry not found." });
  const values = entrySchema.safeParse({
    subject: parsed.data.subject ?? existing.subject,
    instructor: parsed.data.instructor ?? existing.instructor,
    location: parsed.data.location ?? existing.location,
    dayOfWeek: parsed.data.dayOfWeek ?? existing.dayOfWeek,
    startTime: parsed.data.startTime ?? existing.startTime,
    endTime: parsed.data.endTime ?? existing.endTime,
    color: parsed.data.color ?? existing.color
  });
  if (!values.success) return res.status(400).json({ message: values.error.issues[0].message });
  const entry = await prisma.timetableEntry.update({
    where: { id: existing.id },
    data: parsed.data
  });
  return res.json({ entry });
}

export async function deleteTimetableEntry(req, res) {
  const result = await prisma.timetableEntry.deleteMany({
    where: { id: req.params.id, userId: req.userId }
  });
  if (!result.count) return res.status(404).json({ message: "Timetable entry not found." });
  return res.json({ message: "Timetable entry deleted." });
}
