'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Game } from '@/data/types';
import { getGameById } from '@/lib/games';
import { use } from 'react';

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
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeams, setShowTeams] = useState(false);
  
  useEffect(() => {
    async function loadGame() {
      try {
        setLoading(true);
        const gameData = await getGameById(id);
        setGame(gameData);
        if (!gameData) {
          setError('Game not found');
        }
      } catch (err) {
        console.error('Failed to fetch game:', err);
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    }
    
    loadGame();
  }, [id]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xl">Loading game details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !game) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">Game Not Found</h1>
          <p className="mb-8">We couldn't find the game you're looking for.</p>
          <Link href="/games">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
              Back to Games
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <style jsx>{fadeInAnimation}</style>
      <div className="max-w-4xl mx-auto">
        <Link href="/games" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
          ← Back to Games
        </Link>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2"> EW Tuesaday pick-up</h1>
          <p className="text-xl text-gray-700 mb-6">{game.date} at {game.time}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Details</h2>
              <ul className="space-y-2">
                <li><span className="font-medium">Location:</span> {game.location}</li>
                <li><span className="font-medium">Status:</span> {game.status === 'upcoming' ? 'Upcoming' : 'Completed'}</li>
                <li><span className="font-medium">Players:</span> {game.playersCount}</li>
              </ul>
            </div>
          </div>
          
          {game.status === 'upcoming' && (
            <div className="mb-8">
              <button 
                onClick={() => router.push('/check-in')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
              >
                Join This Game
              </button>
            </div>
          )}
          
          {game.status === 'completed' && game.result && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Game Summary</h2>
              <p>{game.result}</p>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            
            {/* Player List */}
            <div className="overflow-x-auto mb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 28 }).map((_, index) => (
                  <div key={`player-${index}`} className="bg-white border border-gray-200 rounded-md p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                    <span className="font-medium">Player {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Generate Teams Button */}
            <div className="mb-8">
              <button 
                onClick={() => setShowTeams(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
              >
                Generate Teams
              </button>
            </div>
            
            {/* Teams Section */}
            {showTeams && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Teams</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Red Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-red-600">Red Team</h3>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`red-${index}`} className="bg-white rounded-md p-2 shadow-sm text-center">
                            Player {index + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Green Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-green-600">Green Team</h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`green-${index}`} className="bg-white rounded-md p-2 shadow-sm text-center">
                            Player {index + 8}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Blue Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-blue-600">Blue Team</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`blue-${index}`} className="bg-white rounded-md p-2 shadow-sm text-center">
                            Player {index + 15}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Black Team */}
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-gray-800">Black Team</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div key={`black-${index}`} className="bg-white rounded-md p-2 shadow-sm text-center">
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