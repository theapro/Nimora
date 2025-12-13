"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiCall } from "@/utils/api";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  profile_image?: string;
}

interface Like {
  id: number;
  user_id: number;
  username: string;
  profile_image?: string;
  created_at: string;
}

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
}

const PostDetail = () => {
  const params = useParams();
  const { user } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
      fetchLikes();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/posts/${postId}/comments`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchLikes = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/posts/${postId}/likes`
      );
      if (response.ok) {
        const data: { likes: Like[] } = await response.json();
        setLikes(data.likes.length);

        // Check if current user liked the post
        if (user && data.likes.some((like) => like.user_id === user.id)) {
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    try {
      if (isLiked) {
        const response = await apiCall(
          `http://localhost:3001/api/posts/${postId}/like`,
          { method: "DELETE" }
        );
        if (response.ok) {
          const data = await response.json();
          setLikes(data.likes);
          setIsLiked(false);
        }
      } else {
        const response = await apiCall(
          `http://localhost:3001/api/posts/${postId}/like`,
          { method: "POST" }
        );
        if (response.ok) {
          const data = await response.json();
          setLikes(data.likes);
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (!commentText.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await apiCall(
        `http://localhost:3001/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: commentText }),
        }
      );

      if (response.ok) {
        setCommentText("");
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Post not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Post Content */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Cover Image */}
          <div>
            {post.cover_image && (
              <div className="mb-6">
                <Image
                  src={`http://localhost:3001/uploads/${post.cover_image}`}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full rounded-tr-lg rounded-tl-lg object-cover"
                />
              </div>
            )}
          </div>
          <div className="p-8">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold overflow-hidden">
                {post.profile_image ? (
                  <Image
                    src={
                      post.profile_image.startsWith("/uploads/")
                        ? `http://localhost:3001${post.profile_image}`
                        : `http://localhost:3001/uploads/${post.profile_image}`
                    }
                    alt={post.username}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  post.username.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {post.username}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>

            {/* Post Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post Content */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-800 whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Like and Comment Stats */}
            <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked ? "text-red-500" : "text-gray-600 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-semibold">{likes}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">{comments.length}</span>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comments ({comments.length})
          </h2>

          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
                  {user.profile_image ? (
                    <Image
                      src={
                        user.profile_image.startsWith("/uploads/")
                          ? `http://localhost:3001${user.profile_image}`
                          : `http://localhost:3001/uploads/${user.profile_image}`
                      }
                      alt={user.username}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !commentText.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? "Sending..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
                    {comment.profile_image ? (
                      <Image
                        src={
                          comment.profile_image.startsWith("/uploads/")
                            ? `http://localhost:3001${comment.profile_image}`
                            : `http://localhost:3001/uploads/${comment.profile_image}`
                        }
                        alt={comment.username}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      comment.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetail;
