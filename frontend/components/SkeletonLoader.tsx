import React from "react";

export const PostCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl mb-5 overflow-hidden animate-pulse">
      <div className="p-5">
        {/* Author Info Skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-24 mb-1.5"></div>
            <div className="h-2.5 bg-gray-100 rounded w-32"></div>
          </div>
          <div className="h-7 w-16 bg-gray-100 rounded-lg"></div>
        </div>

        <div className="sm:ml-12">
          {/* Title Skeleton */}
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>

          {/* Tags Skeleton */}
          <div className="flex gap-2 mb-5">
            <div className="h-6 w-16 bg-gray-100 rounded"></div>
            <div className="h-6 w-20 bg-gray-100 rounded"></div>
            <div className="h-6 w-14 bg-gray-100 rounded"></div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-3 w-6 bg-gray-100 rounded"></div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-3 w-6 bg-gray-100 rounded"></div>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileHeaderSkeleton = () => {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden mb-6 shadow-xs animate-pulse">
      <div className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture Skeleton */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-200"></div>

          {/* Info Skeleton */}
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="text-center md:text-left flex-1">
                <div className="h-7 bg-gray-200 rounded w-32 md:w-48 mx-auto md:mx-0 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-40 md:w-56 mx-auto md:mx-0"></div>
              </div>
              <div className="h-9 w-28 bg-gray-100 rounded-xl mx-auto md:mx-0"></div>
            </div>

            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-6"></div>

            {/* Stats Skeleton */}
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4 border-t border-gray-50">
              <div className="text-center md:text-left">
                <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-12"></div>
              </div>
              <div className="text-center md:text-left border-l border-gray-100 pl-6">
                <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-12"></div>
              </div>
              <div className="text-center md:text-left border-l border-gray-100 pl-6">
                <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-12"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SidebarSkeleton = () => {
  return (
    <div className="bg-white border border-[#e4e4e4] w-60 rounded p-6 animate-pulse">
      <div className="space-y-5 mb-20">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <div className="h-3 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CategorySidebarSkeleton = () => {
  return (
    <div className="sticky top-20 z-40 h-[calc(100vh-120px)] bg-white rounded-lg border border-[#e4e4e4] p-2 animate-pulse">
      <div className="flex flex-col gap-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-12 h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};

export const TopDiscussionsSkeleton = () => {
  return (
    <div className="bg-white border border-[#e4e4e4] rounded-lg shadow-sm overflow-hidden animate-pulse">
      <div className="p-4 border-b border-[#e4e4e4] bg-gray-50/50">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TrendingTagsSkeleton = () => {
  return (
    <div className="bg-white border border-[#e4e4e4] rounded-lg shadow-sm overflow-hidden mt-6 animate-pulse">
      <div className="p-4 border-b border-[#e4e4e4] bg-gray-50/50">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-full w-20"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebars Skeleton */}
        <div className="hidden md:flex gap-4 shrink-0">
          <CategorySidebarSkeleton />
          <div className="flex flex-col gap-4 w-60">
            <SidebarSkeleton />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 min-w-0">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>

        {/* Right Sidebar Skeleton */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-20 flex flex-col gap-6">
            <TopDiscussionsSkeleton />
            <TrendingTagsSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};
