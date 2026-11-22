import jwt from "jsonwebtoken";

const accessSecret = () => {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is required");
  return process.env.JWT_ACCESS_SECRET;
};

const refreshSecret = () => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is required");
  return process.env.JWT_REFRESH_SECRET;
};

export const signAccessToken = (userId) =>
  jwt.sign({ sub: userId, type: "access" }, accessSecret(), { expiresIn: "15m" });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: userId, type: "refresh" }, refreshSecret(), { expiresIn: "7d" });

export const verifyAccessToken = (token) => jwt.verify(token, accessSecret());
export const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret());

const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge,
  path: "/"
});

export const setAuthCookies = (res, userId) => {
  res.cookie("accessToken", signAccessToken(userId), cookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", signRefreshToken(userId), cookieOptions(7 * 24 * 60 * 60 * 1000));
};

export const clearAuthCookies = (res) => {
  const { maxAge, ...clearOpts } = cookieOptions(0);
  res.clearCookie("accessToken", clearOpts);
  res.clearCookie("refreshToken", clearOpts);
};