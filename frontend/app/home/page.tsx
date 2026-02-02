"use client";
import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Posts from "@/components/Posts";
import Footer from "@/components/Footer";
import CategorySidebar from "@/components/CategorySidebar";
import TopDiscussions from "@/components/TopDiscussions";
import TrendingTags from "@/components/TrendingTags";
import { PageSkeleton } from "@/components/SkeletonLoader";

const Page = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
    null,
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebars Container */}
          <div className="hidden md:flex gap-4 shrink-0">
            <div className="">
              <CategorySidebar
                selectedCommunityId={selectedCommunityId}
                onCommunitySelect={setSelectedCommunityId}
              />
            </div>
            <div className="flex flex-col gap-4 w-60">
              <Sidebar />
              <Footer />
            </div>
          </div>

          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            <Posts communityId={selectedCommunityId} />
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

export default Page;
