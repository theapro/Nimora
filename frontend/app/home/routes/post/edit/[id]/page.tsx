"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/utils/api";
import Navbar from "@/components/Navbar";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading,
  Quote,
  Code,
  CodeSquare,
  Image as ImageIcon,
  MoreHorizontal,
  X,
  Upload,
  Sparkles,
  Loader2,
} from "lucide-react";
import { apiCall } from "@/utils/api";

type Community = {
  id: number;
  title: string;
  image?: string | null;
};

const EditPost = () => {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(
    null,
  );
  const [communityId, setCommunityId] = useState<number | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const titleRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (response.ok) {
          const data = await response.json();
          const post = data.post;
          setTitle(post.title);
          setContent(post.content);
          setTags(post.tags || []);
          setCommunityId(post.community_id);
          if (post.cover_image) {
            setExistingCoverImage(post.cover_image);
            setCoverImagePreview(
              post.cover_image.startsWith("http")
                ? post.cover_image
                : `/uploads/${post.cover_image}`,
            );
          }
        } else {
          console.log("Failed to load post");
          router.push("/home/routes/post");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        console.log("Error loading post");
        router.push("/home/routes/post");
      } finally {
        setLoading(false);
      }
    };

    const fetchCommunities = async () => {
      try {
        const response = await fetch(`${API_URL}/api/communities`);
        if (response.ok) {
          const data = await response.json();
          setCommunities(data.communities);
        }
      } catch (error) {
        console.error("Error fetching communities:", error);
      }
    };

    if (postId) {
      fetchPost();
      fetchCommunities();
    }
  }, [postId, router]);

  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleBold = () => insertFormatting("**", "**");
  const handleItalic = () => insertFormatting("*", "*");
  const handleLink = () => insertFormatting("[", "](url)");
  const handleBulletList = () => insertFormatting("\n- ");
  const handleNumberedList = () => insertFormatting("\n1. ");
  const handleHeading = () => insertFormatting("\n## ");
  const handleQuote = () => insertFormatting("\n> ");
  const handleInlineCode = () => insertFormatting("`", "`");
  const handleCodeBlock = () => insertFormatting("\n```\n", "\n```\n");
  const handleImage = () => insertFormatting("![alt](", ")");

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setExistingCoverImage(null);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    setExistingCoverImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAiTags = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const response = await apiCall("/api/ai/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.tags) {
          setTags((prev) => [...new Set([...prev, ...data.tags])]);
        }
      }
    } catch (error) {
      console.error("AI Tags Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const response = await apiCall("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const data = await response.json();
        const summaryText = `\n\n### AI Summary\n${data.summary}\n\n**TL;DR:** ${data.tldr}\n\n**Key Points:**\n${data.keyPoints.map((p: string) => `- ${p}`).join("\n")}`;
        setContent((prev) => prev + summaryText);
      }
    } catch (error) {
      console.error("AI Summarize Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiExpand = async () => {
    if (!content.trim()) return;
    setAiLoading(true);
    try {
      const response = await apiCall("/api/ai/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const data = await response.json();
        setContent(data.expandedContent);
      }
    } catch (error) {
      console.error("AI Expand Error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      console.log("Please fill in both title and content");
      return;
    }

    if (!communityId) {
      alert("Please select a community");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("community_id", communityId?.toString() || "");
    formData.append("tags", JSON.stringify(tags));

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      const response = await apiCall(`/api/posts/${postId}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post");
      }

      console.log("Post updated successfully!");
      router.push("/home/routes/post");
    } catch (error) {
      console.error("Error updating post:", error);
      console.log(
        error instanceof Error ? error.message : "Failed to update post",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading post...</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <button
            type="button"
            onClick={() => router.push("/home/routes/post")}
            className="text-gray-600 font-semibold h-11 px-8 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-8 space-y-8">
              {/* Cover Image Upload and AI Tools */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-sm font-medium border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {existingCoverImage || coverImage
                    ? "Change cover image"
                    : "Add a cover image"}
                </button>

                <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                  <button
                    type="button"
                    onClick={handleAiSummarize}
                    disabled={aiLoading || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    )}
                    {aiLoading ? "Summarizing..." : "Summarize"}
                  </button>

                  <button
                    type="button"
                    onClick={handleAiExpand}
                    disabled={aiLoading || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                    )}
                    {aiLoading ? "Expanding..." : "Expand"}
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {coverImagePreview && (
                  <div className="mt-4 relative inline-block">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="max-w-full max-h-[400px] rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-gray-700 p-1.5 rounded-full hover:bg-white transition-colors border border-gray-200 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="flex flex-col">
                <textarea
                  ref={titleRef}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    autoResizeTextarea(e.target);
                  }}
                  placeholder="Post title here . . ."
                  className="text-5xl placeholder-gray-400 outline-none font-bold rounded-lg resize-none overflow-hidden bg-transparent"
                  rows={1}
                />
              </div>

              {/* Community Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                  Select Community
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {communities.map((community) => (
                    <button
                      key={community.id}
                      type="button"
                      onClick={() => setCommunityId(community.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        communityId === community.id
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {community.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                          <img
                            src={
                              community.image.startsWith("http")
                                ? community.image
                                : `/uploads/${community.image}`
                            }
                            alt={community.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span
                        className={`font-medium text-sm ${communityId === community.id ? "text-blue-700" : "text-gray-700"}`}
                      >
                        {community.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInput}
                    placeholder="Add up to 5 tags... (press Enter)"
                    className="text-gray-600 outline-none rounded-lg flex-1 bg-transparent border-b border-transparent focus:border-gray-200 transition-colors py-2"
                  />
                  <button
                    type="button"
                    onClick={handleAiTags}
                    disabled={aiLoading || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    {aiLoading ? "Thinking..." : "AI Tags"}
                  </button>
                </div>
                {tags && tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-gray-200"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editor Section */}
            <div className="flex flex-col border-t border-gray-100">
              {/* Toolbar */}
              <div className="bg-gray-50/50 px-6 flex flex-wrap min-h-[52px] items-center gap-1 w-full border-b border-gray-100">
                <div className="flex gap-1 py-2">
                  {[
                    { icon: Bold, action: handleBold, label: "Bold" },
                    { icon: Italic, action: handleItalic, label: "Italic" },
                    { icon: LinkIcon, action: handleLink, label: "Link" },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={btn.action}
                      className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-gray-500 border border-transparent hover:border-gray-200"
                      title={btn.label}
                    >
                      <btn.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-200 mx-2" />

                <div className="flex gap-1 py-2">
                  {[
                    { icon: List, action: handleBulletList, label: "List" },
                    {
                      icon: ListOrdered,
                      action: handleNumberedList,
                      label: "Numbered List",
                    },
                    { icon: Heading, action: handleHeading, label: "Heading" },
                    { icon: Quote, action: handleQuote, label: "Quote" },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={btn.action}
                      className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-gray-500 border border-transparent hover:border-gray-200"
                      title={btn.label}
                    >
                      <btn.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-200 mx-2" />

                <div className="flex gap-1 py-2">
                  {[
                    { icon: Code, action: handleInlineCode, label: "Code" },
                    {
                      icon: CodeSquare,
                      action: handleCodeBlock,
                      label: "Code Block",
                    },
                    { icon: ImageIcon, action: handleImage, label: "Image" },
                  ].map((btn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={btn.action}
                      className="p-2 hover:bg-white hover:text-blue-600 rounded-lg transition-all text-gray-500 border border-transparent hover:border-gray-200"
                      title={btn.label}
                    >
                      <btn.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="p-2 hover:bg-white text-gray-500 rounded-lg transition-all ml-auto"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                placeholder="Write your story here..."
                className="text-lg text-gray-700 px-8 py-8 placeholder:text-gray-400 outline-none min-h-[400px] bg-transparent resize-none leading-relaxed"
              ></textarea>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white font-semibold h-11 rounded-xl px-12 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? "Updating..." : "Update Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPost;
