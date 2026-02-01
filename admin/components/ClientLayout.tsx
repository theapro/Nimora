"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AdminGuard from "@/components/AdminGuard";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <AdminGuard>{children}</AdminGuard>;
  }

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#fdfdfd]">
        <Sidebar />
        <main className="flex-1 ml-60">
          <header className="h-20 flex items-center px-8 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-40">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Admin Panel /{" "}
              {pathname === "/" ? "Dashboard" : pathname.split("/")[1]}
            </div>
          </header>
          <div className="p-8 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
