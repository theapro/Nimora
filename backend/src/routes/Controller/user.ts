import { Router, Request, Response } from "express";
import pool from "../../utils/db";
import crypto from "crypto";
import { verifyToken, saveToken } from "../../middlewares/auth";
import { upload } from "../../middlewares/upload";

interface AuthRequest extends Request {
  userId?: number;
}

class UserController {
  public router = Router();
  private db = pool;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/auth/register", this.register);
    this.router.post("/auth/login", this.login);
    this.router.get("/auth/verify", verifyToken, this.verifyToken);
    this.router.get("/user/:id", verifyToken, this.getUserProfile);
    this.router.put("/user/:id", verifyToken, this.updateUserProfile);
    this.router.post(
      "/user/:id/upload",
      verifyToken,
      upload.single("profileImage"),
      this.uploadProfileImage,
    );

    // Follow routes
    this.router.post("/user/:id/follow", verifyToken, this.followUser);
    this.router.delete("/user/:id/unfollow", verifyToken, this.unfollowUser);
    this.router.get("/user/:id/followers", this.getFollowers);
    this.router.get("/user/:id/following", this.getFollowing);
    this.router.get(
      "/user/:id/follow/check",
      verifyToken,
      this.checkFollowStatus,
    );

    // User posts routes
    this.router.get("/user/:id/commented", verifyToken, this.getCommentedPosts);
    this.router.get("/user/:id/liked", verifyToken, this.getLikedPosts);
    this.router.get("/user/:id/saved", verifyToken, this.getSavedPosts);
    this.router.get("/user/:id/posts/count", verifyToken, this.getPostsCount);

    // Save post routes
    this.router.post("/posts/:id/save", verifyToken, this.savePost);
    this.router.delete("/posts/:id/save", verifyToken, this.unsavePost);
    this.router.get("/posts/:id/save/check", verifyToken, this.checkSaveStatus);

    console.log(
      "User routes initialized: /api/auth/register, /api/auth/login, /api/user/:id",
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
        [username, email, hashedPassword],
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
        [email],
      );

      const hashedPassword = this.hashPassword(password);

