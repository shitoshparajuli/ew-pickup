"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NavLinkProps } from "@/data/types";
import { useState } from "react";
import { Menu, X, Home, Volleyball, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const isAuthenticated = !!user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="bg-black text-white py-3 px-4 border-b border-gray-800">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-semibold hover:text-gray-300 transition-colors duration-200">Everest Warriors</Link>
        
        {/* Mobile menu button */}
        <button 
          className="sm:hidden focus:outline-none text-gray-300 hover:text-white" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        {/* Desktop navigation */}
        <div className="hidden sm:flex sm:space-x-8 items-center">
          <NavLink href="/" active={pathname === "/"} aria-label="Home">
            <div className="flex items-center">
              <Home size={18} className="mr-2" />
              <span className="text-sm">Home</span>
            </div>
          </NavLink>
          
          <NavLink href="/games" active={pathname === "/games"} aria-label="Games">
            <div className="flex items-center">
              <Volleyball size={18} className="mr-2" />
              <span className="text-sm">Games</span>
            </div>
          </NavLink>
          
          {isAuthenticated && (
            <NavLink href="/profile" active={pathname === "/profile"} aria-label="Profile">
              <div className="flex items-center">
                <User size={18} className="mr-2" />
                <span className="text-sm">Profile</span>
              </div>
            </NavLink>
          )}
          
          {/* Desktop auth buttons */}
          <div className="ml-4">
            {loading ? (
              <span className="text-gray-400">...</span>
            ) : isAuthenticated ? (
              <button
                onClick={() => signOut()}
                className="bg-transparent border border-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded-sm transition duration-200 text-sm"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-transparent border border-gray-700 text-white hover:border-gray-500 px-3 py-1 rounded-sm transition duration-200 text-sm flex items-center"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 opacity-80">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden mt-4 pt-4 border-t border-gray-800">
          <div className="flex flex-col space-y-4">
            <NavLink href="/" active={pathname === "/"} onClick={toggleMenu}>
              <div className="flex items-center">
                <Home size={20} className="mr-3" />
                <span>Home</span>
              </div>
            </NavLink>
            
            <NavLink href="/games" active={pathname === "/games"} onClick={toggleMenu}>
              <div className="flex items-center">
                <Volleyball size={20} className="mr-3" />
                <span>Games</span>
              </div>
            </NavLink>
            
            {isAuthenticated && (
              <NavLink href="/profile" active={pathname === "/profile"} onClick={toggleMenu}>
                <div className="flex items-center">
                  <User size={20} className="mr-3" />
                  <span>Profile</span>
                </div>
              </NavLink>
            )}

            <div className="pt-4 mt-2 border-t border-gray-800">
              {loading ? (
                <span className="text-gray-400">Loading...</span>
              ) : isAuthenticated ? (
                <button
                  onClick={() => {
                    signOut();
                    toggleMenu();
                  }}
                  className="bg-transparent border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-sm transition duration-200 w-full text-left"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    signIn();
                    toggleMenu();
                  }}
                  className="bg-transparent border border-gray-700 text-white hover:border-gray-500 px-4 py-2 rounded-sm transition duration-200 w-full flex items-center"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2 opacity-80">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, children, className = "", ...props }: NavLinkProps & React.HTMLAttributes<HTMLAnchorElement> & { className?: string }) {
  return (
    <Link 
      href={href}
      className={`hover:text-white transition-colors duration-200 ${
        active ? "text-white" : "text-gray-400"
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}