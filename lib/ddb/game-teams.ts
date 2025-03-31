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
  Team1?: any;
  Team2?: any;
  Team3?: any;
  Team4?: any;
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * Stores teams for a game
 * @param gameId - ID of the game
 * @param teams - Array of teams to store (up to 4) - can be full Team objects or simplified teams
 * @returns Success status
 */
export async function storeGameTeams(
  gameId: string,
  teams: Team[] | SimplifiedTeam[]
): Promise<{ success: boolean }> {
  if (!gameId) throw new Error("Game ID is required");
  if (!teams || !teams.length) throw new Error("At least one team is required");
  if (teams.length > 4) throw new Error("Maximum of 4 teams are supported");
  
  try {
    const timestamp = new Date().toISOString();
    
    // Create an object with the teams based on the number provided
    const teamsObject: Partial<GameTeams> = {};
    
    teams.forEach((team, index) => {
      const teamKey = `Team${index + 1}` as keyof GameTeams;
      teamsObject[teamKey] = team;
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
  teams: Team[] | SimplifiedTeam[]
): Promise<{ success: boolean }> {
  return storeGameTeams(gameId, teams);
}

/**
 * Converts game teams data to an array of teams
 * @param gameTeams - GameTeams object
 * @returns Array of Team objects
 */
export function gameTeamsToArray(gameTeams: GameTeams): Team[] {
  if (!gameTeams) return [];
  
  const result: Team[] = [];
  
  if (gameTeams.Team1) result.push(convertToTeam(gameTeams.Team1));
  if (gameTeams.Team2) result.push(convertToTeam(gameTeams.Team2));
  if (gameTeams.Team3) result.push(convertToTeam(gameTeams.Team3));
  if (gameTeams.Team4) result.push(convertToTeam(gameTeams.Team4));
  
  return result;
}

/**
 * Converts a simplified team from DynamoDB to a proper Team object
 * @param teamData - Team data from DynamoDB that may be simplified
 * @returns A properly formatted Team object with all required Player properties
 */
function convertToTeam(teamData: any): Team {
  return {
    players: teamData.players.map((player: any) => {
      // Map from simplified player (with just name and UserId) to full Player type
      return {
        uuid: player.UserId || player.uuid || "",
        name: player.name || "",
        rating: player.rating || 7, // Default rating if not provided
        position: player.position || ['Midfielder'] // Default position if not provided
      } as Player;
    })
  };
}
