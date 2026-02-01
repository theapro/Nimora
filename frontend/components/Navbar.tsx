"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  LogOut,
  User,
  Settings,
  FileText,
  Users as UsersIcon,
  Loader2,
  Bookmark,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiCall } from "@/utils/api";

interface SearchPost {
  id: number;
  title: string;
  cover_image?: string;
  username: string;
}

interface SearchUser {
  id: number;
  username: string;
  profile_image?: string;
  profession?: string;
}

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    posts: SearchPost[];
    users: SearchUser[];
  }>({ posts: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleAdminPanel = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open("http://localhost:3002", "_blank");
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
    setShowProfileModal(false);
  };

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const response = await apiCall(
            `http://localhost:3001/api/search?q=${encodeURIComponent(searchQuery)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ posts: [], users: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowProfileModal(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky z-100 top-0 border-b border-[#e4e4e4] bg-white/80 backdrop-blur-md">
      <div className="max-w-[1500px] mx-auto px-4 h-16 flex items-center justify-between">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-judson)" }}>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              Nimora
            </Link>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <input
                placeholder="Search"
                className="px-4 py-2 ring-1 h-9 w-2xl ring-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-blue-400 rounded-full outline-none transition-all text-sm"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() =>
                  searchQuery.trim().length >= 2 && setShowResults(true)
                }
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div className="absolute top-11 left-0 w-full bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in transition-all duration-200">
                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  ) : searchResults.posts.length === 0 &&
                    searchResults.users.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-gray-500 text-medium">
                        No results found for &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* Posts Section */}
                      {searchResults.posts.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            Posts
                          </div>
                          {searchResults.posts.map((post) => (
                            <Link
                              key={post.id}
                              href={`/home/routes/post/${post.id}`}
                              onClick={() => setShowResults(false)}
                              className="block px-4 py-3 hover:bg-blue-50 transition-colors group"
                            >
                              <div className="flex gap-3">
                                {post.cover_image && (
                                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
                                    <Image
                                      src={
                                        post.cover_image.startsWith("http")
                                          ? post.cover_image
                                          : `http://localhost:3001/uploads/${post.cover_image}`
                                      }
                                      alt=""
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1 transition-colors">
                                    {post.title}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    by{" "}
                                    <span className="text-gray-700 font-medium">
                                      @{post.username}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Divider */}
                      {searchResults.posts.length > 0 &&
                        searchResults.users.length > 0 && (
                          <div className="mx-4 my-2 border-t border-gray-50" />
                        )}

                      {/* Users Section */}
                      {searchResults.users.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <UsersIcon className="w-3 h-3" />
                            Users
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {searchResults.users.map((u) => (
                              <Link
                                key={u.id}
                                href={`/profile/${u.id}`}
                                onClick={() => setShowResults(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-white relative">
                                  {u.profile_image ? (
                                    <Image
                                      src={
                                        u.profile_image.startsWith("http")
                                          ? u.profile_image
                                          : `http://localhost:3001/uploads/${u.profile_image}`
                                      }
                                      alt=""
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-blue-600">
                                      {u.username.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                    {u.username}
                                  </h4>
                                  {u.profession && (
                                    <p className="text-[10px] text-gray-400 truncate">
                                      {u.profession}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <Link href="/home/routes/post/create">
              <button className="border border-gray-900 text-gray-900 font-semibold h-9 rounded-xl px-8 hover:border-gray-300 hover:text-gray-300 transition-all active:scale-95">
                Create post
              </button>
            </Link>
          </div>
          {user ? (
            <div className="flex items-center gap-3 relative">
              <button
                onClick={() => setShowProfileModal(!showProfileModal)}
                className="flex  cursor-pointer bg-cyan2 p-0.75 px-1 rounded items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user.profile_image ? (
                  <div className="w-6.5 h-6.5 rounded overflow-hidden relative">
                    <Image
                      src={
                        user.profile_image.startsWith("http")
                          ? user.profile_image
                          : user.profile_image.startsWith("/uploads/")
                            ? `http://localhost:3001${user.profile_image}`
                            : `http://localhost:3001/uploads/${user.profile_image}`
                      }
                      alt="Profile"
                      fill
                      className="object-cover"
                      loading="eager"
                      priority
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-6.5 h-6.5 rounded bg-cyan-500 flex items-center justify-center text-white font-semibold">
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="font-medium uppercase">{user.username}</span>
              </button>

              {showProfileModal && (
                <div
                  ref={modalRef}
                  className="absolute top-11 right-0 bg-white shadow-lg rounded-lg border border-gray-200 w-56 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-800">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/home/routes/profile"
                      onClick={() => setShowProfileModal(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Profile</span>
                    </Link>
                    <Link
                      href="/home/routes/saved-posts"
                      onClick={() => setShowProfileModal(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Saved Posts</span>
                    </Link>
                    <Link
                      href="/home/routes/settings"
                      onClick={() => setShowProfileModal(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">Settings</span>
                    </Link>
                    {user.role === "admin" && (
                      <button
                        onClick={handleAdminPanel}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors w-full text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-600 font-semibold">
                          Admin Panel
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-red-600">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-gray-600 font-semibold text-sm hover:text-gray-900 px-4 py-2"
              >
                Sign In
              </Link>
              <Link href="/auth/register">
                <button className="bg-gray-900 text-white font-semibold h-9 rounded-xl px-8 hover:bg-gray-800 transition-all active:scale-95 shadow-sm text-sm">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
