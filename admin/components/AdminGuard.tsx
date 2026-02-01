"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<{
    allowed: boolean;
    redirect: boolean;
  } | null>(null);

  useEffect(() => {
    if (pathname === "/login") {
      setAuth({ allowed: true, redirect: false });
      return;
    }
    if (typeof window === "undefined") {
      setAuth({ allowed: false, redirect: false });
      return;
    }
    const userStr = window.localStorage.getItem("user");
    const token = window.localStorage.getItem("token");
    if (!userStr || !token) {
      setAuth({ allowed: false, redirect: true });
      return;
    }
    try {
      const user = JSON.parse(userStr) as { role?: string };
      if (user.role !== "admin") {
        setAuth({ allowed: false, redirect: true });
        return;
      }
      setAuth({ allowed: true, redirect: false });
    } catch {
      setAuth({ allowed: false, redirect: true });
    }
  }, [pathname]);

  useEffect(() => {
    if (auth?.redirect) router.replace("/login");
  }, [auth?.redirect, router]);

  if (!auth || (!auth.allowed && pathname !== "/login")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
