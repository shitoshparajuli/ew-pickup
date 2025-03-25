"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile } from "@/lib/ddb";
import { UserProfile } from "@/data/types";
import Link from "next/link";

export default function EditProfilePage() {
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
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>Please wait while we load your profile.</p>
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
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Link 
            href="/profile"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Profile
          </Link>
        </div>
        <ProfileForm initialData={profile || {}} />
      </div>
    </div>
  );
} 