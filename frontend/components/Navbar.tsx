import React from "react";
import { Search } from "lucide-react";
import Link from "next/link";

const navbar = () => {
  return (
    <div className="m-2.5 flex items-center justify-between">
      <div>
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-judson)" }}>
          Nimora
        </h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex gap-2.5 items-center">
          <input
            placeholder="Search"
            className="px-2 ring h-8 ring-[#36F5FF] rounded outline-none"
            type="text"
          />
          <button className=" h-8 w-8 rounded flex items-center justify-center bg-[#36F5FF]">
            <Search className="w-4" />
          </button>
        </div>
        <div>
          <button className="bg-[#36F5FF] h-8 rounded px-10">
            Create post
          </button>
        </div>
        <div>
          <Link href="/auth/register">
            <button className="bg-[#36F5FF] cursor-pointer h-8 rounded px-10">Sign Up</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default navbar;
