"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface TopPost {
  id: number;
  title: string;
  comments_count: number;
}

const TopDiscussions = () => {
  const [posts, setPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopDiscussions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:3001/api/posts/top/discussions?limit=10"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch top discussions");
        }

        const data = await response.json();
        setPosts(data.posts);
      } catch (err) {
        console.error(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTopDiscussions();
  }, []);

  return (
    <div className="bg-white w-full h-full border border-[#e4e4e4] rounded p-4">
      <h2 className="text-lg mb-4">Top Discussions</h2>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 text-sm">No discussions yet</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/home/routes/post/${post.id}`}
              className="block hover:bg-gray-50 p-2 -mx-2 rounded transition"
            >
              <h3 className="text-sm font-medium  text-gray-900 mb-1 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-xs border-b pb-2.5 border-[#e4e4e4] text-gray-500">
                {post.comments_count}{" "}
                {post.comments_count === 1 ? "comment" : "comments"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopDiscussions;
