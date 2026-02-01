"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, LayoutGrid, FileText, AlertCircle, Terminal, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", href: "/" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: LayoutGrid, label: "Communities", href: "/communities" },
  { icon: FileText, label: "Posts", href: "/posts" },
  { icon: AlertCircle, label: "Reports", href: "/reports" },
  { icon: Terminal, label: "Audit Logs", href: "/logs" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/login";
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-50">
      <div className="p-6 h-20 flex items-center">
        <Link
          href="/"
          className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2"
        >
          <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center text-white text-[10px] font-black">
            N
          </div>
          NIMORA
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-gray-50 text-gray-900 shadow-sm ring-1 ring-gray-200"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon
                size={16}
                className={cn(isActive ? "text-gray-900" : "text-gray-400")}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg text-sm transition-all duration-200 w-full text-left font-medium group"
        >
          <LogOut size={16} className="group-hover:text-red-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
