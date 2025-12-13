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
    <div className="bg-white border font-poppins border-gray-200 rounded mb-2.5 p-6 gap-10 relative">
      {/* More Options Menu */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <Link
              href={`/home/routes/post/edit/${id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">Edit Post</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-red-600">
                {isDeleting ? "Deleting..." : "Delete Post"}
              </span>
            </button>
          </div>
        )}
      </div>

      <Link href={`/home/routes/post/${id}`}>
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
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
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{comments}</span>
              </div>
            </div>
            <time className="text-gray-500">{formatDate(createdAt)}</time>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default UserPostCard;
