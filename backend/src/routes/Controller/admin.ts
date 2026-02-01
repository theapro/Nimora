import { Router, Request, Response } from "express";
import pool from "../../utils/db";
import { verifyAdminToken, isAdmin, saveToken } from "../../middlewares/auth";
import { upload } from "../../middlewares/upload";
import crypto from "crypto";
import bcrypt from "bcrypt";

interface AuthRequest extends Request {
  userId?: number;
  role?: string;
}

class AdminController {
  public router = Router();
  private db = pool;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Auth - Dedicated Admin Login
    this.router.post("/admin/login", this.adminLogin);

    // Stats
    this.router.get("/admin/stats", verifyAdminToken, isAdmin, this.getStats);

    // User management
    this.router.get(
      "/admin/users",
      verifyAdminToken,
      isAdmin,
      this.getAllUsers,
    );
    this.router.put(
      "/admin/users/:id/role",
      verifyAdminToken,
      isAdmin,
      this.updateUserRole,
    );
    this.router.put(
      "/admin/users/:id/ban",
      verifyAdminToken,
      isAdmin,
      this.banUser,
    );
    this.router.delete(
      "/admin/users/:id",
      verifyAdminToken,
      isAdmin,
      this.deleteUser,
    );

    // Post management
    this.router.get(
      "/admin/posts",
      verifyAdminToken,
      isAdmin,
      this.getAllPosts,
    );
    this.router.delete(
      "/admin/posts/:id",
      verifyAdminToken,
      isAdmin,
      this.deletePost,
    );

    // Community management
    this.router.get(
      "/admin/communities",
      verifyAdminToken,
      isAdmin,
      this.getCommunities,
    );
    this.router.post(
      "/admin/communities",
      verifyAdminToken,
      isAdmin,
      this.createCommunity,
    );
    this.router.put(
      "/admin/communities/:id",
      verifyAdminToken,
      isAdmin,
      this.updateCommunity,
    );
    this.router.delete(
      "/admin/communities/:id",
      verifyAdminToken,
      isAdmin,
      this.deleteCommunity,
    );

    // Community image upload
    this.router.post(
      "/admin/communities/upload-image",
      verifyAdminToken,
      isAdmin,
      upload.single("communityImage"),
      this.uploadCommunityImage,
    );

    // Reports
    this.router.get(
      "/admin/reports",
      verifyAdminToken,
      isAdmin,
      this.getReports,
    );
    this.router.put(
      "/admin/reports/:id",
      verifyAdminToken,
      isAdmin,
      this.updateReportStatus,
    );

    // Site Settings
    this.router.get(
      "/admin/settings",
      verifyAdminToken,
      isAdmin,
      this.getSettings,
    );
    this.router.put(
      "/admin/settings",
      verifyAdminToken,
      isAdmin,
      this.updateSettings,
    );

