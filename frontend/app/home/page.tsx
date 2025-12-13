import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Posts from "@/components/Posts";
import Footer from "@/components/Footer";
import CategorySidebar from "@/components/CategorySidebar";
import TopDiscussions from "@/components/TopDiscussions";

const page = () => {
  return (
    <>
      <Navbar />
      <div className="flex gap-5 p-2.5">
        <div className="flex gap-2.5">
          <div>
            <CategorySidebar />
          </div>
          <div className="flex flex-col items-center">
            <Sidebar />
            <Footer />
          </div>
        </div>
        <Posts />
        <TopDiscussions />
      </div>
    </>
  );
};

export default page;
