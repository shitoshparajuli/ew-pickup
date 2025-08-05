"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image"
import { useEffect, useState } from "react";
import { getNextGame } from "@/lib/ddb/games";
import { isUserParticipatingInGame } from "@/lib/ddb/game-participants";
import { getPendingGuestApprovals } from "@/lib/ddb/game-participants";

export default function HomePage() {
  const { user, loading, signIn, isAdmin, isMember } = useAuth();
  const isAuthenticated = !!user;
  const [nextGame, setNextGame] = useState<Record<string, any> | null>(null);
  const [loadingGame, setLoadingGame] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [checkingParticipation, setCheckingParticipation] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    async function fetchNextGame() {
      if (isAuthenticated) {
        try {
          setLoadingGame(true);
          const game = await getNextGame();
          setNextGame(game);
          console.log("user:", user);
          console.log("isAdmin:", isAdmin);
          console.log("isMember:", isMember);
          
          if (game && user) {
            setCheckingParticipation(true);
            try {
              const participating = await isUserParticipatingInGame(game.GameId, user.userId);
              setIsParticipating(!!participating);
            } catch (error) {
              console.error("Failed to check participation status:", error);
            } finally {
              setCheckingParticipation(false);
            }
          }
        } catch (error) {
          console.error("Failed to fetch next game:", error);
        } finally {
          setLoadingGame(false);
        }
      }
    }

    async function fetchPendingApprovals() {
      if (isAdmin) {
        try {
          const pendingGuests = await getPendingGuestApprovals({ checkGameStatus: true, includeAllGames: false });
          setPendingApprovals(pendingGuests.length);
        } catch (error) {
          console.error("Failed to fetch pending approvals:", error);
        }
      }
    }

    fetchNextGame();
    fetchPendingApprovals();
  }, [isAuthenticated, user, isAdmin]);

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
      <Image
            src="/images/logo-ew.png?height=200&width=200"
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

        {/* Admin Dashboard */}
        {isAdmin && pendingApprovals > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">Admin Dashboard</h2>
            <p className="text-yellow-700 mb-4">
              You have {pendingApprovals} guest approval{pendingApprovals !== 1 ? 's' : ''} pending review for upcoming games.
            </p>
            <Link href="/admin/guest-approvals">
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium">
                Review Approvals
              </button>
            </Link>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Next Game</h2>
          
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : !isAuthenticated ? (
            <>
              <p className="mb-6 dark:text-gray-200">
                Sign in to view game details
              </p>
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
                Sign in with Google
              </button>
            </>
          ) : loadingGame ? (
            <span className="text-gray-400">Loading game details...</span>
          ) : nextGame ? (
            <>
              <p className="mb-6 dark:text-gray-200">
                Our next game is scheduled for {new Date(nextGame.Date + "T00:00:00-08:00").toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {(() => {
                  // Convert from 24-hour to 12-hour time format with AM/PM
                  const [hours, minutes] = nextGame.StartTime.split(':');
                  const hour = parseInt(hours, 10);
                  const amPm = hour >= 12 ? 'PM' : 'AM';
                  const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
                  return `${hour12}:${minutes} ${amPm}`;
                })()}.
              </p>
              <div className="space-y-4">
                {checkingParticipation ? (
                  <span className="text-gray-400">Checking participation status...</span>
                ) : isParticipating ? (
                  <div className="space-y-4">
                    <p className="text-green-600 font-medium">You're checked in for this game!</p>
                    <Link href={`/games/${nextGame.GameId}`}>
                      <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                        View Game Details
                      </button>
                    </Link>
                  </div>
                ) : (
                  <Link href={`/check-in?gameId=${nextGame.GameId}`}>
                    <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                      Join Game (Tap to check-in)
                    </button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="mb-6 dark:text-gray-200">
                {isAdmin ? 
                  "No upcoming games scheduled." : 
                  <>Only admins/volunteers can create new games. <a href="https://github.com/shitoshparajuli/ew-pickup/issues/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Apply to become one!</a></>
                }
              </p>
              {isAdmin && (
                <Link href="/games/create">
                  <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
                    Create New Game
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}