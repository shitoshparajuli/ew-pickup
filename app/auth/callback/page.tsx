"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from 'aws-amplify/auth';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Processing authentication...");

  useEffect(() => {
    // Handle the OAuth callback
    async function handleCallback(): Promise<void> {
      try {
        // In standard Amplify, we check for the current user
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          setMessage("Sign-in successful! Redirecting...");
          setTimeout(() => router.push("/profile"), 1000);
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