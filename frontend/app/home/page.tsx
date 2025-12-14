"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Posts from "@/components/Posts";
import Footer from "@/components/Footer";
import CategorySidebar from "@/components/CategorySidebar";
import TopDiscussions from "@/components/TopDiscussions";

const page = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    null
  );
  return (
    <>
      <Navbar />
      <div className="flex gap-5 p-2.5">
        <div className="flex gap-2.5">
          <div>
            <CategorySidebar
              selectedCommunityId={selectedCommunityId}
              onCommunitySelect={setSelectedCommunityId}
            />
          </div>
          <div className="flex flex-col items-center">
            <Sidebar />
            <Footer />
          </div>
        </div>
        <Posts communityId={selectedCommunityId} />
        <TopDiscussions />
      </div>
    </>
  );
};

export default page;
