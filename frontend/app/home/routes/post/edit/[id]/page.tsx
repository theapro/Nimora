"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Zap,
  Image as ImageIcon,
  MoreHorizontal,
  X,
  Upload,
} from "lucide-react";
import { apiCall } from "@/utils/api";

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
    null
  );
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const titleRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/posts/${postId}`
        );
        if (response.ok) {
          const data = await response.json();
          const post = data.post;
          setTitle(post.title);
          setContent(post.content);
          setTags(post.tags || []);
          if (post.cover_image) {
            setExistingCoverImage(post.cover_image);
            setCoverImagePreview(
              `http://localhost:3001/uploads/${post.cover_image}`
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

    if (postId) {
      fetchPost();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      console.log("Please fill in both title and content");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("tags", JSON.stringify(tags));

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      const response = await apiCall(
        `http://localhost:3001/api/posts/${postId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update post");
      }

      console.log("Post updated successfully!");
      router.push("/home/routes/post");
    } catch (error) {
      console.error("Error updating post:", error);
      console.log(error instanceof Error ? error.message : "Failed to update post");
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
    <>
      <Navbar />
      <div className="flex">
        <div className="m-2.5 ">
          <div>
            <div className="flex justify-between">
              <div>
                <h1 className="text-2xl font-semi">Edit post</h1>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push("/home/routes/post")}
                  className="bg-white border text-sm border-[#e3e3e3] px-8.25 h-8 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="mt-2.5">
              <form onSubmit={handleSubmit}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="bg-white w-4xl border border-[#e3e3e3] h-screen rounded max-h-[calc(100vh-160px)] overflow-auto">
                  <div className="p-8 space-y-7">
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-sm shadow-shadow3 hover-sh border border-[#e3e3e3] px-8.25 h-8 rounded flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {existingCoverImage || coverImage
                          ? "Change cover image"
                          : "Upload cover image"}
                      </button>
                      {coverImagePreview && (
                        <div className="mt-4 relative inline-block">
                          <img
                            src={coverImagePreview}
                            alt="Cover preview"
                            className="max-w-md max-h-64 rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeCoverImage}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <textarea
                        ref={titleRef}
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          autoResizeTextarea(e.target);
                        }}
                        placeholder="Post title here . . ."
                        className="text-5xl placeholder-gray-500 outline-none font-bold rounded resize-none overflow-hidden"
                        rows={1}
                      />
                    </div>
                    <div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInput}
                          placeholder="Add tags (press Enter) . . ."
                          className="text-gray-600 outline-none rounded w-full"
                        />
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-gray-300"
                              >
                                #{tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="my-2.5 flex flex-col">
                    {/* Toolbar */}
                    <div className="bg-[#f7f7f7] px-5 flex h-13 items-center gap-1 w-full">
                      <button
                        type="button"
                        onClick={handleBold}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Bold"
                      >
                        <Bold className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleItalic}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Italic"
                      >
                        <Italic className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleLink}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Link"
                      >
                        <LinkIcon className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleBulletList}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Bullet List"
                      >
                        <List className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNumberedList}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleHeading}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Heading"
                      >
                        <Heading className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleQuote}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Quote"
                      >
                        <Quote className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleInlineCode}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Inline Code"
                      >
                        <Code className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCodeBlock}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Code Block"
                      >
                        <CodeSquare className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Quick Action"
                      >
                        <Zap className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleImage}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Image"
                      >
                        <ImageIcon className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded transition-colors ml-auto"
                        title="More options"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-700" />
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
                      placeholder="Write your content here . . ."
                      className="text-gray-600 mt-2.5 px-8 pt-4 placeholder:text-gray-700 outline-none rounded-b resize-none overflow-hidden"
                      rows={8}
                    ></textarea>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#e4e4e4] text-sm mt-2.5 cursor-pointer hover:bg-gray-300 duration-300 h-8 rounded px-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Updating..." : "Update post"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditPost;
