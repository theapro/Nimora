"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  Bookmark,
  BookmarkCheck,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiCall } from "@/utils/api";

interface PostCardProps {
  id: number;
  title: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  createdAt: string;
  author: {
    id: number;
    username: string;
    profileImage?: string;
    bio?: string;
    profession?: string;
  };
  likes?: number;
  comments?: number;
  initialIsLiked?: boolean;
  initialIsSaved?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  content,
  coverImage,
  tags = [],
  createdAt,
  author,
  likes: initialLikes = 0,
  comments,
  initialIsLiked = false,
  initialIsSaved = false,
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  useEffect(() => {
    // Check if user liked this post
    const checkLikeStatus = async () => {
      if (!user) return;

      try {
        const response = await apiCall(
          `http://localhost:3001/api/posts/${id}/like/check`,
        );

        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked);
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    // Check if user is following the author
    const checkFollowStatus = async () => {
      if (!user || user.id === author.id) return;

      try {
        const response = await apiCall(
          `http://localhost:3001/api/user/${author.id}/follow/check`,
        );

        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkLikeStatus();
    checkFollowStatus();
  }, [id, user, author.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (isLiking) return;

    setIsLiking(true);

    try {
      if (isLiked) {
        // Unlike
        const response = await apiCall(
          `http://localhost:3001/api/posts/${id}/like`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          const data = await response.json();
          setLikes(data.likes);
          setIsLiked(false);
        }
      } else {
        // Like
        const response = await apiCall(
          `http://localhost:3001/api/posts/${id}/like`,
          {
            method: "POST",
          },
        );

        if (response.ok) {
          const data = await response.json();
          setLikes(data.likes);
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const method = isSaved ? "DELETE" : "POST";
      const response = await apiCall(
        `http://localhost:3001/api/posts/${id}/save`,
        {
          method,
        },
      );

      if (response.ok) {
        setIsSaved(!isSaved);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (isFollowLoading) return;

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const response = await apiCall(
          `http://localhost:3001/api/user/${author.id}/unfollow`,
          {
            method: "DELETE",
          },
        );

        if (response.ok) {
          setIsFollowing(false);
        }
      } else {
        // Follow
        const response = await apiCall(
          `http://localhost:3001/api/user/${author.id}/follow`,
          {
            method: "POST",
          },
        );

        if (response.ok) {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <Link href={`/home/routes/post/${id}`} className="block">
      <div className="bg-white w-full border font-poppins border-gray-100 rounded-2xl mb-5 overflow-hidden hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group">
        {/* Post Cover Image */}
        {coverImage && (
          <div className="w-full h-40 sm:h-56 relative overflow-hidden">
            <Image
              src={
                coverImage.startsWith("http")
                  ? coverImage
                  : `http://localhost:3001/uploads/${coverImage}`
              }
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="p-5">
          {/* Author Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold overflow-hidden">
                {author?.profileImage ? (
                  <Image
                    src={
                      author.profileImage.startsWith("http")
                        ? author.profileImage
                        : author.profileImage.startsWith("/uploads/")
                          ? `http://localhost:3001${author.profileImage}`
                          : `http://localhost:3001/uploads/${author.profileImage}`
                    }
                    alt={author.username || "User"}
                    width={36}
                    height={36}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  author?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {author?.username}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-gray-400">
                    {formatDate(createdAt)}
                  </span>
                  <span className="text-gray-200">•</span>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{calculateReadingTime(content || "")} min read</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow Button - only show if not own post */}
            {user && user.id !== author.id && (
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  isFollowing
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-xs"
                    : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm active:scale-95"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="sm:ml-12">
            {/* Post Title */}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
              {title}
            </h2>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-[11px] font-medium text-gray-400 hover:text-blue-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer - Stats and Actions */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-5">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
                    isLiked
                      ? "text-red-500 bg-red-50"
                      : "text-gray-400 hover:bg-gray-100 hover:text-red-500"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span className="font-bold text-xs">{likes}</span>
                </button>
                <div className="flex items-center gap-1.5 text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-100 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-bold text-xs">{comments}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`p-2 rounded-lg transition-colors ${
                    isSaved
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-300 hover:bg-gray-100 hover:text-blue-600"
                  }`}
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-4.5 h-4.5 fill-current" />
                  ) : (
                    <Bookmark className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
