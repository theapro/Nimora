import { Router, Request, Response } from "express";
import mysql from "mysql2/promise";
import { verifyToken, optionalAuth } from "../../middlewares/auth";
import { upload } from "../../middlewares/upload";

interface AuthRequest extends Request {
  userId?: number;
}

class PostController {
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
      console.log("Post database pool created successfully");
    } catch (error) {
      console.error("Post database initialization error:", error);
    }
  }

  private initializeRoutes() {
    this.router.post(
      "/posts",
      verifyToken,
      upload.single("coverImage"),
      this.createPost
    );
    this.router.get("/posts", optionalAuth, this.getAllPosts);
    this.router.get("/posts/top/discussions", this.getTopDiscussions);
    this.router.get("/posts/:id", this.getPostById);
    this.router.put(
      "/posts/:id",
      verifyToken,
      upload.single("coverImage"),
      this.updatePost
    );
    this.router.delete("/posts/:id", verifyToken, this.deletePost);
    this.router.get("/users/:userId/posts", this.getUserPosts);

    // Like endpoints
    this.router.post("/posts/:id/like", verifyToken, this.likePost);
    this.router.delete("/posts/:id/like", verifyToken, this.unlikePost);
    this.router.get("/posts/:id/likes", this.getPostLikes);
    this.router.get("/posts/:id/like/check", verifyToken, this.checkUserLike);

    // Comment endpoints
    this.router.post("/posts/:id/comments", verifyToken, this.addComment);
    this.router.get("/posts/:id/comments", this.getPostComments);
    this.router.delete("/comments/:id", verifyToken, this.deleteComment);

    console.log("Post routes initialized");
  }

  private parseTags(tags: any): string[] {
    if (!tags) return [];

    try {
      // If it's already an array, return it
      if (Array.isArray(tags)) return tags;

      // Try to parse as JSON
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If JSON parsing fails, treat as comma-separated string
      if (typeof tags === "string") {
        return tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter(Boolean);
      }
      return [];
    }
  }

  private createPost = async (req: AuthRequest, res: Response) => {
    try {
      const { title, content, tags, category_id } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!title || !content) {
        return res
          .status(400)
          .json({ error: "Title and content are required" });
      }

      if (!category_id) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Parse tags if it's a string
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        } catch (e) {
          // If tags is a comma-separated string, split it
          parsedTags = tags.split(",").map((tag: string) => tag.trim());
        }
      }

      const coverImage = req.file ? req.file.filename : null;

      const [result] = await this.db.execute(
        "INSERT INTO posts (user_id, category_id, title, content, cover_image, tags) VALUES (?, ?, ?, ?, ?, ?)",
        [
          userId,
          category_id,
          title,
          content,
          coverImage,
          JSON.stringify(parsedTags),
        ]
      );

      const postId = (result as any).insertId;

      res.status(201).json({
        message: "Post created successfully",
        postId,
        coverImage,
        tags: parsedTags,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getAllPosts = async (req: AuthRequest, res: Response) => {
    try {
      const { feed = "forYou", sort = "latest", community } = req.query;
      const userId = req.userId;

      let baseQuery = `
        SELECT 
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
        LEFT JOIN communities ON posts.category_id = communities.id
      `;

      let whereClause = "";
      const queryParams: any[] = [];

      // Filter by community
      if (community) {
        whereClause = "WHERE posts.category_id = ?";
        queryParams.push(community);
      }

      // Filter by feed type
      if (feed === "following" && userId) {
        whereClause +=
          (whereClause ? " AND " : "WHERE ") +
          `posts.user_id IN (
          SELECT following_id FROM followers WHERE follower_id = ?
        )`;
        queryParams.push(userId);
      }

      // Add order clause based on sort
      let orderClause = "";
      switch (sort) {
        case "latest":
          orderClause = "ORDER BY posts.created_at DESC";
          break;
        case "top-week":
          whereClause +=
            (whereClause ? " AND " : "WHERE ") +
            "posts.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)";
          orderClause = "ORDER BY likes_count DESC, posts.created_at DESC";
          break;
        case "top-month":
          whereClause +=
            (whereClause ? " AND " : "WHERE ") +
            "posts.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
          orderClause = "ORDER BY likes_count DESC, posts.created_at DESC";
          break;
        case "top-year":
          whereClause +=
            (whereClause ? " AND " : "WHERE ") +
            "posts.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
          orderClause = "ORDER BY likes_count DESC, posts.created_at DESC";
          break;
        case "top-all":
          orderClause = "ORDER BY likes_count DESC, posts.created_at DESC";
          break;
        default:
          orderClause = "ORDER BY posts.created_at DESC";
      }

      const finalQuery = baseQuery + whereClause + " " + orderClause;

      const [rows] = await this.db.execute(finalQuery, queryParams);

      // Parse tags JSON for each post
      const posts = (rows as any[]).map((post) => ({
        ...post,
        tags: this.parseTags(post.tags),
      }));

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getPostById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
          posts.content,
          posts.cover_image,
          posts.tags,
          posts.created_at,
          posts.updated_at,
          users.id as user_id,
          users.username,
          users.profile_image
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.id = ?`,
        [id]
      );

      if ((rows as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = (rows as any)[0];
      post.tags = this.parseTags(post.tags);

      res.status(200).json({ post });
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updatePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, tags, category_id } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if post exists and belongs to user
      const [existing] = await this.db.execute(
        "SELECT user_id FROM posts WHERE id = ?",
        [id]
      );

      if ((existing as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if ((existing as any)[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this post" });
      }

      // Parse tags
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = tags.split(",").map((tag: string) => tag.trim());
        }
      }

      const coverImage = req.file ? req.file.filename : undefined;

      // Build update query dynamically
      let updateQuery = "UPDATE posts SET ";
      const updateValues: any[] = [];

      if (title !== undefined) {
        updateQuery += "title = ?, ";
        updateValues.push(title);
      }
      if (content !== undefined) {
        updateQuery += "content = ?, ";
        updateValues.push(content);
      }
      if (category_id !== undefined) {
        updateQuery += "category_id = ?, ";
        updateValues.push(category_id);
      }
      if (coverImage) {
        updateQuery += "cover_image = ?, ";
        updateValues.push(coverImage);
      }
      if (tags !== undefined) {
        updateQuery += "tags = ?, ";
        updateValues.push(JSON.stringify(parsedTags));
      }

      // Remove trailing comma and space
      updateQuery = updateQuery.slice(0, -2);
      updateQuery += " WHERE id = ?";
      updateValues.push(id);

      await this.db.execute(updateQuery, updateValues);

      res.status(200).json({ message: "Post updated successfully" });
    } catch (error) {
      console.error("Update post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private deletePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if post exists and belongs to user
      const [existing] = await this.db.execute(
        "SELECT user_id FROM posts WHERE id = ?",
        [id]
      );

      if ((existing as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if ((existing as any)[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this post" });
      }

      await this.db.execute("DELETE FROM posts WHERE id = ?", [id]);

      res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getUserPosts = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
          posts.content,
          posts.cover_image,
          posts.tags,
          posts.created_at,
          posts.updated_at,
          users.id as user_id,
          users.username,
          users.profile_image,
          users.profession,
          (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.user_id = ?
        ORDER BY posts.created_at DESC`,
        [userId]
      );

      const posts = (rows as any[]).map((post) => ({
        ...post,
        tags: this.parseTags(post.tags),
      }));

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Like methods
  private likePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if post exists
      const [postExists] = await this.db.execute(
        "SELECT id FROM posts WHERE id = ?",
        [id]
      );

      if ((postExists as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if already liked
      const [existing] = await this.db.execute(
        "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
        [userId, id]
      );

      if ((existing as any).length > 0) {
        return res.status(400).json({ error: "Post already liked" });
      }

      await this.db.execute(
        "INSERT INTO likes (user_id, post_id) VALUES (?, ?)",
        [userId, id]
      );

      // Get updated like count
      const [likesCount] = await this.db.execute(
        "SELECT COUNT(*) as count FROM likes WHERE post_id = ?",
        [id]
      );

      res.status(201).json({
        message: "Post liked successfully",
        likes: (likesCount as any)[0].count,
      });
    } catch (error) {
      console.error("Like post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private unlikePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [result] = await this.db.execute(
        "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
        [userId, id]
      );

      if ((result as any).affectedRows === 0) {
        return res.status(400).json({ error: "Like not found" });
      }

      // Get updated like count
      const [likesCount] = await this.db.execute(
        "SELECT COUNT(*) as count FROM likes WHERE post_id = ?",
        [id]
      );

      res.status(200).json({
        message: "Post unliked successfully",
        likes: (likesCount as any)[0].count,
      });
    } catch (error) {
      console.error("Unlike post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getPostLikes = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          likes.id,
          likes.created_at,
          users.id as user_id,
          users.username,
          users.profile_image
        FROM likes
        JOIN users ON likes.user_id = users.id
        WHERE likes.post_id = ?
        ORDER BY likes.created_at DESC`,
        [id]
      );

      res.status(200).json({ likes: rows });
    } catch (error) {
      console.error("Get post likes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private checkUserLike = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [rows] = await this.db.execute(
        "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
        [userId, id]
      );

      res.status(200).json({
        isLiked: (rows as any).length > 0,
      });
    } catch (error) {
      console.error("Check user like error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Comment methods
  private addComment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "Comment content is required" });
      }

      // Check if post exists
      const [postExists] = await this.db.execute(
        "SELECT id FROM posts WHERE id = ?",
        [id]
      );

      if ((postExists as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const [result] = await this.db.execute(
        "INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)",
        [userId, id, content]
      );

      const commentId = (result as any).insertId;

      // Get the created comment with user info
      const [comment] = await this.db.execute(
        `SELECT 
          comments.id,
          comments.content,
          comments.created_at,
          users.id as user_id,
          users.username,
          users.profile_image
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.id = ?`,
        [commentId]
      );

      res.status(201).json({
        message: "Comment added successfully",
        comment: (comment as any)[0],
      });
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getPostComments = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [rows] = await this.db.execute(
        `SELECT 
          comments.id,
          comments.content,
          comments.created_at,
          comments.updated_at,
          users.id as user_id,
          users.username,
          users.profile_image
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.created_at DESC`,
        [id]
      );

      res.status(200).json({ comments: rows });
    } catch (error) {
      console.error("Get post comments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private deleteComment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if comment exists and belongs to user
      const [existing] = await this.db.execute(
        "SELECT user_id FROM comments WHERE id = ?",
        [id]
      );

      if ((existing as any).length === 0) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if ((existing as any)[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this comment" });
      }

      await this.db.execute("DELETE FROM comments WHERE id = ?", [id]);

      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getTopDiscussions = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const [rows] = await this.db.query(
        `SELECT 
          posts.id,
          posts.title,
          COUNT(comments.id) as comments_count
        FROM posts
        LEFT JOIN comments ON comments.post_id = posts.id
        GROUP BY posts.id, posts.title, posts.created_at
        ORDER BY comments_count DESC, posts.created_at DESC
        LIMIT ${limit}`
      );

      res.status(200).json({ posts: rows });
    } catch (error) {
      console.error("Get top discussions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default PostController;
