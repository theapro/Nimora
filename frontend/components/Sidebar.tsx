import React from "react";
import Link from "next/link";
import { House, Settings, User, Mail } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="bg-cyan1 w-50 h-145 rounded m-2.5 flex flex-col justify-between ">
      <div className="flex flex-col p-1 gap-1 mt-3">
        <Link
          href="/home"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-cyan-300 transition-colors duration-200 group"
        >
          <House
            size={20}
            className="text-gray-600 group-hover:text-gray-900"
          />
          <span className="text-gray-700 font-medium group-hover:text-gray-900">
            Home
          </span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-cyan-300 transition-colors duration-200 group"
        >
          <User size={20} className="text-gray-600 group-hover:text-gray-900" />
          <span className="text-gray-700 font-medium group-hover:text-gray-900">
            Profile
          </span>
        </Link>
        <Link
          href="/post"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-cyan-300 transition-colors duration-200 group"
        >
          <Mail size={20} className="text-gray-600 group-hover:text-gray-900" />
          <span className="text-gray-700 font-medium group-hover:text-gray-900">
            Post
          </span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-cyan-300 transition-colors duration-200 group"
        >
          <Settings
            size={20}
            className="text-gray-600 group-hover:text-gray-900"
          />
          <span className="text-gray-700 font-medium group-hover:text-gray-900">
            Settings
          </span>
        </Link>
      </div>
      <div className="m-3 flex justify-center items-center text-center">
        <h4 className="text-xs text-gray-600">
          Designed by{" "}
          <span className="underline">
            <Link href="https://theapro.uz">Apro</Link>
          </span>
        </h4>
      </div>
    </div>
  );
};

export default Sidebar;
