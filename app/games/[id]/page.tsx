'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Game } from '@/data/types';
import { use } from 'react';
import { getGameById } from '@/lib/ddb/games';
import { getGameParticipants, isUserParticipatingInGame, deleteGameParticipant } from '@/lib/ddb/game-participants';
import { useAuth } from '@/context/AuthContext';
import { divideTeams } from '@/lib/division-algorithm';
import { Position, Player, Team } from '@/data/types';
import { getBatchPlayers } from '@/lib/ddb/users';
import { storeGameTeams, getGameTeams, gameTeamsToArray, SimplifiedPlayer, SimplifiedTeam } from '@/lib/ddb/game-teams';

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
  const { user, isAdmin } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeams, setShowTeams] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamCount, setSelectedTeamCount] = useState<2 | 4>(2);
  
  useEffect(() => {
    async function loadGame() {
      try {
        setLoading(true);
        // Fetch game data
        const gameData = await getGameById(id);
        
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
          
          // Fetch teams if they exist for this game
          try {
            const gameTeams = await getGameTeams(id);
            if (gameTeams) {
              const teamsArray = gameTeamsToArray(gameTeams);
              if (teamsArray.length > 0) {
                setTeams(teamsArray);
                setShowTeams(true);
                // Set team count based on the number of teams loaded
                setSelectedTeamCount(teamsArray.length > 2 ? 4 : 2);
              }
            }
          } catch (teamsErr) {
            console.error('Failed to fetch teams:', teamsErr);
            // Don't fail the page load if teams fail to load
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
  
  const generateTeams = async () => {
    try {
      // Check if teams already exist
      if (showTeams && teams.length > 0) {
        const confirmRegenerate = window.confirm(
          "Teams are already generated. Generating again will override the current teams and reassign players. Is that okay?"
        );
        
        if (!confirmRegenerate) {
          return; // Exit if user cancels
        }
      }
      
      // Use actual participant data
      console.log('Using actual participant data for team generation');
      
      if (participants.length < 2) {
        alert('Not enough players to generate teams. Minimum 2 players required.');
        return;
      }
      
      // Extract user IDs from participants
      const userIds = participants.map(participant => participant.UserId).filter(Boolean);
      
      // Fetch player data from Users table using batch get
      const { players } = await getBatchPlayers(userIds);

      // If no players were retrieved, fallback to generating players from participant data
      if (players.length === 0) {
        return;
      }
      
      // Rating 7 is default
      players.forEach(player => {
        if (!player.rating || player.rating === 0) {
          player.rating = 7;
        }
        
        // Ensure position array exists
        if (!player.position || player.position.length === 0) {
          player.position = ['Midfielder'];
        }
      });
      
      // Use the selected team count from state
      // Only allow 4 teams if we have at least 8 players
      const teamCount = players.length >= 8 ? selectedTeamCount : 2;
      
      console.log('Generating teams with', players.length, 'players into', teamCount, 'teams');
      
      const generatedTeams = divideTeams(players, teamCount as 2 | 4);
      
      setTeams(generatedTeams);
      
      // Log team ELO values
      console.log('Team ELO values:', generatedTeams.map((team, index) => ({
        team: index + 1,
        elo: team.elo,
        players: team.players.length
      })));
      
      setShowTeams(true);
      
      // Store teams in the database with simplified player objects
      try {
        // Create a simplified version of teams with only name and UserId for each player
        const simplifiedTeamsForStorage: SimplifiedTeam[] = generatedTeams.map(team => ({
          players: team.players.map(player => ({
            name: player.name,
            UserId: player.uuid
          }))
        }));
        
        const result = await storeGameTeams(id, simplifiedTeamsForStorage);
        if (result.success) {
          console.log('Teams stored successfully in database');
        }
      } catch (storeError) {
        console.error('Failed to store teams in database:', storeError);
        // Don't show alert to user, as teams are still displayed on the page
      }
    } catch (error) {
      console.error('Failed to generate teams:', error);
      alert('Failed to generate teams. Please try again.');
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
            
            {/* Team Generation Section - only show to admins */}
            {isAdmin && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Team Generation</h2>
                
                {/* Team Count Selector */}
                <div className="mb-4 flex items-center gap-3">
                  <label htmlFor="teamCount" className="font-medium dark:text-white whitespace-nowrap">Number of Teams:</label>
                  <select
                    id="teamCount"
                    value={selectedTeamCount}
                    onChange={(e) => setSelectedTeamCount(parseInt(e.target.value) as 2 | 4)}
                    className="px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value={2}>2 Teams</option>
                    <option value={4}>4 Teams</option>
                  </select>
                </div>
                
                {/* Generate Teams Button */}
                <button 
                  onClick={generateTeams}
                  className="bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer"
                >
                  {showTeams && teams.length > 0 ? 'Re-Shuffle Teams' : 'Generate Teams'}
                </button>
              </div>
            )}
            
            {/* Teams Section - Using the division algorithm */}
            {showTeams && teams.length > 0 && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Teams</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teams.map((team, teamIndex) => {
                    // Color map for teams
                    const teamColors = [
                      { name: 'Red Team', bgClass: 'bg-red-50 dark:bg-red-900/20', textClass: 'text-red-600 dark:text-red-400' },
                      { name: 'Green Team', bgClass: 'bg-green-50 dark:bg-green-900/20', textClass: 'text-green-600 dark:text-green-400' },
                      { name: 'Blue Team', bgClass: 'bg-blue-50 dark:bg-blue-900/20', textClass: 'text-blue-600 dark:text-blue-400' },
                      { name: 'Black Team', bgClass: 'bg-gray-50 dark:bg-gray-900/20', textClass: 'text-gray-800 dark:text-gray-300' }
                    ];
                    
                    const color = teamColors[teamIndex % teamColors.length];
                    
                    return (
                      <div key={`team-${teamIndex}`}>
                        <h3 className={`text-lg font-medium mb-2 ${color.textClass}`}>{color.name}</h3>
                        <div className={`${color.bgClass} rounded-lg p-4`}>
                          <div className="grid grid-cols-1 gap-2">
                            {team.players.map((player, playerIndex) => (
                              <div 
                                key={`${teamIndex}-${playerIndex}`} 
                                className="bg-white dark:bg-gray-800 rounded-md p-2 shadow-sm text-center dark:text-gray-200"
                              >
                                {player.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add gap/spacing here */}
            <div className="mb-12"></div>

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

          </div>
        </div>
      </div>
    </div>
  );
} 