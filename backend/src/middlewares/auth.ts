import { Request, Response, NextFunction } from "express";
import mysql from "mysql2/promise";

interface AuthRequest extends Request {
  userId?: number;
}

// In-memory token store (for production, use Redis or database)
const tokenStore = new Map<string, number>();

export const saveToken = (token: string, userId: number) => {
  tokenStore.set(token, userId);
};

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    // Check if token exists in store
    const userId = tokenStore.get(token);

    if (!userId) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Attach userId to request
    req.userId = userId;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const userId = tokenStore.get(token);

      if (userId) {
        req.userId = userId;
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
