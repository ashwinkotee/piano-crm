import jwt from "jsonwebtoken";

export function signAccess(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_TTL || "15m",
  });
}
export function signRefresh(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_TTL || "30d",
  });
}
export function verifyToken<T = any>(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as T;
}
