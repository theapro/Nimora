import { Router, Request, Response } from "express";
import mysql from "mysql2/promise";
import crypto from "crypto";

class UserController {
  public router = Router();
  private db!: mysql.Pool;

  constructor() {
    this.initializeRoutes();
    this.initializeDatabase();
  }

  private initializeDatabase() {
    this.db = mysql.createPool({
      host: process.env.HOST || "localhost",
      user: process.env.USER || "root",
      password: process.env.PASSWORD || "",
      database: process.env.DATABASE || "nimora",
      port: parseInt(process.env.DB_PORT || "3306"),
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  private initializeRoutes() {
    this.router.post("/auth/register", this.register);
  }

  private hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  private register = async (req: Request, res: Response) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

      // Validation
      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      // Hash password
      const hashedPassword = this.hashPassword(password);

      // Insert user
      const [result] = await this.db.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
      );

      res.status(201).json({
        message: "User registered successfully",
        userId: (result as any).insertId,
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ error: "Username or email already exists" });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default UserController;
