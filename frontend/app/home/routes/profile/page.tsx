"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { Mail, User as UserIcon, Calendar, MapPin, Globe } from "lucide-react";
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

type RawAuthor = {
  id?: number;
  user_id?: number;
  username?: string;
  profileImage?: string;
  profile_image?: string;
  profession?: string;
};

type RawPost = {
  coverImage?: string;
  cover_image?: string;
  author?: RawAuthor;
  user_id?: number;
  username?: string;
  profile_image?: string;
  profession?: string;
  likes?: number;
  likes_count?: number;
  comments?: number;
  comments_count?: number;
  [key: string]: unknown;
};

type TabType = "my-posts" | "commented" | "liked" | "saved";

const Profile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [profileData, setProfileData] = React.useState<UserProfile | null>(
    null,
  );
  const [error, setError] = React.useState("");

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

      const res = await apiCall(`/api/user/${user.id}`);
      const data = await res.json();

      if (res.ok) {
        setProfileData(data.user);
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

  // Fetch posts based on tab type
  const fetchPosts = React.useCallback(
    async (tab: TabType) => {
      if (!user?.id) return;

      try {
        setLoadingPosts(true);
        let endpoint = "";

        switch (tab) {
          case "my-posts":
            endpoint = `/api/users/${user.id}/posts`;
            break;
          case "commented":
            endpoint = `/api/user/${user.id}/commented`;
            break;
          case "liked":
            endpoint = `/api/user/${user.id}/liked`;
            break;
          case "saved":
            endpoint = `/api/user/${user.id}/saved`;
            break;
        }

        const res = await apiCall(endpoint);
        const data = await res.json();

        if (res.ok) {
          const normalizedPosts = (data.posts || []).map((p: RawPost) => ({
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
          setPosts([]);
        }
      } catch {
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    },
    [user?.id],
  );

  const fetchPostsCount = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await apiCall(`/api/user/${user.id}/posts/count`);
      const data = await res.json();
      if (res.ok) {
        setPostsCount({
          total: data.total || 0,
          commented: data.commented || 0,
          liked: data.liked || 0,
          saved: data.saved || 0,
        });
      }
    } catch {}
  }, [user?.id]);

  const fetchFollowStats = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const [followersRes, followingRes] = await Promise.all([
        apiCall(`/api/user/${user.id}/followers`),
        apiCall(`/api/user/${user.id}/following`),
      ]);
      const f1 = await followersRes.json();
      const f2 = await followingRes.json();
      if (followersRes.ok) setFollowersCount(f1.followers?.length || 0);
      if (followingRes.ok) setFollowingCount(f2.following?.length || 0);
    } catch {}
  }, [user?.id]);

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
            <div className="hidden md:flex flex-col gap-6 shrink-0">
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="sticky top-20 h-[calc(100vh-120px)] w-16 bg-white rounded-lg border border-[#e4e4e4] animate-pulse"></div>
                </div>
                <div className="flex flex-col gap-4 w-60">
                  <div className="bg-white border w-full h-64 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <ProfileHeaderSkeleton />
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <Link
            href="/auth/login"
            className="px-10 py-3.5 bg-gray-900 text-white rounded-xl font-bold"
          >
            Sign In Now
          </Link>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 font-poppins text-black pb-20">
        <Navbar />
        <div className="max-w-[1600px] mx-auto px-4 py-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900">Profile Error</h2>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
            <button
              type="button"
              onClick={() => fetchProfile()}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-poppins text-black pb-20">
      <Navbar />

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebars */}
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
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-6 shadow-xs">
              <div className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Profile Picture */}
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gray-50 p-1 shadow-sm border border-gray-100 relative">
                    {profileData?.profile_image ? (
                      <Image
                        src={
                          profileData.profile_image.startsWith("http")
                            ? profileData.profile_image
                            : `/uploads/${profileData.profile_image}`
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
                  </div>

                  {/* Info */}
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

                      <Link
                        href="/home/routes/settings?tab=profil"
                        className="px-5 py-2.5 rounded-xl font-bold transition-all text-[11px] uppercase tracking-widest border bg-gray-900 border-gray-900 text-white hover:bg-black"
                      >
                        Edit Profile
                      </Link>
                    </div>

                    {profileData?.bio && (
                      <p className="text-gray-500 text-sm leading-relaxed font-medium mb-6 text-center md:text-left max-w-2xl">
                        {profileData.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-center md:justify-start gap-6 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-base font-black text-gray-900">
                          {postsCount.total}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Articles
                        </p>
                      </div>
                      <div className="border-l border-gray-100 pl-6">
                        <p className="text-base font-black text-gray-900">
                          {followersCount}
                        </p>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Followers
                        </p>
                      </div>
                      <div className="border-l border-gray-100 pl-6">
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
            </div>

            {/* Profile Tabs */}
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
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      fetchPosts(tab.id as TabType);
                    }}
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
                  <div className="flex flex-col items-center justify-center py-24 px-10 text-center text-gray-400">
                    <UserIcon className="w-12 h-12 mb-4" />
                    <h3 className="font-bold text-gray-900">
                      No activity found
                    </h3>
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
