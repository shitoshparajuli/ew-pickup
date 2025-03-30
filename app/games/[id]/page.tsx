'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Game } from '@/data/types';
import { use } from 'react';
import { getGameById } from '@/lib/ddb/games';
import { getGameParticipants, isUserParticipatingInGame, deleteGameParticipant } from '@/lib/ddb/game-participants';
import { useAuth } from '@/context/AuthContext';

// Animation keyframes
const fadeInAnimation = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
`;

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeams, setShowTeams] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    async function loadGame() {
      try {
        setLoading(true);
        // Fetch game data
        const gameData = await getGameById(id);
        console.log('gameData', gameData);
        
        if (!gameData) {
          setError('Game not found');
          setLoading(false);
          return;
        }
        
        setGame(gameData);
        
        // Fetch participants
        try {
          const participantsData = await getGameParticipants(id);
          setParticipants(participantsData);
          
          // Check if current user is participating
          if (user) {
            const participating = await isUserParticipatingInGame(id, user.userId);
            setIsParticipating(!!participating);
          }
        } catch (participantErr) {
          console.error('Failed to fetch participants:', participantErr);
          // Don't fail the whole page if just participants fail to load
        }
      } catch (err) {
        console.error('Failed to fetch game:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    }
    
    loadGame();
  }, [id, user]);
  
  const handleParticipationAction = async () => {
    if (!user) {
      // If not logged in, just redirect to check-in
      router.push(`/check-in?gameId=${id}`);
      return;
    }
    
    if (isParticipating) {
      // Handle bail out action
      try {
        setIsLoading(true);
        await deleteGameParticipant(id, user.userId);
        // Update local state
        setIsParticipating(false);

        const updatedParticipants = await getGameParticipants(id);
        setParticipants(updatedParticipants);
        
        // Reload the page to refresh the participants list
        router.refresh();
      } catch (error) {
        console.error("Failed to bail out:", error);
        alert("Failed to remove you from the game. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle join action - redirect to check-in
      router.push(`/check-in?gameId=${id}`);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl dark:text-gray-200">Loading game details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !game) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6 dark:text-white">Game Not Found</h1>
          <p className="mb-8 dark:text-gray-200">We couldn't find the game you're looking for.</p>
          <Link href="/games">
            <button className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer">
              Back to Games
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Safe access of game properties to avoid errors
  const formattedDate = game?.date || '';
  const formattedTime = game?.time || '';
  const location = game?.location || '';
  const status = game?.status || 'UNKNOWN';

  return (
    <div className="container mx-auto py-12 px-4">
      <style jsx>{fadeInAnimation}</style>
      <div className="max-w-4xl mx-auto">
        <Link href="/games" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-6 inline-block">
          ← Back to Games
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">EW pick-up game</h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
            {game?.date ? new Date(game.date + "T00:00:00-08:00").toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''} at {(() => {
              // Convert from 24-hour to 12-hour time format with AM/PM
              if (!game?.time) return '';
              const [hours, minutes] = game.time.split(':');
              const hour = parseInt(hours, 10);
              const amPm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
              return `${hour12}:${minutes} ${amPm}`;
            })()}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-2 dark:text-white">Details</h2>
              <ul className="space-y-2 dark:text-gray-200">
                <li><span className="font-medium">Location:</span> {location}</li>
                <li><span className="font-medium">Status:</span> {status === 'UPCOMING' ? 'Upcoming' : 'Completed'}</li>
                <li><span className="font-medium">Players:</span> {participants.length}</li>
              </ul>
            </div>
          </div>
          
          {status === 'UPCOMING' && (
            <div className="mb-8">
              <button 
                onClick={handleParticipationAction}
                className={`${isParticipating ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'} border border-black text-white px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading 
                  ? (isParticipating ? 'Bailing out...' : 'Joining...') 
                  : (isParticipating ? 'Cowardly bail out' : 'Join This Game')}
              </button>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Players ({participants.length})</h2>
            
            {/* Player List */}
            <div className="overflow-x-auto mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div key={`player-${participant.UserId}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 text-center shadow-sm hover:shadow-md transition-shadow dark:text-gray-200">
                      <span className="font-medium">{participant.FirstName} {participant.LastName}</span>
                      {participant.GuestList && participant.GuestList.length > 0 && (
                        <span className="block text-sm text-gray-500 dark:text-gray-400">+{participant.GuestList.split(',').length} guests</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-4 dark:text-gray-300">
                    No players registered yet
                  </div>
                )}
              </div>
            </div>
            
            {/* Generate Teams Button - only show if there are players */}
            {participants.length > 0 && (
              <div className="mb-8">
                <button 
                  onClick={() => setShowTeams(true)}
                  className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer"
                >
                  Generate Teams
                </button>
              </div>
            )}
            
            {/* Teams Section - still using hardcoded teams as mentioned in instructions */}
            {showTeams && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Teams</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Red Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-red-600 dark:text-red-400">Red Team</h3>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`red-${index}`} className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm text-center dark:text-gray-200">
                            Player {index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Green Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-green-600 dark:text-green-400">Green Team</h3>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`green-${index}`} className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm text-center dark:text-gray-200">
                            Player {index + 8}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Blue Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-blue-600 dark:text-blue-400">Blue Team</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`blue-${index}`} className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm text-center dark:text-gray-200">
                            Player {index + 15}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Black Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-300">Black Team</h3>
                    <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`black-${index}`} className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm text-center dark:text-gray-200">
                            Player {index + 22}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 