"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import Footer from "@/components/Footer";
import TopDiscussions from "@/components/TopDiscussions";
import TrendingTags from "@/components/TrendingTags";
import { Bookmark, Loader2 } from "lucide-react";
import { apiCall } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import CategorySidebar from "@/components/CategorySidebar";

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
  profession?: string;
  likes_count?: number;
  comments_count?: number;
}

const SavedPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setLoading(true);
        const response = await apiCall("/api/posts/saved");
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Error fetching saved posts:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        fetchSavedPosts();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-gray-100 font-poppins text-black">
      <Navbar />
      <div className="max-w-[1500px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebars Container */}
          <div className="hidden md:flex gap-4 shrink-0">
            <div className="w-16">
              <CategorySidebar
                selectedCommunityId={null}
                onCommunitySelect={() => {}}
              />
            </div>
            <div className="flex flex-col gap-4 w-60 text-black">
              <Sidebar />
              <Footer />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 text-gray-900 rounded-xl">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Saved Posts
                  </h1>
                  <p className="text-sm text-gray-500">
                    Your private collection of bookmarked articles
                  </p>
                </div>
              </div>
            </div>

            {authLoading || loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-gray-900 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">
                  Fetching your bookmarks...
                </p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <Bookmark className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No saved posts yet
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Posts you bookmark will appear here for easy access later.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    title={post.title}
                    content={post.content}
                    coverImage={post.cover_image}
                    tags={post.tags}
                    createdAt={post.created_at}
                    author={{
                      id: post.user_id,
                      username: post.username,
                      profileImage: post.profile_image,
                      profession: post.profession,
                    }}
                    likes={post.likes_count}
                    comments={post.comments_count}
                    initialIsSaved={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden xl:block w-80 shrink-0">
            <div className="sticky top-20 flex flex-col gap-6">
              <TopDiscussions />
              <TrendingTags />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedPostsPage;