      if (hashedPassword !== (rows as any)[0]?.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = (rows as any)[0];
      const token = crypto.randomBytes(32).toString("hex");

      // Save token for verification
      saveToken(token, user.id, user.role);

      res.status(200).json({
        message: "Login successful",
        token: token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private verifyToken = async (req: AuthRequest, res: Response) => {
    try {
      // If we reach here, token is valid (verifyToken middleware passed)
      res.status(200).json({
        valid: true,
        userId: req.userId,
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getUserProfile = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          id, 
          username, 
          email, 
          profile_image, 
          bio, 
          profession, 
          location, 
          website, 
          created_at,
          (SELECT COUNT(*) FROM followers WHERE following_id = users.id) as followers_count,
          (SELECT COUNT(*) FROM followers WHERE follower_id = users.id) as following_count,
          (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as posts_count
        FROM users 
        WHERE id = ?`,
        [id],
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
      const {
        username,
        email,
        bio,
        profile_image,
        profession,
        location,
        website,
      } = req.body;

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
      if (profession !== undefined) {
        updates.push("profession = ?");
        values.push(profession);
      }
      if (location !== undefined) {
        updates.push("location = ?");
        values.push(location);
      }
      if (website !== undefined) {
        updates.push("website = ?");
        values.push(website);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(id);

      const [result] = await this.db.execute(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const [rows] = await this.db.execute(
        "SELECT id, username, email, profile_image, bio, profession, location, website, created_at FROM users WHERE id = ?",
        [id],
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

      const imageUrl = (req.file as any).location;

      await this.db.execute("UPDATE users SET profile_image = ? WHERE id = ?", [
        imageUrl,
        id,
      ]);

      const [rows] = await this.db.execute(
        "SELECT id, username, email, profile_image, bio, profession, location, website, created_at FROM users WHERE id = ?",
        [id],
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

  // Follow methods
  private followUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const followerId = req.userId;

      if (!followerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (followerId === parseInt(id)) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      // Check if user exists
      const [userExists] = await this.db.execute(
        "SELECT id FROM users WHERE id = ?",
        [id],
      );

      if ((userExists as any).length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if already following
      const [existing] = await this.db.execute(
        "SELECT id FROM followers WHERE follower_id = ? AND following_id = ?",
        [followerId, id],
      );

      if ((existing as any).length > 0) {
        return res.status(400).json({ error: "Already following this user" });
      }

      await this.db.execute(
        "INSERT INTO followers (follower_id, following_id) VALUES (?, ?)",
        [followerId, id],
      );

      res.status(201).json({ message: "Successfully followed user" });
    } catch (error) {
      console.error("Follow user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private unfollowUser = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const followerId = req.userId;

      if (!followerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [result] = await this.db.execute(
        "DELETE FROM followers WHERE follower_id = ? AND following_id = ?",
        [followerId, id],
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Not following this user" });
      }

      res.status(200).json({ message: "Successfully unfollowed user" });
    } catch (error) {
      console.error("Unfollow user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getFollowers = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          users.id,
          users.username,
          users.profile_image,
          users.bio,
          users.profession
        FROM followers
        JOIN users ON followers.follower_id = users.id
        WHERE followers.following_id = ?
        ORDER BY followers.created_at DESC`,
        [id],
      );

      res.status(200).json({ followers: rows });
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getFollowing = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          users.id,
          users.username,
          users.profile_image,
          users.bio,
          users.profession
        FROM followers
        JOIN users ON followers.following_id = users.id
        WHERE followers.follower_id = ?
        ORDER BY followers.created_at DESC`,
        [id],
      );

      res.status(200).json({ following: rows });
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private checkFollowStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const followerId = req.userId;

      if (!followerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [rows] = await this.db.execute(
        "SELECT id FROM followers WHERE follower_id = ? AND following_id = ?",
        [followerId, id],
      );

      res.status(200).json({ isFollowing: (rows as any).length > 0 });
    } catch (error) {
      console.error("Check follow status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getCommentedPosts = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const requestUserId = req.userId;

      if (!requestUserId || requestUserId !== parseInt(id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
          posts.content,
          posts.cover_image,
          posts.created_at,
          users.id as author_id,
          users.username as author_username,
          users.profile_image as author_profile_image,
          users.bio as author_bio,
          users.profession as author_profession,
          (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags,
          MAX(comments.created_at) as last_comment_at
        FROM comments
        JOIN posts ON comments.post_id = posts.id
        JOIN users ON posts.user_id = users.id
        WHERE comments.user_id = ?
        GROUP BY posts.id, posts.title, posts.content, posts.cover_image, posts.created_at,
                 users.id, users.username, users.profile_image, users.bio, users.profession
        ORDER BY last_comment_at DESC`,
        [id],
      );

      const posts = (rows as any[]).map((row) => {
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          coverImage: row.cover_image,
          tags: row.tags || [],
          created_at: row.created_at,
          author: {
            id: row.author_id,
            username: row.author_username,
            profile_image: row.author_profile_image,
            bio: row.author_bio,
            profession: row.author_profession,
          },
          likes: row.likes,
          comments: row.comments,
        };
      });

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get commented posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getLikedPosts = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const requestUserId = req.userId;

      if (!requestUserId || requestUserId !== parseInt(id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
          posts.content,
          posts.cover_image,
          posts.created_at,
          users.id as author_id,
          users.username as author_username,
          users.profile_image as author_profile_image,
          users.bio as author_bio,
          users.profession as author_profession,
          (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags
        FROM likes
        JOIN posts ON likes.post_id = posts.id
        JOIN users ON posts.user_id = users.id
        WHERE likes.user_id = ?
        ORDER BY likes.created_at DESC`,
        [id],
      );

      const posts = (rows as any[]).map((row) => {
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          coverImage: row.cover_image,
          tags: row.tags || [],
          created_at: row.created_at,
          author: {
            id: row.author_id,
            username: row.author_username,
            profile_image: row.author_profile_image,
            bio: row.author_bio,
            profession: row.author_profession,
          },
          likes: row.likes,
          comments: row.comments,
        };
      });

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get liked posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getSavedPosts = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const requestUserId = req.userId;

      if (!requestUserId || requestUserId !== parseInt(id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
          posts.content,
          posts.cover_image,
          posts.created_at,
          users.id as author_id,
          users.username as author_username,
          users.profile_image as author_profile_image,
          users.bio as author_bio,
          users.profession as author_profession,
          (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comments,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags
        FROM saved_posts
        JOIN posts ON saved_posts.post_id = posts.id
        JOIN users ON posts.user_id = users.id
        WHERE saved_posts.user_id = ?
        ORDER BY saved_posts.created_at DESC`,
        [id],
      );

      const posts = (rows as any[]).map((row) => {
        return {
          id: row.id,
          title: row.title,
          content: row.content,
          coverImage: row.cover_image,
          tags: row.tags || [],
          created_at: row.created_at,
          author: {
            id: row.author_id,
            username: row.author_username,
            profile_image: row.author_profile_image,
            bio: row.author_bio,
            profession: row.author_profession,
          },
          likes: row.likes,
          comments: row.comments,
        };
      });

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get saved posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getPostsCount = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const requestUserId = req.userId;

      if (!requestUserId || requestUserId !== parseInt(id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get count of posts created by user
      const [totalRows] = await this.db.execute(
        "SELECT COUNT(*) as count FROM posts WHERE user_id = ?",
        [id],
      );

      // Get count of posts commented by user
      const [commentedRows] = await this.db.execute(
        "SELECT COUNT(DISTINCT post_id) as count FROM comments WHERE user_id = ?",
        [id],
      );

      // Get count of posts liked by user
      const [likedRows] = await this.db.execute(
        "SELECT COUNT(*) as count FROM likes WHERE user_id = ?",
        [id],
      );

      // Get count of saved posts
      const [savedRows] = await this.db.execute(
        "SELECT COUNT(*) as count FROM saved_posts WHERE user_id = ?",
        [id],
      );

      res.status(200).json({
        total: (totalRows as any)[0].count,
        commented: (commentedRows as any)[0].count,
        liked: (likedRows as any)[0].count,
        saved: (savedRows as any)[0].count,
      });
    } catch (error) {
      console.error("Get posts count error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private savePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await this.db.execute(
        "INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)",
        [userId, id],
      );

      res.status(201).json({ message: "Post saved successfully" });
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Post already saved" });
      }
      console.error("Save post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private unsavePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [result] = await this.db.execute(
        "DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?",
        [userId, id],
      );

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Post not saved" });
      }

      res.status(200).json({ message: "Post unsaved successfully" });
    } catch (error) {
      console.error("Unsave post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private checkSaveStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [rows] = await this.db.execute(
        "SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?",
        [userId, id],
      );

      res.status(200).json({ isSaved: (rows as any).length > 0 });
    } catch (error) {
      console.error("Check save status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default UserController;
