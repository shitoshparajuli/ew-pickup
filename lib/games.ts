import { Game } from "@/data/types";

// Mock data for games - would typically come from a database
const MOCK_GAMES: Game[] = [
  {
    id: '1',
    date: 'April 1, 2023',
    time: '9:00 PM',
    location: 'Woodinville Sports Field',
    playersCount: 28,
    status: 'upcoming',
    players: [
      { id: 'p1', name: 'John Doe', position: 'Midfielder' },
      { id: 'p2', name: 'Jane Smith', position: 'Defender' },
      { id: 'p3', name: 'Mike Johnson', position: 'Forward' },
      { id: 'p4', name: 'Sarah Williams', position: 'Goalkeeper' },
    ]
  },
  {
    id: '2',
    date: 'March 25, 2023',
    time: '9:00 PM',
    location: 'Woodinville Sports Field',
    playersCount: 40,
    status: 'completed',
    players: [
      { id: 'p1', name: 'John Doe', position: 'Midfielder' },
      { id: 'p2', name: 'Jane Smith', position: 'Defender' },
      { id: 'p3', name: 'Mike Johnson', position: 'Forward' },
      { id: 'p4', name: 'Sarah Williams', position: 'Goalkeeper' },
      { id: 'p5', name: 'Alex Turner', position: 'Defender' },
      { id: 'p6', name: 'Emily Clark', position: 'Midfielder' },
    ],
    result: 'Great game with full attendance!'
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
  return games.filter(game => game.status === 'upcoming');
}

/**
 * Get completed games
 */
export async function getCompletedGames(): Promise<Game[]> {
  const games = await getAllGames();
  return games.filter(game => game.status === 'completed');
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