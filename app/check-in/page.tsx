'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserProfile, updateUserProfile } from '@/lib/ddb/users';
import { createGameParticipant } from '@/lib/ddb/game-participants';
import { useAuth } from '@/context/AuthContext';
import { getGameById } from '@/lib/ddb/games';

// Define skill level options with corresponding rating values
const SKILL_LEVELS = [
  { label: "Beginner", value: 5 },
  { label: "Intermediate", value: 6 },
  { label: "Experienced", value: 7 },
  { label: "Advanced", value: 8 }
];

// Create a client component that uses the hooks
function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  const { user, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [guests, setGuests] = useState(0);
  const [guestsList, setGuestsList] = useState<Array<{
    name: string, 
    rating: number,
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED',
    requestedAt: string,
    approvedAt?: string,
    approvedBy?: string,
    rejectionReason?: string
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        // Use AuthContext to check authentication
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

  // Check if gameId is available
  useEffect(() => {
    if (!gameId && !loading && !authLoading) {
      setError('No game ID provided. Please go back and select a game.');
    } else {
      setError('');
    }
  }, [gameId, loading, authLoading]);

  const handleGuestChange = (index: number, field: 'name' | 'rating', value: string | number) => {
    const updatedGuests = [...guestsList];
    updatedGuests[index] = { 
      ...updatedGuests[index], 
      [field]: value 
    };
    setGuestsList(updatedGuests);
  };

  const updateGuestCount = (newCount: number) => {
    const count = Math.max(0, newCount);
    setGuests(count);
    
    // Adjust the guestsList array based on new count
    if (count > guestsList.length) {
      // Add new empty guest entries with default rating of 6 (Intermediate) and PENDING status
      const newGuests = [...guestsList];
      for (let i = guestsList.length; i < count; i++) {
        newGuests.push({ 
          name: '', 
          rating: 6,
          approvalStatus: 'PENDING' as const,
          requestedAt: new Date().toISOString()
        });
      }
      setGuestsList(newGuests);
    } else if (count < guestsList.length) {
      // Remove excess guest entries
      setGuestsList(guestsList.slice(0, count));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.userId) {
      setError('No user ID available. Please log in.');
      return;
    }
    
    if (!gameId) {
      setError('No game ID provided. Please go back and select a game.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Filter out entries with empty names
      const guestList = guestsList.filter(guest => guest.name.trim());
      
      // Save the participant data
      await createGameParticipant({
        gameId,
        userId: user.userId,
        firstName,
        lastName,
        guestList
      });
      
      // Update the user's PaymentDue field if there are guests
      if (guestList.length > 0) {
        // Get the current user profile
        const userProfile = await getUserProfile(user.userId);
        
        // Calculate the payment due amount
        const currentPaymentDue = userProfile?.PaymentDue || 0;
        // Fetch the game from DDB
        const game = await getGameById(gameId);
        const guestFee = game?.isPaid ? (game?.guestFee ?? 0) : 0;
        const additionalPayment = guestList.length * guestFee;

        const newPaymentDue = currentPaymentDue + additionalPayment;
        
        // Update the user profile with the new PaymentDue amount
        await updateUserProfile(user.userId, {
          PaymentDue: newPaymentDue
        });
      }
      
      // Redirect to the game page
      router.push(`/games/${gameId}?guestApproval=pending`);
    } catch (error) {
      console.error("Error saving participant data:", error);
      setError('Failed to save check-in data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Game Check-in</h1>
        
        {authLoading || loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-black border border-black text-white hover:bg-gray-800 rounded-sm transition duration-300 font-bold cursor-pointer"
            >
              Go Back
            </button>
          </div>
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
                  onClick={() => updateGuestCount(guests - 1)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-l-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  id="guests"
                  value={guests}
                  onChange={(e) => updateGuestCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 text-center py-1 border-t border-b border-gray-300 dark:border-gray-700 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                />
                <button 
                  type="button"
                  onClick={() => updateGuestCount(guests + 1)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-r-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            
            {guests > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Guest Information</h3>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Guest registrations require admin approval before they can participate in games. You'll be notified once your guests are approved.
                  </p>
                </div>
                {guestsList.map((guest, index) => (
                  <div key={index} className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Guest {index + 1}</h4>
                    <div className="mb-2">
                      <label 
                        htmlFor={`guest-${index}-name`} 
                        className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id={`guest-${index}-name`}
                        value={guest.name}
                        onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor={`guest-${index}-skill`} 
                        className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Skill Level
                      </label>
                      <select
                        id={`guest-${index}-skill`}
                        value={guest.rating}
                        onChange={(e) => handleGuestChange(index, 'rating', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        {SKILL_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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
                disabled={submitting}
                className="px-4 py-2 bg-black border border-black text-white hover:bg-gray-800 rounded-sm transition duration-300 font-bold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center py-4">Loading...</div>
      </div>
    </div>}>
      <CheckInContent />
    </Suspense>
  );
} 