"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  House,
  Settings,
  User,
  Mail,
  UserRoundPen,
  GlobeLock,
  ReceiptText,
  Twitter,
  Instagram,
  MessagesSquare,
  Code,
  Palette,
  UtensilsCrossed,
  Cpu,
  Briefcase,
  Sparkles,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code size={18} />,
  Palette: <Palette size={18} />,
  UtensilsCrossed: <UtensilsCrossed size={18} />,
  Cpu: <Cpu size={18} />,
  Sparkles: <Sparkles size={18} />,
};

const Sidebar = () => {
  return (
    <div className="flex flex-col justify-between p-6 bg-white border border-[#e4e4e4] w-60  rounded-2xl">
      <div className="flex flex-col  mb-90">
        {/* Navigation Links */}
        <Link
          href="/"
          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
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
          href="/home/routes/profile"
          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
        >
          <User size={20} className="text-gray-600 group-hover:text-gray-900" />
          <span className="text-gray-700 font-medium group-hover:text-gray-900">
            Profile
          </span>
        </Link>
        <Link
          href="/home/routes/settings"
          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
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

      <div className="space-y-4">
        <div className="space-y-2">
          <p className="font-semibold">Policies</p>
          <div className="text-sm space-y-4">
            <div className="flex items-center">
              <UserRoundPen
                size={20}
                className="text-gray-600 inline-block mr-2"
              />
              <Link href="/conduct">Conduct Policy</Link>
            </div>
            <div className="flex items-center">
              <GlobeLock
                size={20}
                className="text-gray-600 inline-block mr-2"
              />
              <Link href="/privacy">Privacy Policy</Link>
            </div>
            <div className="flex items-center">
              <ReceiptText
                size={20}
                className="text-gray-600 inline-block mr-2"
              />
              <Link href="/terms">Terms of Use</Link>
            </div>
          </div>
        </div>
        <div>
          <p className="font-semibold">Socials</p>
          <div className="text-sm space-y-4 mt-2">
            <div>
              <Twitter size={20} className="text-gray-600 inline-block mr-2" />
              <Link href={"/x.com"}>X, Twitter</Link>
            </div>
            <div>
              <Instagram
                size={20}
                className="text-gray-600 inline-block mr-2"
              />
              <Link href={"/instagram.com"}>Instagram</Link>
            </div>
            <div>
              <MessagesSquare
                size={20}
                className="text-gray-600 inline-block mr-2"
              />
              <Link href={"/reddit.com"}>Reddit</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
