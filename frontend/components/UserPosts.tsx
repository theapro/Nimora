"use client";

import React, { useEffect, useState } from "react";
import UserPostCard from "./UserPostCard";
import { useAuth } from "@/context/AuthContext";
import { PostCardSkeleton } from "./SkeletonLoader";
import { apiCall } from "@/utils/api";

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

const UserPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiCall(`/api/users/${user.id}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDeletePost = () => {
    // Refresh the posts list after deletion
    fetchUserPosts();
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please login to see your posts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You haven&apos;t created any posts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <UserPostCard
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
          likes={post.likes_count || 0}
          comments={post.comments_count || 0}
          onDelete={handleDeletePost}
        />
      ))}
    </div>
  );
};

export default UserPosts;
