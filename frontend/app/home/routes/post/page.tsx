import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import UserPosts from "@/components/UserPosts";

const UserPostsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="shrink-0 w-60 hidden lg:block">
            <Sidebar />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 px-4 lg:px-0">
              Your Posts
            </h1>
            <UserPosts />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserPostsPage;
