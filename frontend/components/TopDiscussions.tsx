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
          "http://localhost:3001/api/posts/top/discussions?limit=8",
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
    <div className="bg-white border border-[#e4e4e4] rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-[#e4e4e4] bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900">Top Discussions</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center italic">
            No discussions yet
          </p>
        ) : (
          <div className="divide-y divide-[#e4e4e4]">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/home/routes/post/${post.id}`}
                className="block py-4 first:pt-0 last:pb-0 group"
              >
                <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium">
                    {post.comments_count}{" "}
                    {post.comments_count === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopDiscussions;
