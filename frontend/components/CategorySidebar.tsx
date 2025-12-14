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
      <div className="w-64 bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-gray-600 text-sm">Loading communities...</p>
      </div>
    );
  }

  return (
    <div className="sticky left-2.5 z-40 top-16 h-[calc(100vh-2.2rem-2.5rem)] bg-white rounded border border-[#e4e4e4] p-2">
      <div className="space-y-2">
        {/* All Communities Link */}
        <div
          onClick={() => onCommunitySelect(null)}
          className={`block rounded transition-all hover:bg-gray-50 cursor-pointer ${
            selectedCommunityId === null
              ? "bg-gray-100 border border-gray-300"
              : ""
          }`}
        >
          <div className="items-center gap-3">
            <div className="w-12 h-12 border border-[#e4e4e4] rounded object-cover bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
          </div>
        </div>

        {communities.length === 0 ? (
          <p className="text-gray-500 text-sm">No communities available</p>
        ) : (
          communities.map((community) => {
            const isActive = selectedCommunityId === community.id;
            return (
              <div
                key={community.id}
                onClick={() => onCommunitySelect(community.id)}
                className={`block rounded transition-all hover:bg-gray-50 cursor-pointer ${
                  isActive ? "bg-gray-100 border border-gray-900" : ""
                }`}
              >
                <div className="items-center gap-3">
                  <img
                    src={`http://localhost:3001/uploads/${community.image}`}
                    alt={community.title}
                    className="w-12 h-12 border border-[#e4e4e4] rounded object-cover"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
