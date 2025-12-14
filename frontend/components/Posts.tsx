"use client";
import React, { useEffect, useState, useRef } from "react";
import PostCard from "./PostCard";
import { useAuth } from "@/context/AuthContext";

interface Post {
  id: number;
  title: string;
  content: string;
  cover_image?: string;
  tags?: string[];
  created_at: string;
  user_id: number;
  username: string;
  profile_image?: string;
  profession?: string;
  likes_count?: number;
  comments_count?: number;
}

type SortType = "latest" | "top-week" | "top-month" | "top-year" | "top-all";

interface PostsProps {
  communityId?: number | null;
}

const Posts: React.FC<PostsProps> = ({ communityId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [active, setActive] = useState<"forYou" | "following">("forYou");
  const [sortType, setSortType] = useState<SortType>("latest");
  const [sortLabel, setSortLabel] = useState("Latest");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const params = new URLSearchParams({
          feed: active,
          sort: sortType,
        });

        if (communityId !== null && communityId !== undefined) {
          params.append("community", communityId.toString());
        }

        const response = await fetch(
          `http://localhost:3001/api/posts?${params.toString()}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await response.json();
        setPosts(data.posts);
      } catch (err) {
        console.error(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [active, sortType, communityId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSortChange = (type: SortType, label: string) => {
    setSortType(type);
    setSortLabel(label);
    setOpen(false);
  };

  const handleFeedChange = (feed: "forYou" | "following") => {
    if (feed === "following" && !user) {
      alert("Please login to see posts from people you follow");
      return;
    }
    setActive(feed);
  };
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2.5 border border-[#e4e4e4] rounded p-1 w-fit">
          <div
            onClick={() => handleFeedChange("forYou")}
            className={`cursor-pointer px-4 py-1 outline-[#e4e4e4]  rounded transition
          ${
            active === "forYou"
              ? "bg-white border border-[#e4e4e4]"
              : "hover:bg-gray-100"
          }`}
          >
            <p>For You</p>
          </div>

          <div
            onClick={() => handleFeedChange("following")}
            className={`cursor-pointer px-4 py-1 rounded transition
          ${
            active === "following"
              ? "bg-white border border-[#e4e4e4]"
              : "hover:bg-gray-200"
          }`}
          >
            <p>Following</p>
          </div>
        </div>
        <div ref={ref} className="relative w-fit">
          {/* Trigger */}
          <button
            onClick={() => setOpen(!open)}
            className="px-3 border border-[#e4e4e4] bg-white cursor-pointer py-2.5 text-sm font-medium rounded
                   hover:bg-gray-100 transition
                   focus:outline-none"
          >
            {sortLabel}
          </button>

          {/* Dropdown */}
          {open && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-[#e4e4e4]
                        rounded shadow-md z-10"
            >
              <div className="px-4 py-2 text-sm font-medium text-gray-900">
                Sort By
              </div>

              <div className="border-t border-[#e4e4e4]" />

              <button
                onClick={() => handleSortChange("latest", "Latest")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortType === "latest" ? "font-semibold bg-gray-50" : ""
                }`}
              >
                Latest
              </button>

              <div className="border-t border-[#e4e4e4]" />

              <button
                onClick={() => handleSortChange("top-week", "Top this week")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortType === "top-week" ? "font-semibold bg-gray-50" : ""
                }`}
              >
                Top this week
              </button>
              <button
                onClick={() => handleSortChange("top-month", "Top this month")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortType === "top-month" ? "font-semibold bg-gray-50" : ""
                }`}
              >
                Top this month
              </button>
              <button
                onClick={() => handleSortChange("top-year", "Top this year")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortType === "top-year" ? "font-semibold bg-gray-50" : ""
                }`}
              >
                Top this year
              </button>
              <button
                onClick={() => handleSortChange("top-all", "Top of all time")}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  sortType === "top-all" ? "font-semibold bg-gray-50" : ""
                }`}
              >
                Top of all time
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-[#e4e4e4] p-8 text-center min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg border w-200 border-[#e4e4e4] p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
          <svg
            className="w-16 h-16 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium">
            {active === "following"
              ? "No posts from people you follow"
              : communityId
              ? "No posts in this community yet"
              : "No posts available"}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {active === "following"
              ? "Try following some users to see their posts here"
              : communityId
              ? "Be the first to create a post in this community"
              : "Check back later for new content"}
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            id={post.id}
            title={post.title}
            content={post.content}
            coverImage={post.cover_image}
            tags={post.tags}
            createdAt={post.created_at}
            author={{
              id: post.user_id,
              username: post.username,
              profileImage: post.profile_image,
              profession: post.profession,
            }}
            likes={post.likes_count || 0}
            comments={post.comments_count || 0}
          />
        ))
      )}
    </div>
  );
};

export default Posts;
