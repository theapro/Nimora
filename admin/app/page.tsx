"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";

interface Stats {
  users: number;
  posts: number;
  communities: number;
  pendingReports: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500 font-medium">
          Real-time statistics for Nimora platform
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            Total Users
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 tracking-tighter">
              {loading ? "—" : (stats?.users ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-gray-900 w-[60%]" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            Communities
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 tracking-tighter">
              {loading ? "—" : (stats?.communities ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-gray-400 w-[40%]" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">
            Total Posts
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 tracking-tighter">
              {loading ? "—" : (stats?.posts ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-4 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full bg-gray-200 w-[80%]" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <Link href="/users">
          <Button variant="outline">Manage Users</Button>
        </Link>
        <Link href="/communities">
          <Button>Explore Communities</Button>
        </Link>
      </div>
    </div>
  );
}
