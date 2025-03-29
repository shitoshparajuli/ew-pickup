"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from 'aws-amplify/auth';
import { getUserId, getUserProfile, saveUserProfile } from "@/lib/ddb/users";
import { UserProfile } from "@/data/types";

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Processing authentication...");

  useEffect(() => {
    // Handle the OAuth callback
    async function handleCallback(): Promise<void> {
      try {
        // In standard Amplify, we check for the current user
        const currentUser = await getCurrentUser();
        console.log("currentUser", currentUser);
        
        if (currentUser) {
          // Get the user ID from Cognito
          const userId = currentUser.userId;
          if (!userId) {
            throw new Error("User ID not found");
          }

          // Check if user profile exists
          const existingProfile = await getUserProfile(userId);
          const timestamp = new Date().toISOString();
          
          // If no profile exists, create one with default values
          if (!existingProfile) {
            const newProfile: Omit<UserProfile, 'UserId'> = {
              FirstName: "",
              LastName: "",
              PreferredPositions: [],
              CreatedAt: timestamp,
              UpdatedAt: ""
            };
            await saveUserProfile(userId, newProfile);
            
            setMessage("Sign-in successful! Redirecting to edit profile...");
            setTimeout(() => router.push("/profile/edit"), 1000);
          } else {
            setMessage("Sign-in successful! Redirecting to home...");
            setTimeout(() => router.push("/"), 1000);
          }
        } else {
          throw new Error("No authenticated user found");
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        setMessage("Authentication failed. Redirecting to home...");
        setTimeout(() => router.push("/"), 2000);
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}