import { verifyAccessToken } from "../utils/auth.js";

export function requireAuth(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Sign in to continue." });
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "access" || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
    }
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}
