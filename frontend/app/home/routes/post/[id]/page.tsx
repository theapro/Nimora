"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Languages,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiCall } from "@/utils/api";

const LANGUAGES = [
  "Uzbek",
  "English",
  "Russian",
  "German",
  "French",
  "Spanish",
  "Turkish",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
  "Italian",
  "Portuguese",
  "Hindi",
  "Dutch",
  "Polish",
  "Vietnamese",
  "Thai",
];

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  username: string;
  profile_image?: string;
  parent_id?: number | null;
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
  community_title?: string;
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
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(
    null,
  );
  const [targetLang, setTargetLang] = useState("Uzbek");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");

  const filteredLangs = LANGUAGES.filter((l) =>
    l.toLowerCase().includes(langSearch.toLowerCase()),
  );

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
        `http://localhost:3001/api/posts/${postId}/comments`,
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
        `http://localhost:3001/api/posts/${postId}/likes`,
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
          { method: "DELETE" },
        );
        if (response.ok) {
          const data = await response.json();
          setLikes(data.likes);
          setIsLiked(false);
        }
      } else {
        const response = await apiCall(
          `http://localhost:3001/api/posts/${postId}/like`,
          { method: "POST" },
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

  const handleAiTranslate = async () => {
    if (!post || !user) return;
    setAiLoading(true);
    try {
      const response = await apiCall("http://localhost:3001/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post.content,
          targetLanguage: targetLang,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTranslatedContent(data.translatedContent);
      }
    } catch (error) {
      console.error("AI Translation Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();

    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    const content = parentId ? replyText : commentText;
    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await apiCall(
        `http://localhost:3001/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, parentId }),
        },
      );

      if (response.ok) {
        if (parentId) {
          setReplyTo(null);
          setReplyText("");
        } else {
          setCommentText("");
        }
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

  const renderComments = (parentId: number | null = null, depth = 0) => {
    const MAX_DEPTH = 8;
    const filteredComments = comments.filter((c) => c.parent_id === parentId);

    return filteredComments.map((comment) => (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className="mt-6 first:mt-0"
      >
        <div className="flex gap-3">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold overflow-hidden z-10 border border-white">
              {comment.profile_image ? (
                <Image
                  src={
                    comment.profile_image.startsWith("http")
                      ? comment.profile_image
                      : comment.profile_image.startsWith("/uploads/")
                        ? `http://localhost:3001${comment.profile_image}`
                        : `http://localhost:3001/uploads/${comment.profile_image}`
                  }
                  alt={comment.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs">
                  {comment.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Thread Line */}
            {comments.some((c) => c.parent_id === comment.id) && (
              <div className="flex-1 w-[1px] bg-gray-100 hover:bg-gray-300 transition-colors mx-auto mt-2" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-900 hover:underline cursor-pointer">
                {comment.username}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                • {formatDate(comment.created_at)}
              </span>
            </div>

            <div className="text-sm text-gray-800 leading-relaxed mb-2 break-words">
              {comment.content}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setReplyTo(replyTo === comment.id ? null : comment.id);
                  setReplyText("");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors uppercase tracking-tight"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Reply
              </button>
            </div>

            {/* Reply Input */}
            {replyTo === comment.id && (
              <div className="mt-4 mb-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.username}...`}
                  className="w-full px-4 py-3 border border-blue-100 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-sm bg-blue-50/20"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setReplyTo(null)}
                    className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => handleCommentSubmit(e, comment.id)}
                    disabled={isSubmitting || !replyText.trim()}
                    className="px-5 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isSubmitting ? "Posting..." : "Reply"}
                  </button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {depth < MAX_DEPTH ? (
              <div className="mt-1">
                {renderComments(comment.id, depth + 1)}
              </div>
            ) : (
              comments.some((c) => c.parent_id === comment.id) && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      const element = document.getElementById(
                        `comment-${comment.id}`,
                      );
                      element?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold uppercase tracking-tighter"
                  >
                    Continue this thread →
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 animate-pulse">
            {/* Cover Image Skeleton */}
            <div className="w-full h-96 bg-gray-200 rounded-t-lg"></div>

            <div className="p-8">
              {/* Author Info Skeleton */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-24"></div>
                </div>
              </div>

              {/* Title Skeleton */}
              <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-2/3 mb-6"></div>

              {/* Tags Skeleton */}
              <div className="flex gap-2 mb-6">
                <div className="h-6 w-20 bg-gray-100 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-100 rounded-full"></div>
                <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-3 mb-8">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-4/5"></div>
              </div>

              {/* Actions Skeleton */}
              <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                  <div className="h-4 w-8 bg-gray-100 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                  <div className="h-4 w-8 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          </article>

          {/* Comments Section Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>

            {/* Comment Input Skeleton */}
            <div className="mb-6">
              <div className="h-24 bg-gray-100 rounded-lg mb-3"></div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>

            {/* Comments List Skeleton */}
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-4 border border-gray-100 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
        <article className="bg-white rounded-lg border border-gray-200 mb-6">
          {/* Cover Image */}
          <div>
            {post.cover_image && (
              <div className="mb-6">
                <Image
                  src={
                    post.cover_image.startsWith("http")
                      ? post.cover_image
                      : `http://localhost:3001/uploads/${post.cover_image}`
                  }
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
                      post.profile_image.startsWith("http")
                        ? post.profile_image
                        : post.profile_image.startsWith("/uploads/")
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
                {post.community_title && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    c/{post.community_title}
                  </p>
                )}
              </div>
            </div>

            {/* Post Title */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            {/* AI Action Buttons */}
            {user && (
              <div className="flex flex-wrap items-center gap-3 mb-6 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 relative">
                  <div className="relative">
                    <button
                      onClick={() => setIsLangOpen(!isLangOpen)}
                      className="flex items-center gap-3 px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-900 transition-all hover:bg-gray-50 outline-none min-w-[160px] justify-between shadow-xs"
                    >
                      <span className="truncate">{targetLang}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isLangOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80">
                          <Search className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search language..."
                            className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:text-gray-400"
                            value={langSearch}
                            onChange={(e) => setLangSearch(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
                          {filteredLangs.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => {
                                setTargetLang(lang);
                                setIsLangOpen(false);
                                setLangSearch("");
                              }}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                                targetLang === lang
                                  ? "bg-gray-100 text-gray-900 font-bold"
                                  : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              {lang}
                              {targetLang === lang && (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ))}
                          {filteredLangs.length === 0 && (
                            <div className="py-8 text-center">
                              <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                              <p className="text-xs text-gray-400 font-medium">
                                No results found
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAiTranslate}
                    disabled={aiLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Languages className="w-4 h-4" />
                    )}
                    Translate
                  </button>
                </div>
              </div>
            )}

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
              {translatedContent ? (
                <div className="bg-blue-50/30 rounded-2xl border border-blue-100 overflow-hidden">
                  <div className="flex justify-between items-center px-6 py-3 border-b border-blue-100 bg-blue-50/50">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {targetLang} Translation
                    </span>
                    <button
                      onClick={() => setTranslatedContent(null)}
                      className="p-1.5 bg-white text-gray-500 rounded-lg hover:text-red-500 shadow-sm transition-colors"
                      title="Close translation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {translatedContent}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">
                  {post.content}
                </p>
              )}
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
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Comments ({comments.length})
            </h2>
          </div>

          <div className="p-6">
            {/* Add Comment Form */}
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-10">
                <div className="flex flex-col gap-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none min-h-[120px] bg-gray-50 text-sm"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !commentText.trim()}
                      className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {isSubmitting ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="divide-y divide-gray-50">
              {comments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                renderComments()
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostDetail;
