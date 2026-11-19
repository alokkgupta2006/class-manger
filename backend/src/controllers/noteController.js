import { z } from "zod";
import { prisma } from "../config/prisma.js";

const noteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().max(120).default(""),
  content: z.string().trim().min(1).max(10000)
});

const dateFromKey = (date) => new Date(`${date}T12:00:00.000Z`);

export async function listNotes(req, res) {
  const notes = await prisma.note.findMany({
    where: { userId: req.userId },
    orderBy: { date: "desc" }
  });
  return res.json({ notes });
}

export async function saveNote(req, res) {
  const parsed = noteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Add a valid date and note." });
  const date = dateFromKey(parsed.data.date);
  if (Number.isNaN(date.getTime())) return res.status(400).json({ message: "Choose a valid date." });
  const note = await prisma.note.upsert({
    where: { userId_date: { userId: req.userId, date } },
    update: { title: parsed.data.title, content: parsed.data.content },
    create: { userId: req.userId, date, title: parsed.data.title, content: parsed.data.content }
  });
  return res.json({ note });
}

export async function deleteNote(req, res) {
  const result = await prisma.note.deleteMany({
    where: { id: req.params.id, userId: req.userId }
  });
  if (!result.count) return res.status(404).json({ message: "Note not found." });
  return res.json({ message: "Note deleted." });
}
