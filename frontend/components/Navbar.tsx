"use client";

import React from "react";
import { Search, LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
    setShowProfileModal(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowProfileModal(false);
      }
    };

    if (showProfileModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileModal]);

  return (
    <div className="m-2.5 flex items-center justify-between">
      <div>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-judson)" }}>
          <Link href="/home">Nimora</Link>
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex gap-2.5 items-center">
          <input
            placeholder="Search"
            className="px-2 ring h-8 ring-[#36F5FF] rounded outline-none"
            type="text"
          />
          <button className=" h-8 w-8 rounded flex items-center justify-center bg-[#36F5FF]">
            <Search className="w-4" />
          </button>
        </div>
        <div>
          <button className="bg-[#36F5FF] h-8 rounded px-10">
            Create post
          </button>
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
                    src={`http://localhost:3001${user.profile_image}`}
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
                  <p className="font-semibold text-gray-800">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setShowProfileModal(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileModal(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">Settings</span>
                  </Link>
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
          <div>
            <Link href="/auth/register">
              <button className="bg-[#36F5FF] cursor-pointer h-8 rounded px-10">
                Sign Up
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
