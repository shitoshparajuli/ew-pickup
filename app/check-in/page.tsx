'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserId, getUserProfile } from '@/lib/ddb';
import { useAuth } from '@/context/AuthContext';

export default function CheckInPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guests, setGuests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // Use AuthContext to check authentication
        console.log("User: " + user)
        if (user) {
          const userId = user.userId;
          
          if (userId) {
            const userProfile = await getUserProfile(userId);
            
            // Pre-populate form if profile exists
            if (userProfile) {
              setFirstName(userProfile.FirstName || '');
              setLastName(userProfile.LastName || '');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch the profile when auth loading is complete
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the form submission
    // For example, send the data to your API
    console.log({ firstName, lastName, guests });
    
    // Redirect to games/1
    router.push('/games/1');
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Game Check-in</h1>
        
        {authLoading || loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Guests
              </label>
              <div className="flex items-center">
                <button 
                  type="button"
                  onClick={() => setGuests(Math.max(0, guests - 1))}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-l-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 text-center py-1 border-t border-b border-gray-300 dark:border-gray-700 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
                <button 
                  type="button"
                  onClick={() => setGuests(guests + 1)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-r-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-transparent border border-gray-700 text-gray-700 dark:text-gray-300 rounded-sm hover:text-black dark:hover:text-white transition duration-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black border border-black text-white hover:bg-gray-800 rounded-sm transition duration-300 font-bold cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 