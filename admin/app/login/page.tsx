"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { AxiosError } from "axios";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/login", { email, password });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.user));

      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(
        axiosErr.response?.data?.error || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xl font-black mx-auto mb-4 shadow-lg shadow-gray-200">
            N
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Please enter your admin credentials
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleLogin}
          className="space-y-5 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-gray-700 ml-1">
              Email Address
            </label>
            <input
              required
              type="email"
              placeholder="admin@nimora.uz"
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-gray-700 ml-1">
              Password
            </label>
            <input
              required
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-200 disabled:cursor-not-allowed disabled:opacity-70 mt-4"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400 font-medium">
          &copy; 2026 Nimora Admin Panel. All rights reserved.
        </p>
      </div>
    </div>
  );
}
