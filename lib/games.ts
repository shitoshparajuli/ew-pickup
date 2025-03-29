import { Game } from "@/data/types";

// Mock data for games - would typically come from a database
const MOCK_GAMES: Game[] = [
  {
    id: '1',
    date: 'April 1, 2023',
    day: 'Saturday',
    time: '9:00 PM',
    location: 'Woodinville Sports Field',
    playersCount: 28,
    status: 'UPCOMING',
    isPaid: false
  },
  {
    id: '2',
    date: 'March 25, 2023',
    day: 'Saturday',
    time: '9:00 PM',
    location: 'Woodinville Sports Field',
    playersCount: 40,
    status: 'COMPLETED',
    winner: 'Team A',
    loser: 'Team B',
    isPaid: true
  }
];

/**
 * Get all games
 * In a real app, this would fetch from an API or database
 */
export async function getAllGames(): Promise<Game[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_GAMES;
}

/**
 * Get a specific game by ID
 * In a real app, this would fetch from an API or database
 */
export async function getGameById(id: string): Promise<Game | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_GAMES.find(game => game.id === id) || null;
}

/**
 * Get upcoming games
 */
export async function getUpcomingGames(): Promise<Game[]> {
  const games = await getAllGames();
  return games.filter(game => game.status === 'UPCOMING');
}

/**
 * Get completed games
 */
export async function getCompletedGames(): Promise<Game[]> {
  const games = await getAllGames();
  return games.filter(game => game.status === 'COMPLETED');
}

/**
 * Join a game (mock implementation)
 * In a real app, this would make an API call to join the game
 */
export async function joinGame(gameId: string, userId: string): Promise<boolean> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Always return success in mock implementation
  return true;
} 