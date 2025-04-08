"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/ddb/users";
import { UserProfile } from "@/data/types";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (user) {
      fetchUserProfile();
    }
  }, [loading, user, router]);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      if (!user) {
        throw new Error("User ID not found");
      }
      const userId = user.userId;
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile || {});
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile({});
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Loading...</h1>
          <p className="dark:text-gray-200">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold dark:text-white">Player Profile</h1>
          <Link 
            href="/profile/edit"
            className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer"
          >
            Edit Profile
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-gray-600 dark:text-gray-400 text-sm">Name</h2>
            <p className="text-xl dark:text-white">{profile?.FirstName} {profile?.LastName}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Preferred Positions</h2>
            <div className="space-y-1">
              {profile?.PreferredPositions?.map((position, index) => (
                <p key={position} className="text-lg dark:text-gray-200">
                  {index + 1}. {position}
                </p>
              ))}
            </div>
          </div>

          {profile?.PaymentDue !== undefined && profile.PaymentDue > 0 && (
            <div className="mb-6">
              <h2 className="text-gray-600 dark:text-gray-400 text-sm mb-2">Payment Due</h2>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                ${profile.PaymentDue.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}