import { Request, Response, NextFunction } from "express";
import pool from "../utils/db";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

interface AuthRequest extends Request {
  userId?: number;
  role?: string;
}

type AccessTokenPayload = JwtPayload & {
  userId: number;
  role: string;
};

const getJwtSecret = () => {
  const secret =
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "nimora-dev-secret";

  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] JWT_SECRET is not set. Using a fallback secret (NOT recommended for production).",
    );
  }

  return secret;
};

export const signAccessToken = (payload: {
  userId: number;
  role: string;
  expiresIn?: string;
}) => {
  const { expiresIn, ...rest } = payload;
  const secret = getJwtSecret();

  const ttl = (expiresIn ||
    process.env.JWT_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"];

  return jwt.sign(rest, secret, {
    expiresIn: ttl,
  });
};

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7);
};

const verifyJwt = (token: string): AccessTokenPayload => {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret) as JwtPayload;

  const userId = (decoded as any).userId;
  const role = (decoded as any).role;

  if (typeof userId !== "number" || typeof role !== "string") {
    throw new Error("Invalid token payload");
  }

  return decoded as AccessTokenPayload;
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const payload = verifyJwt(token);

    // Optional hard checks from DB (keeps banned/disabled users out)
    if (payload.role !== "admin") {
      const [rows] = await pool.execute(
        "SELECT is_banned, role FROM users WHERE id = ? LIMIT 1",
        [payload.userId],
      );
      const user = (rows as any)[0];
      if (!user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      if (user.is_banned) {
        return res.status(403).json({ error: "User is banned" });
      }
    }

    req.userId = payload.userId;
    req.role = payload.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const verifyAdminToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const payload = verifyJwt(token);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    // Confirm admin still active
    const [rows] = await pool.execute(
      "SELECT is_active FROM admin_users WHERE id = ? LIMIT 1",
      [payload.userId],
    );
    const admin = (rows as any)[0];
    if (!admin || !admin.is_active) {
      return res.status(403).json({ error: "Admin account is disabled." });
    }

    req.userId = payload.userId;
    req.role = payload.role;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const isAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(req);
    if (token) {
      try {
        const payload = verifyJwt(token);
        req.userId = payload.userId;
        req.role = payload.role;
      } catch {
        // Ignore invalid token for optional auth
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
};
