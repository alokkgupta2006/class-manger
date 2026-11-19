import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { clearAuthCookies, setAuthCookies, verifyRefreshToken } from "../utils/auth.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72)
});
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(72)
});

const publicUser = ({ id, name, email }) => ({ id, name, email });

export async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email: email.toLowerCase(), passwordHash } });
  setAuthCookies(res, user.id);
  return res.status(201).json({ user: publicUser(user) });
}

export async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password." });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  setAuthCookies(res, user.id);
  return res.json({ user: publicUser(user) });
}

export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: "Please sign in again." });
  let payload;
  try {
    payload = verifyRefreshToken(token);
    if (payload.type !== "refresh" || typeof payload.sub !== "string") throw new Error("Invalid refresh token");
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
  setAuthCookies(res, user.id);
  return res.json({ user: publicUser(user) });
}

export async function logout(req, res) {
  clearAuthCookies(res);
  return res.json({ message: "Signed out." });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true }
  });
  if (!user) return res.status(401).json({ message: "Please sign in again." });
  return res.json({ user });
}