    // Admin Logs
    this.router.get("/admin/logs", verifyAdminToken, isAdmin, this.getLogs);
  }

  private logAdminAction = async (
    adminId: number,
    actionType: string,
    targetId: number | null,
    details: string,
    ip: string,
  ) => {
    try {
      await this.db.execute(
        "INSERT INTO admin_logs (admin_id, action_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
        [adminId, actionType, targetId, details, ip],
      );
    } catch (error) {
      console.error("Log admin action error:", error);
    }
  };

  private getStats = async (req: AuthRequest, res: Response) => {
    try {
      const [userCount]: any = await this.db.execute(
        "SELECT COUNT(*) as count FROM users",
      );
      const [postCount]: any = await this.db.execute(
        "SELECT COUNT(*) as count FROM posts",
      );
      const [communityCount]: any = await this.db.execute(
        "SELECT COUNT(*) as count FROM communities",
      );
      const [reportCount]: any = await this.db.execute(
        "SELECT COUNT(*) as count FROM reports WHERE status = 'pending'",
      );

      res.status(200).json({
        users: userCount[0].count,
        posts: postCount[0].count,
        communities: communityCount[0].count,
        pendingReports: reportCount[0].count,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await this.db.execute(
        "SELECT id, username, email, role, is_verified, is_banned, created_at FROM users ORDER BY created_at DESC",
      );
      res.status(200).json({ users: rows });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!["user", "moderator", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      await this.db.execute("UPDATE users SET role = ? WHERE id = ?", [
        role,
        id,
      ]);

      this.logAdminAction(
        req.userId!,
        "update_user_role",
        parseInt(id),
        `Changed role to ${role}`,
        req.ip || "unknown",
      );

      res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private banUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { is_banned } = req.body;

      await this.db.execute("UPDATE users SET is_banned = ? WHERE id = ?", [
        is_banned,
        id,
      ]);

      this.logAdminAction(
        req.userId!,
        is_banned ? "ban_user" : "unban_user",
        parseInt(id),
        "",
        req.ip || "unknown",
      );

      res
        .status(200)
        .json({ message: is_banned ? "User banned" : "User unbanned" });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.db.execute("DELETE FROM users WHERE id = ?", [id]);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getAllPosts = async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await this.db.execute(
        `SELECT posts.*, users.username as author, communities.title as community 
         FROM posts 
         JOIN users ON posts.user_id = users.id 
         JOIN communities ON posts.community_id = communities.id 
         ORDER BY posts.created_at DESC`,
      );
      res.status(200).json({ posts: rows });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private deletePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.db.execute("DELETE FROM posts WHERE id = ?", [id]);
      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getCommunities = async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await this.db.execute(
        `SELECT c.id,
                c.title,
                c.slug,
                c.description,
                c.image,
                c.is_active,
                c.sort_order,
                c.created_at,
                (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id) AS post_count
         FROM communities c
         ORDER BY c.sort_order ASC, c.created_at DESC`,
      );

      res.status(200).json({ communities: rows });
    } catch (error) {
      console.error("Get communities error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private createCommunity = async (req: AuthRequest, res: Response) => {
    try {
      const { title, slug, description, image } = req.body;
      await this.db.execute(
        "INSERT INTO communities (title, slug, description, image) VALUES (?, ?, ?, ?)",
        [title, slug, description, image],
      );
      res.status(201).json({ message: "Community created successfully" });
    } catch (error) {
      console.error("Create community error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updateCommunity = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, image, is_active } = req.body;
      await this.db.execute(
        "UPDATE communities SET title = ?, description = ?, image = ?, is_active = ? WHERE id = ?",
        [title, description, image, is_active, id],
      );
      res.status(200).json({ message: "Community updated successfully" });
    } catch (error) {
      console.error("Update community error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private deleteCommunity = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await this.db.execute("DELETE FROM communities WHERE id = ?", [id]);
      res.status(200).json({ message: "Community deleted successfully" });
    } catch (error) {
      console.error("Delete community error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private uploadCommunityImage = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileUrl = (req.file as any).location || (req.file as any).url;
      if (!fileUrl) {
        return res.status(500).json({ error: "File URL not available" });
      }

      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: fileUrl,
      });
    } catch (error) {
      console.error("Community image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  };

  private getReports = async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await this.db.execute(
        `SELECT reports.*, users.username as reporter, posts.title as post_title 
         FROM reports 
         JOIN users ON reports.user_id = users.id 
         JOIN posts ON reports.post_id = posts.id 
         ORDER BY reports.created_at DESC`,
      );
      res.status(200).json({ reports: rows });
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updateReportStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, admin_note } = req.body;
      await this.db.execute(
        "UPDATE reports SET status = ?, admin_note = ? WHERE id = ?",
        [status, admin_note, id],
      );
      res.status(200).json({ message: "Report updated successfully" });
    } catch (error) {
      console.error("Update report error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getSettings = async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await this.db.execute("SELECT * FROM site_settings");
      res.status(200).json({ settings: rows });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updateSettings = async (req: AuthRequest, res: Response) => {
    try {
      const settings = req.body; // Expecting { key: value, ... }
      for (const [key, value] of Object.entries(settings)) {
        await this.db.execute(
          "INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
          [key, value, value],
        );
      }
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getLogs = async (req: AuthRequest, res: Response) => {
    try {
      const [rows] = await this.db.execute(
        `SELECT admin_logs.*, admin_users.username as admin_name 
         FROM admin_logs 
         JOIN admin_users ON admin_logs.admin_id = admin_users.id 
         ORDER BY created_at DESC LIMIT 100`,
      );
      res.status(200).json({ logs: rows });
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private adminLogin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const [rows] = await this.db.execute(
        "SELECT * FROM admin_users WHERE email = ?",
        [email],
      );

      const admin = (rows as any)[0];

      if (!admin) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordOk = await bcrypt.compare(password, admin.password);
      if (!isPasswordOk) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!admin.is_active) {
        return res.status(403).json({ error: "Admin account is disabled." });
      }

      const token = crypto.randomBytes(32).toString("hex");

      await this.db.execute(
        "INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
        [admin.id, token],
      );

      await this.db.execute(
        "UPDATE admin_users SET last_login_at = NOW() WHERE id = ?",
        [admin.id],
      );

      saveToken(token, admin.id, "admin");

      res.status(200).json({
        message: "Admin login successful",
        token: token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: "admin",
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default AdminController;
