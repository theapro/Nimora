"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to login. Please try again.");
        return;
      }

      console.log("Login successful:", data);

      // Save user data to context and localStorage
      if (data.token && data.user) {
        login(data.user, data.token);
      }

      window.location.href = "/home";
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center  mt-20">
      <div className="flex flex-col rounded-[7px] border border-cyan2 justify-center items-center">
        <div className="mt-2">
          <h1
            className="text-2xl w-50 text-center"
            style={{ fontFamily: "var(--font-judson)" }}
          >
            Join our <span className="text-3xl text-cyan2">Community</span>
          </h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="px-10 py-5 flex flex-col gap-2.5 w-80"
        >
          <div className="flex flex-col">
            <label htmlFor="email">Email</label>
            <input
              className="ring outline-none px-3 ring-cyan1 rounded h-8"
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="password">Password</label>
            <input
              className="ring outline-none px-3 ring-cyan1 rounded h-8"
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex gap-1 flex-col items-center justify-center">
            <button
              className="px-4 py-1 w-full mt-2 rounded cursor-pointer bg-cyan2"
              type="submit"
            >
              Login
            </button>
            <Link
              className="text-cyan2 text-xs underline"
              href="/auth/register"
            >
              Do not have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
