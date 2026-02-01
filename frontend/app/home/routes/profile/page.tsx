"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  User as UserIcon,
  Calendar,
  Loader2,
  MapPin,
  Briefcase,
  Globe,
  Link as LinkIcon,
  Heart,
  MessageCircle,
  Layout,
  MessageSquare,
  Sparkles,
  Settings,
  Check,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { apiCall } from "@/utils/api";
import PostCard from "@/components/PostCard";
import UserPostCard from "@/components/UserPostCard";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import CategorySidebar from "@/components/CategorySidebar";
import {
  ProfileHeaderSkeleton,
  PostCardSkeleton,
} from "@/components/SkeletonLoader";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  bio?: string;
  profession?: string;
  location?: string;
  website?: string;
  created_at: string;
}

interface Post {
  id: number;
  title: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  created_at: string;
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

type TabType = "my-posts" | "commented" | "liked" | "saved";

const Profile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [profileData, setProfileData] = React.useState<UserProfile | null>(
    null,
  );
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    bio: "",
    profession: "",
    location: "",
    website: "",
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [validationErrors, setValidationErrors] = React.useState<
    Record<string, string>
  >({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Tab and posts state
  const [activeTab, setActiveTab] = React.useState<TabType>("my-posts");
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = React.useState(false);
  const [postsCount, setPostsCount] = React.useState({
    total: 0,
    commented: 0,
    liked: 0,
    saved: 0,
  });
  const [followersCount, setFollowersCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0);

  // Fetch user profile
  const fetchProfile = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError("");

      const res = await apiCall(`http://localhost:3001/api/user/${user.id}`);
      const data = await res.json();

      if (res.ok) {
        setProfileData(data.user);
        setFormData({
          username: data.user.username || "",
          email: data.user.email || "",
          bio: data.user.bio || "",
          profession: data.user.profession || "",
          location: data.user.location || "",
          website: data.user.website || "",
        });
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Unable to load profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = "Website must be a valid URL (http:// or https://)";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate form before submission
    if (!validateForm()) {
      setError("Please fix the validation errors before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await apiCall(`http://localhost:3001/api/user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileData(data.user);
        setSuccess("Profile updated successfully!");
        setIsEditing(false);

        // Update localStorage without page reload
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.username = data.user.username;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Unable to update profile. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError(""); // Clear any previous errors
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !user?.id) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formDataUpload = new FormData();
      formDataUpload.append("profileImage", selectedFile);

      const res = await apiCall(
        `http://localhost:3001/api/user/${user.id}/upload`,
        {
          method: "POST",
          body: formDataUpload,
        },
      );

      const data = await res.json();

      if (res.ok) {
        setProfileData(data.user);
        setSuccess("Profile image uploaded successfully!");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Unable to upload image. Please try again later.");
    } finally {
      setUploading(false);
    }
  };

  // Fetch posts based on tab type
  const fetchPosts = React.useCallback(
    async (tab: TabType) => {
      if (!user?.id) return;

      try {
        setLoadingPosts(true);
        let endpoint = "";

        switch (tab) {
          case "my-posts":
            endpoint = `http://localhost:3001/api/users/${user.id}/posts`;
            break;
          case "commented":
            endpoint = `http://localhost:3001/api/user/${user.id}/commented`;
            break;
          case "liked":
            endpoint = `http://localhost:3001/api/user/${user.id}/liked`;
            break;
          case "saved":
            endpoint = `http://localhost:3001/api/user/${user.id}/saved`;
            break;
        }

        const res = await apiCall(endpoint);
        const data = await res.json();

        if (res.ok) {
          // Normalize backend data to match PostCard expectations
          const normalizedPosts = (data.posts || []).map((p: any) => ({
            ...p,
            coverImage: p.coverImage || p.cover_image,
            author: p.author
              ? {
                  ...p.author,
                  profileImage: p.author.profileImage || p.author.profile_image,
                }
              : {
                  id: p.user_id,
                  username: p.username,
                  profileImage: p.profile_image,
                  profession: p.profession,
                },
            likes: p.likes ?? p.likes_count,
            comments: p.comments ?? p.comments_count,
          }));
          setPosts(normalizedPosts);
        } else {
          console.error(`Failed to fetch ${tab} posts:`, data.error);
          setPosts([]);
        }
      } catch (err) {
        console.error(`Error fetching ${tab} posts:`, err);
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    },
    [user?.id],
  );

  // Fetch posts count
  const fetchPostsCount = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await apiCall(
        `http://localhost:3001/api/user/${user.id}/posts/count`,
      );
      const data = await res.json();

      if (res.ok) {
        setPostsCount({
          total: data.total || 0,
          commented: data.commented || 0,
          liked: data.liked || 0,
          saved: data.saved || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching posts count:", err);
    }
  }, [user?.id]);

  // Fetch followers and following
  const fetchFollowStats = React.useCallback(async () => {
    if (!user?.id) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        apiCall(`http://localhost:3001/api/user/${user.id}/followers`),
        apiCall(`http://localhost:3001/api/user/${user.id}/following`),
      ]);

      const followersData = await followersRes.json();
      const followingData = await followingRes.json();

      if (followersRes.ok) {
        setFollowersCount(followersData.followers?.length || 0);
      }
      if (followingRes.ok) {
        setFollowingCount(followingData.following?.length || 0);
      }
    } catch (err) {
      console.error("Error fetching follow stats:", err);
    }
  }, [user?.id]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    fetchPosts(tab);
  };

  React.useEffect(() => {
    if (user?.id) {
      fetchPosts(activeTab);
      fetchPostsCount();
      fetchFollowStats();
    }
  }, [user?.id, activeTab, fetchPosts, fetchPostsCount, fetchFollowStats]);

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-gray-100 font-poppins text-black pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Left Sidebars Skeleton */}
            <div className="hidden md:flex flex-col gap-6 shrink-0">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="sticky top-20 z-40 h-[calc(100vh-120px)] w-16 bg-white rounded-lg border border-[#e4e4e4] p-2 animate-pulse">
                    <div className="flex flex-col gap-3">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 bg-gray-200 rounded"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 min-w-0">
                  <div className="bg-white border border-[#e4e4e4] w-60 rounded p-6 animate-pulse">
                    <div className="space-y-5 mb-20">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 min-w-0">
              <ProfileHeaderSkeleton />

