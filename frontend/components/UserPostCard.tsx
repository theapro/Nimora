"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Edit, Trash2, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiCall } from "@/utils/api";

interface UserPostCardProps {
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
  onDelete?: () => void;
}

const UserPostCard: React.FC<UserPostCardProps> = ({
  id,
  title,
  tags = [],
  createdAt,
  author,
  likes = 0,
  comments = 0,
  onDelete,
}) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await apiCall(`http://localhost:3001/api/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete?.();
      } else {
        console.log("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      console.log("Error deleting post");
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="bg-white border font-poppins border-gray-100 rounded-2xl mb-4 p-5 relative shadow-xs hover:border-gray-300 transition-all group">
      {/* More Options Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
            <Link
              href={`/home/routes/post/edit/${id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Edit Post
              </span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                {isDeleting ? "Deleting..." : "Delete Post"}
              </span>
            </button>
          </div>
        )}
      </div>

      <Link href={`/home/routes/post/${id}`}>
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold overflow-hidden">
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
            <h3 className="text-xs font-bold text-gray-900">
              {author?.username}
            </h3>
            {author?.profession && (
              <p className="text-[10px] text-gray-500 font-medium tracking-tight">
                {author.profession}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:ml-12 gap-6">
          <div>
            {/* Post Title */}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
              {title}
            </h2>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Footer - Stats and Date */}
          <div className="flex items-center justify-between text-gray-400 text-[11px] font-medium pt-2 border-t border-gray-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                <Heart className="w-3.5 h-3.5" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{comments}</span>
              </div>
            </div>
            <time className="text-gray-400">{formatDate(createdAt)}</time>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default UserPostCard;
