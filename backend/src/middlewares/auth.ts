import { Request, Response, NextFunction } from "express";
import mysql from "mysql2/promise";
import pool from "../utils/db";

interface AuthRequest extends Request {
  userId?: number;
  role?: string;
}

// In-memory token store (for production, use Redis or database)
const tokenStore = new Map<string, { userId: number; role: string }>();

export const saveToken = (token: string, userId: number, role: string) => {
  tokenStore.set(token, { userId, role });
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // Check if token exists in store
    const session = tokenStore.get(token);

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach userId and role to request
    req.userId = session.userId;
    req.role = session.role;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyAdminToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // First check in-memory for speed
    const inMemory = tokenStore.get(token);
    if (inMemory?.role === "admin") {
      req.userId = inMemory.userId;
      req.role = inMemory.role;
      return next();
    }

    // Fallback to DB for persistence
    const [rows] = await pool.execute(
      `SELECT s.admin_id
       FROM admin_sessions s
       JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND a.is_active = TRUE
       LIMIT 1`,
      [token],
    );

    const session = (rows as any)[0];
    if (!session) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Cache in memory
    saveToken(token, session.admin_id, "admin");
    req.userId = session.admin_id;
    req.role = "admin";
    return next();
  } catch (error) {
    console.error("verifyAdminToken error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const session = tokenStore.get(token);

      if (session) {
        req.userId = session.userId;
        req.role = session.role;
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
};

export const removeToken = (token: string) => {
  tokenStore.delete(token);
};
