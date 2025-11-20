import { Router, Request, Response } from "express";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { verifyToken, saveToken } from "../../middlewares/auth";
import { upload } from "../../middlewares/upload";

interface AuthRequest extends Request {
  userId?: number;
}

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
    this.router.get("/user/:id", verifyToken, this.getUserProfile);
    this.router.put("/user/:id", verifyToken, this.updateUserProfile);
    this.router.post(
      "/user/:id/upload",
      verifyToken,
      upload.single("profileImage"),
      this.uploadProfileImage
    );
    console.log(
      "User routes initialized: /api/auth/register, /api/auth/login, /api/user/:id"
    );
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

      const user = (rows as any)[0];
      const token = crypto.randomBytes(32).toString("hex");

      // Save token for verification
      saveToken(token, user.id);

      res.status(200).json({
        message: "Login successful",
        token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getUserProfile = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        "SELECT id, username, email, profile_image, bio, created_at FROM users WHERE id = ?",
        [id]
      );

      if ((rows as any).length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = (rows as any)[0];
      res.status(200).json({ user });
    } catch (error) {
      console.error("Get user profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updateUserProfile = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { username, email, bio, profile_image } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (username) {
        updates.push("username = ?");
        values.push(username);
      }
      if (email) {
        updates.push("email = ?");
        values.push(email);
      }
      if (bio !== undefined) {
        updates.push("bio = ?");
        values.push(bio);
      }
      if (profile_image !== undefined) {
        updates.push("profile_image = ?");
        values.push(profile_image);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(id);

      const [result] = await this.db.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const [rows] = await this.db.execute(
        "SELECT id, username, email, profile_image, bio, created_at FROM users WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Profile updated successfully",
        user: (rows as any)[0],
      });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Username already exists" });
      }
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private uploadProfileImage = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (parseInt(id) !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;

      await this.db.execute("UPDATE users SET profile_image = ? WHERE id = ?", [
        imageUrl,
        id,
      ]);

      const [rows] = await this.db.execute(
        "SELECT id, username, email, profile_image, bio, created_at FROM users WHERE id = ?",
        [id]
      );

      res.status(200).json({
        message: "Profile image uploaded successfully",
        user: (rows as any)[0],
      });
    } catch (error) {
      console.error("Upload profile image error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default UserController;
