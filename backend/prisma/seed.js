import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const subjects = [
  { name: "Data Structures", code: "CS201", instructor: "Dr. Maya Patel", color: "#6366f1" },
  { name: "Database Systems", code: "CS305", instructor: "Prof. Noah Kim", color: "#14b8a6" },
  { name: "Linear Algebra", code: "MA204", instructor: "Dr. Elena Garcia", color: "#f59e0b" },
  { name: "Computer Networks", code: "CS310", instructor: "Prof. Liam Chen", color: "#ec4899" },
  { name: "Technical Writing", code: "HU112", instructor: "Dr. Aisha Khan", color: "#8b5cf6" }
];

try {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@student.com" },
    update: { name: "Alex Morgan", passwordHash },
    create: { name: "Alex Morgan", email: "demo@student.com", passwordHash }
  });

  for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex += 1) {
    const data = subjects[subjectIndex];
    const subject = await prisma.subject.upsert({
      where: { userId_code: { userId: user.id, code: data.code } },
      update: { ...data },
      create: { ...data, userId: user.id }
    });

    for (let dayOffset = 20; dayOffset >= 0; dayOffset -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      if ((dayOffset + subjectIndex) % 4 === 0) continue;
      const absent = (dayOffset * 3 + subjectIndex * 5) % 11 === 0;
      const status = absent ? "Absent" : "Present";
      await prisma.attendance.upsert({
        where: { subjectId_date: { subjectId: subject.id, date: new Date(date.toISOString().slice(0, 10)) } },
        update: { status },
        create: { subjectId: subject.id, date: new Date(date.toISOString().slice(0, 10)), status }
      });
    }
  }

  console.log("Seed complete: demo@student.com / Password123!");
} finally {
  await prisma.$disconnect();
}
