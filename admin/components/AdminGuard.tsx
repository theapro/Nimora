"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const auth = useMemo(() => {
    if (pathname === "/login") return { allowed: true, redirect: false };
    if (typeof window === "undefined")
      return { allowed: false, redirect: false };

    const userStr = window.localStorage.getItem("user");
    const token = window.localStorage.getItem("token");
    if (!userStr || !token) return { allowed: false, redirect: true };

    try {
      const user = JSON.parse(userStr) as { role?: string };
      if (user.role !== "admin") return { allowed: false, redirect: true };
      return { allowed: true, redirect: false };
    } catch {
      return { allowed: false, redirect: true };
    }
  }, [pathname]);

  useEffect(() => {
    if (auth.redirect) router.replace("/login");
  }, [auth.redirect, router]);

  if (!auth.allowed && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
