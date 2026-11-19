import { z } from "zod";
import { prisma } from "../config/prisma.js";

const entrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
  }),
  status: z.enum(["Present", "Absent", "Cancelled"])
});

async function ownedSubject(userId, subjectId) {
  return prisma.subject.findFirst({ where: { id: subjectId, userId }, select: { id: true } });
}

export async function addAttendance(req, res) {
  const parsed = entrySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Choose a valid date and status." });
  if (!(await ownedSubject(req.userId, req.params.id))) return res.status(404).json({ message: "Subject not found." });

  const date = new Date(`${parsed.data.date}T00:00:00.000Z`);

  // Creates a new entry every time instead of overwriting an existing entry on the same date
  const entry = await prisma.attendance.create({
    data: {
      subjectId: req.params.id,
      date,
      status: parsed.data.status
    }
  });

  return res.status(201).json({ entry });
}

export async function updateAttendance(req, res) {
  const parsed = entrySchema.partial().safeParse(req.body);
  if (!parsed.success || !Object.keys(parsed.data || {}).length) {
    return res.status(400).json({ message: "Provide a valid date or status." });
  }
  const existing = await prisma.attendance.findFirst({
    where: { id: req.params.id, subject: { userId: req.userId } }
  });
  if (!existing) return res.status(404).json({ message: "Attendance entry not found." });
  const data = { ...parsed.data };
  if (data.date) data.date = new Date(`${data.date}T00:00:00.000Z`);
  const entry = await prisma.attendance.update({ where: { id: existing.id }, data });
  return res.json({ entry });
}

export async function deleteAttendance(req, res) {
  const result = await prisma.attendance.deleteMany({
    where: { id: req.params.id, subject: { userId: req.userId } }
  });
  if (!result.count) return res.status(404).json({ message: "Attendance entry not found." });
  return res.json({ message: "Attendance entry deleted." });
}