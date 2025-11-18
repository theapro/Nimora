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
    try {
      this.db = mysql.createPool({
        host: process.env.HOST || "localhost",
        user: process.env.USER || "root",
        password: process.env.PASSWORD || "",
        database: process.env.DATABASE || "nimora",
        port: parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
      });
      console.log("Database pool created successfully");
    } catch (error) {
      console.error("Database initialization error:", error);
    }
  }

  private initializeRoutes() {
    this.router.post("/auth/register", this.register);
    this.router.post("/auth/login", this.login);
    console.log("User routes initialized: /api/auth/register, /api/auth/login");
  }

  private hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  private register = async (req: Request, res: Response) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

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

      const hashedPassword = this.hashPassword(password);

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

  private login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const [rows] = await this.db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      const hashedPassword = this.hashPassword(password);

      if (hashedPassword !== (rows as any)[0]?.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.status(200).json({
        message: "Login successful",
        userId: (rows as any)[0].id,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default UserController;
