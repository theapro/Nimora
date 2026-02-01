"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, LayoutGrid, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", href: "/" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: LayoutGrid, label: "Communities", href: "/communities" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-50">
      <div className="p-4 border-b border-gray-200">
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2"
        >
          <div className="w-7 h-7 bg-gray-900 rounded flex items-center justify-center text-white text-xs font-bold">
            N
          </div>
          NIMORA
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded text-sm transition-all",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200 flex flex-col gap-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm transition-all w-full text-left font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
