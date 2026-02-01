"use client";

import React, { useEffect, useState } from "react";

interface Community {
  id: number;
  title: string;
  description: string;
  image: string;
  post_count: number;
}

interface CategorySidebarProps {
  selectedCommunityId?: number | null;
  onCommunitySelect: (communityId: number | null) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  selectedCommunityId,
  onCommunitySelect,
}) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/communities");
        if (response.ok) {
          const data = await response.json();
          setCommunities(data.communities || []);
        }
      } catch (error) {
        console.error("Error fetching communities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  if (loading) {
    return (
      <div className="bg-white w-19 rounded-2xl border border-gray-200 p-4">
        <p className="text-gray-500 text-sm">...</p>
      </div>
    );
  }

  return (
    <div className="sticky top-20 w-19 z-40 h-[calc(100vh-120px)] bg-white rounded-2xl border border-[#e4e4e4] py-3 px-2 overflow-y-auto no-scrollbar">
      <div className="flex flex-col gap-2">
        {/* All Communities */}
        <button
          onClick={() => onCommunitySelect(null)}
          className={`flex items-center justify-center w-full p-2 rounded-xl transition-all
            ${
              selectedCommunityId === null
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
        </button>

        {/* Communities */}
        {communities.length === 0 ? (
          <p className="text-gray-500 text-sm px-2">No communities</p>
        ) : (
          communities.map((community) => {
            const isActive = selectedCommunityId === community.id;

            return (
              <button
                key={community.id}
                onClick={() => onCommunitySelect(community.id)}
                className={`flex items-center justify-center w-full p-2 rounded-xl transition-all
                  ${isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
              >
                <img
                  src={community.image}
                  alt={community.title}
                  className="w-11 h-11 rounded-xl object-cover border"
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
