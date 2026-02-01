"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { apiCall } from "@/utils/api";

interface Tag {
  name: string;
  post_count: number;
}

const TrendingTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        setLoading(true);
        const response = await apiCall(
          "/api/posts/trending/tags?limit=8",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch trending tags");
        }

        const data = await response.json();
        setTags(data.tags);
      } catch (err) {
        console.error(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTags();
  }, []);

  if (!loading && tags.length === 0) return null;

  return (
    <div className="bg-white border border-[#e4e4e4] rounded-2xl overflow-hidden mt-6">
      <div className="p-4 border-b border-[#e4e4e4] bg-gray-50/50 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">Trending Tags</h2>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-8 bg-gray-100 animate-pulse rounded-full w-20"
              ></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.name}
                href={`/home?tag=${tag.name}`}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-[#e4e4e4] rounded-full text-sm text-gray-700 transition-colors flex items-center gap-2 group"
              >
                <span className="font-medium group-hover:text-blue-600">
                  #{tag.name}
                </span>
                <span className="text-xs text-gray-400">{tag.post_count}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingTags;
