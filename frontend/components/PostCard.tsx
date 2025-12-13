"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, UserPlus, UserCheck } from "lucide-react";
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
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  tags = [],
  createdAt,
  author,
  likes: initialLikes = 0,
  comments,
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    // Check if user liked this post
    const checkLikeStatus = async () => {
      if (!user) return;

      try {
        const response = await apiCall(
          `http://localhost:3001/api/posts/${id}/like/check`
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
          `http://localhost:3001/api/user/${author.id}/follow/check`
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
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
          }
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
          }
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
          }
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
          }
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
    <Link href={`/home/routes/post/${id}`}>
      <div className="bg-white w-200 border font-poppins border-gray-200 rounded mb-2.5 p-6 gap-10  cursor-pointer">
        {/* Author Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold overflow-hidden">
              {author?.profileImage ? (
                <Image
                  src={
                    author.profileImage.startsWith("/uploads/")
                      ? `http://localhost:3001${author.profileImage}`
                      : `http://localhost:3001/uploads/${author.profileImage}`
                  }
                  alt={author.username || "User"}
                  width={40}
                  height={40}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                author?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-sm text-gray-900">{author?.username}</h3>
              {author?.profession && (
                <p className="text-sm text-[#615858]">{author.profession}</p>
              )}
            </div>
          </div>

          {/* Follow Button - only show if not own post */}
          {user && user.id !== author.id && (
            <button
              onClick={handleFollow}
              disabled={isFollowLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isFollowing
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex flex-col ml-11 px-2 gap-10">
          <div>
            {/* Post Title */}
            <h2 className="text-3xl w-xl font-semibold text-gray-900 mb-3 leading-tight">
              {title}
            </h2>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm text-[#615858] hover:text-gray-900"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Stats and Date */}
          <div className="flex items-center justify-between text-gray-600 text-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 transition-colors ${
                  isLiked ? "text-red-500" : "hover:text-red-500"
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likes}</span>
              </button>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments}</span>
              </div>
            </div>
            <time className="text-gray-500">{formatDate(createdAt)}</time>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
