import { Router, Request, Response } from "express";
import pool from "../../utils/db";
import { verifyToken, optionalAuth } from "../../middlewares/auth";
import { upload } from "../../middlewares/upload";
import "multer";
import "multer-s3";

interface AuthRequest extends Request {
  userId?: number;
}

class PostController {
  public router = Router();
  private db = pool;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/posts",
      verifyToken,
      upload.single("cover_image"),
      this.createPost,
    );
    this.router.get("/posts", optionalAuth, this.getAllPosts);
    this.router.get("/search", optionalAuth, this.search);
    this.router.get("/posts/top/discussions", this.getTopDiscussions);
    this.router.get("/posts/trending/tags", this.getTrendingTags);
    this.router.get("/posts/saved", verifyToken, this.getSavedPosts);
    this.router.get("/posts/:id", this.getPostById);
    this.router.put(
      "/posts/:id",
      verifyToken,
      upload.single("coverImage"),
      this.updatePost,
    );
    this.router.delete("/posts/:id", verifyToken, this.deletePost);
    this.router.get("/users/:userId/posts", this.getUserPosts);

    // Like endpoints
    this.router.post("/posts/:id/like", verifyToken, this.likePost);
    this.router.delete("/posts/:id/like", verifyToken, this.unlikePost);
    this.router.get("/posts/:id/likes", this.getPostLikes);
    this.router.get("/posts/:id/like/check", verifyToken, this.checkUserLike);

    // Save endpoints
    this.router.post("/posts/:id/save", verifyToken, this.savePost);
    this.router.delete("/posts/:id/save", verifyToken, this.unsavePost);
    this.router.get("/posts/:id/save/check", verifyToken, this.checkUserSave);

    // Comment endpoints
    this.router.post("/posts/:id/comments", verifyToken, this.addComment);
    this.router.get("/posts/:id/comments", this.getPostComments);
    this.router.delete("/comments/:id", verifyToken, this.deleteComment);

    console.log("Post routes initialized");
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-") +
      "-" +
      Date.now()
    );
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
      const { title, content, tags, community_id } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!title || !content || !community_id) {
        return res
          .status(400)
          .json({ error: "Title, content and community_id are required" });
      }

      const parsedTags = this.parseTags(tags);

      // Multer-S3 faylni yuklagandan so'ng 'location' maydonida URL qaytaradi
      const file = req.file as any;
      const coverImage = file ? file.location : null;

      const slug = this.generateSlug(title);
      const connection = await this.db.getConnection();

      await connection.beginTransaction();

      try {
        const [result] = await connection.execute(
          "INSERT INTO posts (user_id, community_id, title, slug, content, cover_image) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, community_id, title, slug, content, coverImage],
        );

        const postId = (result as any).insertId;

        if (parsedTags.length > 0) {
          for (const tagName of parsedTags) {
            await connection.execute(
              "INSERT IGNORE INTO tags (name) VALUES (?)",
              [tagName],
            );
            const [existingTag]: any = await connection.execute(
              "SELECT id FROM tags WHERE name = ?",
              [tagName],
            );
            const tagId = existingTag[0].id;
            await connection.execute(
              "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
              [postId, tagId],
            );
          }
        }

        await connection.commit();
        res.status(201).json({
          message: "Post created successfully",
          postId,
          slug,
          coverImage,
          tags: parsedTags,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private updatePost = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { title, content, tags, community_id } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [existing]: any = await this.db.execute(
        "SELECT user_id FROM posts WHERE id = ?",
        [id],
      );

      if (existing.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (existing[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this post" });
      }

      // Yangi rasm bo'lsa yangi URL, bo'lmasa undefined
      const file = req.file as any;
      const coverImage = file ? file.location : undefined;

      const connection = await this.db.getConnection();
      await connection.beginTransaction();

      try {
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
        if (community_id !== undefined) {
          updateQuery += "community_id = ?, ";
          updateValues.push(community_id);
        }
        if (coverImage) {
          updateQuery += "cover_image = ?, ";
          updateValues.push(coverImage);
        }

        if (updateValues.length > 0) {
          updateQuery = updateQuery.slice(0, -2) + " WHERE id = ?";
          updateValues.push(id);
          await connection.execute(updateQuery, updateValues);
        }

        if (tags !== undefined) {
          const parsedTags = this.parseTags(tags);
          await connection.execute("DELETE FROM post_tags WHERE post_id = ?", [
            id,
          ]);

          if (parsedTags.length > 0) {
            for (const tagName of parsedTags) {
              await connection.execute(
                "INSERT IGNORE INTO tags (name) VALUES (?)",
                [tagName],
              );
              const [tagResult]: any = await connection.execute(
                "SELECT id FROM tags WHERE name = ?",
                [tagName],
              );
              const tagId = tagResult[0].id;
              await connection.execute(
                "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
                [id, tagId],
              );
            }
          }
        }

        await connection.commit();
        res.status(200).json({
          message: "Post updated successfully",
          coverImage: coverImage,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Update post error:", error);
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
          posts.slug,
          posts.content,
          posts.cover_image,
          posts.created_at,
          posts.updated_at,
          posts.community_id,
          users.id as user_id,
          users.username,
          users.profile_image,
          users.profession,
          communities.title as community_title,
          communities.image as community_image,
          (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments_count,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags ${
            userId
              ? `,
            EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked,
            EXISTS(SELECT 1 FROM saved_posts WHERE saved_posts.post_id = posts.id AND saved_posts.user_id = ?) as is_saved`
              : ""
          }
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN communities ON posts.community_id = communities.id
      `;

      let whereClause = "";
      const queryParams: any[] = [];

      if (userId) {
        queryParams.push(userId, userId);
      }

      // Filter by community
      if (community) {
        whereClause = "WHERE posts.community_id = ?";
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
          posts.slug,
          posts.content,
          posts.cover_image,
          posts.created_at,
          posts.updated_at,
          posts.community_id,
          users.id as user_id,
          users.username,
          users.profile_image,
          communities.title as community_title,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN communities ON posts.community_id = communities.id
        WHERE posts.id = ?`,
        [id],
      );

      if ((rows as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = (rows as any)[0];
      post.tags = post.tags || [];

      res.status(200).json({ post });
    } catch (error) {
      console.error("Get post error:", error);
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
        [id],
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
          posts.slug,
          posts.content,
          posts.cover_image,
          posts.created_at,
          posts.updated_at,
          users.id as user_id,
          users.username,
          users.profile_image,
          users.profession,
          (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments_count,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.user_id = ?
        ORDER BY posts.created_at DESC`,
        [userId],
      );

      res.status(200).json({ posts: rows });
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
        [id],
      );

      if ((postExists as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Check if already liked
      const [existing] = await this.db.execute(
        "SELECT id FROM likes WHERE user_id = ? AND post_id = ?",
        [userId, id],
      );

      if ((existing as any).length > 0) {
        return res.status(400).json({ error: "Post already liked" });
      }

      await this.db.execute(
        "INSERT INTO likes (user_id, post_id) VALUES (?, ?)",
        [userId, id],
      );

      // Get updated like count
      const [likesCount] = await this.db.execute(
        "SELECT COUNT(*) as count FROM likes WHERE post_id = ?",
        [id],
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
        [userId, id],
      );

      if ((result as any).affectedRows === 0) {
        return res.status(400).json({ error: "Like not found" });
      }

      // Get updated like count
      const [likesCount] = await this.db.execute(
        "SELECT COUNT(*) as count FROM likes WHERE post_id = ?",
        [id],
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
        [id],
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
        [userId, id],
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
      const { content, parentId } = req.body;
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
        [id],
      );

      if ((postExists as any).length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      // If parentId is provided, check if parent comment exists and belongs to the same post
      if (parentId) {
        const [parentComment] = await this.db.execute(
          "SELECT id FROM comments WHERE id = ? AND post_id = ?",
          [parentId, id],
        );
        if ((parentComment as any).length === 0) {
          return res.status(400).json({ error: "Parent comment not found" });
        }
      }

      const [result] = await this.db.execute(
        "INSERT INTO comments (user_id, post_id, content, parent_id) VALUES (?, ?, ?, ?)",
        [userId, id, content, parentId || null],
      );

      const commentId = (result as any).insertId;

      // Get the created comment with user info
      const [comment] = await this.db.execute(
        `SELECT 
          comments.id,
          comments.content,
          comments.created_at,
          comments.parent_id,
          users.id as user_id,
          users.username,
          users.profile_image
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.id = ?`,
        [commentId],
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
          comments.parent_id,
          users.id as user_id,
          users.username,
          users.profile_image
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.post_id = ?
        ORDER BY comments.created_at ASC`,
        [id],
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
        [id],
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

  // Save methods
  private savePost = async (req: AuthRequest, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = req.userId;

      await this.db.query(
        "INSERT IGNORE INTO saved_posts (user_id, post_id) VALUES (?, ?)",
        [userId, postId],
      );

      res.status(200).json({ message: "Post saved successfully" });
    } catch (error) {
      console.error("Save post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private unsavePost = async (req: AuthRequest, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = req.userId;

      await this.db.query(
        "DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?",
        [userId, postId],
      );

      res.status(200).json({ message: "Post unsaved successfully" });
    } catch (error) {
      console.error("Unsave post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getSavedPosts = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;

      const [rows] = await this.db.query(
        `SELECT 
          posts.id,
          posts.title,
          posts.slug,
          posts.content,
          posts.cover_image,
          posts.created_at,
          users.id as user_id,
          users.username,
          users.profile_image,
          users.profession,
          (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments_count,
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
        [userId],
      );

      // Parse tags
      const posts = (rows as any[]).map((post) => ({
        ...post,
        tags: this.parseTags(post.tags),
      }));

      res.status(200).json({ posts });
    } catch (error) {
      console.error("Get saved posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private checkUserSave = async (req: AuthRequest, res: Response) => {
    try {
      const postId = req.params.id;
      const userId = req.userId;

      const [rows]: any = await this.db.query(
        "SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = ?",
        [userId, postId],
      );

      res.status(200).json({ isSaved: rows.length > 0 });
    } catch (error) {
      console.error("Check user save error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private search = async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query;
      const userId = req.userId;

      if (!q || typeof q !== "string") {
        return res.status(200).json({ posts: [], users: [] });
      }

      const searchTerm = `%${q}%`;

      // Search Posts
      const postQueryParams = userId
        ? [userId, userId, searchTerm, searchTerm, searchTerm]
        : [searchTerm, searchTerm, searchTerm];

      const [posts] = await this.db.query(
        `SELECT 
          posts.id,
          posts.title,
          posts.slug,
          posts.content,
          posts.cover_image,
          posts.created_at,
          users.id as user_id,
          users.username,
          users.profile_image,
          (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) as comments_count,
          (
            SELECT JSON_ARRAYAGG(tags.name)
            FROM post_tags
            JOIN tags ON post_tags.tag_id = tags.id
            WHERE post_tags.post_id = posts.id
          ) as tags
          ${userId ? `, EXISTS(SELECT 1 FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) as is_liked, EXISTS(SELECT 1 FROM saved_posts WHERE saved_posts.post_id = posts.id AND saved_posts.user_id = ?) as is_saved` : ""}
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.title LIKE ? OR posts.content LIKE ? OR posts.id IN (
          SELECT post_id FROM post_tags JOIN tags ON post_tags.tag_id = tags.id WHERE tags.name LIKE ?
        )
        ORDER BY posts.created_at DESC`,
        postQueryParams,
      );

      // Search Users
      const [users] = await this.db.query(
        `SELECT id, username, profile_image, profession, bio 
        FROM users 
        WHERE username LIKE ? OR profession LIKE ? OR bio LIKE ?
        LIMIT 10`,
        [searchTerm, searchTerm, searchTerm],
      );

      res.status(200).json({ posts, users });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getTopDiscussions = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 8;

      const [rows] = await this.db.query(
        `SELECT 
          posts.id,
          posts.title,
          COUNT(comments.id) as comments_count
        FROM posts
        LEFT JOIN comments ON comments.post_id = posts.id
        GROUP BY posts.id, posts.title, posts.created_at
        ORDER BY comments_count DESC, posts.created_at DESC
        LIMIT ${limit}`,
      );

      res.status(200).json({ posts: rows });
    } catch (error) {
      console.error("Get top discussions error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  private getTrendingTags = async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const [rows] = await this.db.query(
        `SELECT 
          tags.name,
          COUNT(post_tags.post_id) as post_count
        FROM tags
        JOIN post_tags ON tags.id = post_tags.tag_id
        GROUP BY tags.id, tags.name
        ORDER BY post_count DESC
        LIMIT ${limit}`,
      );

      res.status(200).json({ tags: rows });
    } catch (error) {
      console.error("Get trending tags error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default PostController;