              {/* Tabs Skeleton */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs mb-10 animate-pulse">
                <div className="flex border-b border-gray-100 bg-gray-50/30">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-1 py-4 px-6">
                      <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="p-4 min-h-[400px]">
                  {[...Array(2)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
            <UserIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-8 text-center max-w-xs">
            Please sign in to view and manage your profile.
          </p>
          <Link
            href="/auth/login"
            className="px-10 py-3.5 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-sm hover:bg-gray-800 transition-all active:scale-95"
          >
            Sign In Now
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-poppins text-black pb-20">
      <Navbar />

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebars Container */}
          <div className="hidden md:flex flex-col gap-6 shrink-0">
            <div className="flex gap-4">
              <div className="shrink-0">
                <CategorySidebar
                  selectedCommunityId={null}
                  onCommunitySelect={() => {}}
                />
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <Sidebar />
                <Footer />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Minimalist Profile Header */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-6 shadow-xs">
              <div className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Compact Profile Picture */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gray-50 p-1 shadow-sm border border-gray-100 relative">
                      {profileData?.profile_image ? (
                        <Image
                          src={
                            profileData.profile_image.startsWith("http")
                              ? profileData.profile_image
                              : profileData.profile_image.startsWith(
                                    "/uploads/",
                                  )
                                ? `http://localhost:3001${profileData.profile_image}`
                                : `http://localhost:3001/uploads/${profileData.profile_image}`
                          }
                          alt="Profile"
                          fill
                          className="object-cover rounded-xl"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-black">
                          {profileData?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-xl cursor-pointer"
                      >
                        <UserIcon className="w-6 h-6 text-white" />
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Clean Info Layout */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                          {profileData?.username}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-xs font-bold text-gray-400">
                          {profileData?.profession && (
                            <span className="text-blue-600 uppercase tracking-widest">
                              {profileData.profession}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Joined{" "}
                            {profileData?.created_at
                              ? new Date(
                                  profileData.created_at,
                                ).toLocaleDateString(undefined, {
                                  month: "long",
                                  year: "numeric",
                                })
                              : "Recently"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-all text-[11px] uppercase tracking-widest border ${isEditing ? "bg-gray-50 border-gray-200 text-gray-400" : "bg-gray-900 border-gray-900 text-white hover:bg-black"}`}
                      >
                        {isEditing ? "Cancel" : "Edit Profile"}
                      </button>
                    </div>

                    {profileData?.bio && (
                      <p className="text-gray-500 text-sm leading-relaxed font-medium mb-6 text-center md:text-left max-w-2xl">
                        {profileData.bio}
                      </p>
                    )}

                    {/* Minimal Stats Row */}
                    <div className="flex items-center justify-center md:justify-start gap-6 pt-4 border-t border-gray-50">
                      <div className="text-center md:text-left">
                        <p className="text-base font-black text-gray-900">
                          {postsCount.total}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Articles
                        </p>
                      </div>
                      <div className="text-center md:text-left border-l border-gray-100 pl-6">
                        <p className="text-base font-black text-gray-900">
                          {followersCount}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Followers
                        </p>
                      </div>
                      <div className="text-center md:text-left border-l border-gray-100 pl-6">
                        <p className="text-base font-black text-gray-900">
                          {followingCount}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Following
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-600 truncate">
                      {profileData?.email}
                    </span>
                  </div>
                  {profileData?.location && (
                    <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-600 truncate">
                        {profileData.location}
                      </span>
                    </div>
                  )}
                  {profileData?.website && (
                    <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <a
                        href={profileData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline truncate"
                      >
                        {profileData.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Success/Error Alerts inside card */}
              <div className="px-6 pb-4">
                {success && (
                  <div className="bg-green-50 text-green-700 px-6 py-4 rounded-2xl border border-green-100 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    {success}
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 text-red-700 px-6 py-4 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* Minimalist Edit Form */}
            {isEditing && (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-8 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      About Me (Bio)
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-medium text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Profession
                    </label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* Profile Tabs & Content */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs mb-10">
              <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide bg-gray-50/30">
                {[
                  {
                    id: "my-posts",
                    label: "My Posts",
                    count: postsCount.total,
                  },
                  {
                    id: "commented",
                    label: "Commented",
                    count: postsCount.commented,
                  },
                  { id: "liked", label: "Liked", count: postsCount.liked },
                  { id: "saved", label: "Saved", count: postsCount.saved },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabType)}
                    className={`flex-1 min-w-max py-4 px-6 font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === tab.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>{tab.label}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {tab.count}
                      </span>
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-white min-h-[400px]">
                {loadingPosts ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) =>
                      activeTab === "my-posts" ? (
                        <UserPostCard
                          key={post.id}
                          id={post.id}
                          title={post.title}
                          content={post.content}
                          coverImage={post.coverImage}
                          tags={post.tags}
                          createdAt={post.created_at}
                          author={post.author}
                          likes={post.likes}
                          comments={post.comments}
                          onDelete={() => fetchPosts(activeTab)}
                        />
                      ) : (
                        <PostCard
                          key={post.id}
                          id={post.id}
                          title={post.title}
                          content={post.content}
                          coverImage={post.coverImage}
                          tags={post.tags}
                          createdAt={post.created_at}
                          author={post.author}
                          likes={post.likes}
                          comments={post.comments}
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 mb-6">
                      <UserIcon className="w-8 h-8 text-gray-200" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">
                      No activity found
                    </h3>
                    <p className="text-gray-400 max-w-xs text-xs font-medium leading-relaxed">
                      {activeTab === "my-posts" &&
                        "You haven't shared any posts yet."}
                      {activeTab === "commented" &&
                        "You haven't commented on any posts yet."}
                      {activeTab === "liked" &&
                        "You haven't liked any posts yet."}
                      {activeTab === "saved" && "No saved posts found."}
                    </p>
                    {activeTab === "my-posts" && (
                      <Link
                        href="/home/routes/post/create"
                        className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all"
                      >
                        Create New Post
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
