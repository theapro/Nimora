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
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
