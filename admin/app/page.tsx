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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">System overview</p>
      </div>

      <div className="grid gap-3 grid-cols-3">
        <div className="border border-gray-200 rounded p-4">
          <div className="text-xs text-gray-500 font-medium">Users</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {loading ? "—" : (stats?.users ?? 0)}
          </div>
        </div>

        <div className="border border-gray-200 rounded p-4">
          <div className="text-xs text-gray-500 font-medium">Communities</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {loading ? "—" : (stats?.communities ?? 0)}
          </div>
        </div>

        <div className="border border-gray-200 rounded p-4">
          <div className="text-xs text-gray-500 font-medium">Posts</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {loading ? "—" : (stats?.posts ?? 0)}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Link href="/users">
          <Button variant="outline" size="sm">
            Users
          </Button>
        </Link>
        <Link href="/communities">
          <Button size="sm">Communities</Button>
        </Link>
      </div>
    </div>
  );
}
