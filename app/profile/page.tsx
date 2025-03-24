"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { useAuth } from "@/context/AuthContext";
import { getUserId, getUserProfile } from "@/lib/ddb";
import { UserProfile } from "@/data/types";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      router.push("/");
      return;
    }

    // Fetch user profile if authenticated
    if (user) {
      fetchUserProfile();
    }
  }, [loading, user, router]);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      const userId = getUserId(user);
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile || {});
    } catch (error) {
      console.error("Error fetching profile:", error);
      // If profile doesn't exist yet, that's okay
      setProfile({});
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Player Profile</h1>
      <ProfileForm initialData={profile || {}} />
    </div>
  );
}