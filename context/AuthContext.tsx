"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut, getCurrentUser } from 'aws-amplify/auth';
import { AuthContextType, CognitoUser, UserProfile } from '@/data/types';
import { getUserProfile } from '@/lib/ddb/users';
import outputs from "../amplify_outputs.json"

Amplify.configure(outputs, { ssr: true });

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already signed in on mount
    checkUser();
  }, []);

  async function checkUser(): Promise<void> {
    try {
      const currentUser = await getCurrentUser();

      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.userId);
        console.log("userProfile", userProfile);
        setIsAdmin(userProfile?.IsAdmin || false);
        setIsMember(userProfile?.IsMember || false);
      }
      
      // User object is already in the format we need
      setUser(currentUser as unknown as CognitoUser);
    } catch (error) {
      // No current authenticated user
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(): Promise<void> {
    try {
      // Standard OAuth sign-in for Amplify
      await signInWithRedirect({ provider: 'Google' });
      // The page will redirect, so we don't need to update state here
    } catch (error) {
      console.error('Error signing in:', error);
    }
  }

  async function handleSignOut(): Promise<void> {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user,
      isAdmin,
      isMember,
      loading, 
      signIn: handleSignIn, 
      signOut: handleSignOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}