import { Router, Request, Response } from "express";
import mysql from "mysql2/promise";

class CategoryController {
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
      console.log("Category database pool created successfully");
    } catch (error) {
      console.error("Category database initialization error:", error);
    }
  }

  private initializeRoutes() {
    this.router.get("/communities", this.getAllCommunities);
    this.router.get("/communities/:id", this.getCommunityById);
    this.router.get("/communities/:id/posts", this.getCommunityPosts);
    console.log("Community routes initialized");
  }

  private getAllCommunities = async (req: Request, res: Response) => {
    try {
      const [rows] = await this.db.execute(
        `SELECT 
          id, 
          title, 
          description, 
          image,
          (SELECT COUNT(*) FROM posts WHERE posts.category_id = communities.id) as post_count
        FROM communities
        ORDER BY title ASC`
      );

      res.status(200).json({ communities: rows });
    } catch (error) {
      console.error("Get communities error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getCommunityById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          id, 
          title, 
          description, 
          image,
          (SELECT COUNT(*) FROM posts WHERE posts.category_id = communities.id) as post_count
        FROM communities
        WHERE id = ?`,
        [id]
      );

      if ((rows as any).length === 0) {
        return res.status(404).json({ error: "Community not found" });
      }

      res.status(200).json({ community: (rows as any)[0] });
    } catch (error) {
      console.error("Get community error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getCommunityPosts = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First get community
      const [communityRows] = await this.db.execute(
        "SELECT id FROM communities WHERE id = ?",
        [id]
      );

      if ((communityRows as any).length === 0) {
        return res.status(404).json({ error: "Community not found" });
      }

      const categoryId = (communityRows as any)[0].id;

      // Get posts for this category
      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
          posts.content,
          posts.cover_image,
          posts.tags,
          posts.created_at,
          posts.updated_at,
          posts.category_id,
          users.id as user_id,
          users.username,
          users.profile_image,
          users.profession,
          communities.title as community_title,
          communities.image as community_image,
          (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        JOIN communities ON posts.category_id = communities.id
        WHERE posts.category_id = ?
        ORDER BY posts.created_at DESC`,
        [categoryId]
      );

      // Parse tags for each post
      const posts = (rows as any[]).map((post) => ({
        ...post,
        tags: post.tags ? JSON.parse(post.tags) : [],
      }));

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get category posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default CategoryController;
