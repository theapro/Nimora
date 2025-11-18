"use client";

import React, { useState } from "react";
import Link from "next/link";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Registration successful");
      } else {
        console.log("Registration failed:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
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
          className="px-10 py-5 flex flex-col gap-2.5 w-80"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col">
            <label htmlFor="username">Username</label>
            <input
              className="ring outline-none px-3 ring-cyan1 rounded h-8"
              type="text"
              id="username"
              name="username"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="email">Email</label>
            <input
              className="ring outline-none px-3 ring-cyan1 rounded h-8"
              type="email"
              id="email"
              name="email"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="password">Password</label>
            <input
              className="ring outline-none px-3 ring-cyan1 rounded h-8"
              type="password"
              id="password"
              name="password"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              className="ring outline-none px-3 ring-cyan1 rounded h-8"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-1 flex-col items-center justify-center">
            <button
              className="px-4 py-1 w-full mt-2 rounded cursor-pointer bg-cyan2"
              type="submit"
            >
              Register
            </button>
            <Link className="text-cyan2 text-xs underline" href="/auth/login">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
