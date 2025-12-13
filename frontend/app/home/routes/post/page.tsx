import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import UserPosts from "@/components/UserPosts";

const UserPostsPage = () => {
  return (
    <>
      <Navbar />
      <div className="flex gap-5 p-2.5">
        <Sidebar />
        <div className="">
          <UserPosts />
        </div>
      </div>
    </>
  );
};

export default UserPostsPage;
