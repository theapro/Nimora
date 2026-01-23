import { Router, Request, Response } from "express";
import pool from "../../utils/db";

class CommunityController {
  public router = Router();
  private db = pool;

  constructor() {
    this.initializeRoutes();
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
          (SELECT COUNT(*) FROM posts WHERE posts.community_id = communities.id) as post_count
        FROM communities
        ORDER BY title ASC`,
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
          (SELECT COUNT(*) FROM posts WHERE posts.community_id = communities.id) as post_count
        FROM communities
        WHERE id = ?`,
        [id],
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
        [id],
      );

      if ((communityRows as any).length === 0) {
        return res.status(404).json({ error: "Community not found" });
      }

      const communityId = (communityRows as any)[0].id;

      // Get posts for this category
      const [rows] = await this.db.execute(
        `SELECT 
          posts.id,
          posts.title,
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
          ) as tags
        FROM posts
        JOIN users ON posts.user_id = users.id
        JOIN communities ON posts.community_id = communities.id
        WHERE posts.community_id = ?
        ORDER BY posts.created_at DESC`,
        [communityId],
      );

      res.status(200).json({ posts: rows });
    } catch (error) {
      console.error("Get community posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export default CommunityController;
