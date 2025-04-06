import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";
import { Team, Player } from "@/data/types";

// Add SimplifiedPlayer and SimplifiedTeam interface definitions
export interface SimplifiedPlayer {
  name: string;
  UserId: string;
}

export interface SimplifiedTeam {
  players: SimplifiedPlayer[];
}

// Define minimal player data for DynamoDB storage
export interface MinimalPlayerData {
  name: string;
  uuid?: string;      // Only for registered players
  isGuest?: boolean;  // Only for guests
  hostName?: string;  // Only for guests
}

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TableName = "Game-Teams";

interface GameTeams {
  GameId: string;
  Team1?: MinimalPlayerData[];
  Team2?: MinimalPlayerData[];
  Team3?: MinimalPlayerData[];
  Team4?: MinimalPlayerData[];
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Converts a Player object to minimal data for DynamoDB storage
 * @param player - Full Player object
 * @returns MinimalPlayerData with only essential fields
 */
function playerToMinimalData(player: Player): MinimalPlayerData {
  const minimalData: MinimalPlayerData = {
    name: player.name
  };
  
  // For guests, include isGuest and hostName
  if (player.isGuest) {
    minimalData.isGuest = true;
    if (player.hostName) {
      minimalData.hostName = player.hostName;
    }
  } else {
    // For registered players, include uuid
    minimalData.uuid = player.uuid;
  }
  
  return minimalData;
}

/**
 * Stores teams for a game
 * @param gameId - ID of the game
 * @param teams - Array of teams to store (up to 4) - arrays of Player objects
 * @returns Success status
 */
export async function storeGameTeams(
  gameId: string,
  teams: Player[][]
): Promise<{ success: boolean }> {
  if (!gameId) throw new Error("Game ID is required");
  if (!teams || !teams.length) throw new Error("At least one team is required");
  if (teams.length > 4) throw new Error("Maximum of 4 teams are supported");
  
  try {
    const timestamp = new Date().toISOString();
    
    // Create an object with the teams based on the number provided
    // Convert full Player objects to minimal data for storage
    const teamsObject: Record<string, MinimalPlayerData[]> = {};
    
    teams.forEach((team, index) => {
      const teamKey = `Team${index + 1}`;
      teamsObject[teamKey] = team.map(player => playerToMinimalData(player));
    });
    
    const command = new PutCommand({
      TableName,
      Item: {
        GameId: gameId,
        ...teamsObject,
        CreatedAt: timestamp,
        UpdatedAt: timestamp,
      },
    });

    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error storing game teams:", error);
    throw error;
  }
}

/**
 * Gets teams for a specific game
 * @param gameId - ID of the game to get teams for
 * @returns GameTeams object containing teams data
 */
export async function getGameTeams(gameId: string): Promise<GameTeams | null> {
  if (!gameId) throw new Error("Game ID is required");
  
  try {
    const command = new GetCommand({
      TableName,
      Key: {
        GameId: gameId
      }
    });

    const response = await docClient.send(command);
    
    return response.Item as GameTeams | null;
  } catch (error) {
    console.error("Error getting game teams:", error);
    throw error;
  }
}

/**
 * Updates teams for a specific game
 * @param gameId - ID of the game
 * @param teams - Array of teams to update
 * @returns Success status
 */
export async function updateGameTeams(
  gameId: string,
  teams: Player[][]
): Promise<{ success: boolean }> {
  return storeGameTeams(gameId, teams);
}

/**
 * Converts game teams data to an array of teams
 * @param gameTeams - GameTeams object
 * @returns Array of arrays of Player objects
 */
export function gameTeamsToArray(gameTeams: GameTeams): Player[][] {
  if (!gameTeams) return [];
  
  const result: Player[][] = [];
  
  if (gameTeams.Team1) result.push(gameTeams.Team1.map(p => ensurePlayerFormat(p)));
  if (gameTeams.Team2) result.push(gameTeams.Team2.map(p => ensurePlayerFormat(p)));
  if (gameTeams.Team3) result.push(gameTeams.Team3.map(p => ensurePlayerFormat(p)));
  if (gameTeams.Team4) result.push(gameTeams.Team4.map(p => ensurePlayerFormat(p)));
  
  return result;
}

/**
 * Ensures a player from DynamoDB has the proper Player format
 * @param playerData - Player data from DynamoDB that may be in simplified format
 * @returns A properly formatted Player object with all required properties
 */
function ensurePlayerFormat(playerData: any): Player {
  // Create a properly formatted Player object from minimal data
  return {
    name: playerData.name,
    uuid: playerData.uuid || (playerData.UserId || `guest-${Math.random().toString(36).substring(2, 9)}`),
    rating: 7, // Default rating
    position: ['Midfielder'], // Default position
    isGuest: !!playerData.isGuest,
    hostName: playerData.hostName
  };
}
