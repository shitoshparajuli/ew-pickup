"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image"

export default function HomePage() {
  const { user, loading, signIn } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
      <Image
            src="/images/logo-new.JPG?height=200&width=200"
            alt="Everest Warriors Logo"
            width={200}
            height={200}
            className="mx-auto mb-6"
            priority
          />
        <h1 className="text-4xl font-bold mb-4">Welcome to Everest Warriors</h1>
        <p className="text-xl mb-8">
          Join us for pick-up games and let's have fun!
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Next Game</h2>
          <p className="mb-6 dark:text-gray-200">
            Our next game is scheduled for Tuesday at 9:00 PM.
          </p>
          
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <Link href="/check-in">
                <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                  I'm Playing (Tap to check-in)
                </button>
              </Link>
              <div>
                <Link href="/games/create">
                  <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                    Create New Game
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold flex items-center justify-center mx-auto cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 opacity-80">
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
              Sign in to Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
}