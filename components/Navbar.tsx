"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NavLinkProps } from "@/data/types";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const isAuthenticated = !!user;

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Soccer Pickup</div>
        
        <div className="flex space-x-6">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>
          
          <NavLink href="/games" active={pathname === "/games"}>
            Games
          </NavLink>
          
          {isAuthenticated && (
            <NavLink href="/profile" active={pathname === "/profile"}>
              Profile
            </NavLink>
          )}
        </div>
        
        <div>
          {loading ? (
            <span className="text-gray-300">Loading...</span>
          ) : isAuthenticated ? (
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link 
      href={href}
      className={`hover:text-gray-300 transition ${
        active ? "text-white font-medium border-b-2 border-blue-400" : "text-gray-300"
      }`}
    >
      {children}
    </Link>
  );
}