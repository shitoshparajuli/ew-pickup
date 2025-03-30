import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Game } from "@/data/types";
import { getGameParticipants } from "./game-participants";

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

interface CreateGameParams {
  date: string;
  startTime: string;
  location: string;
  isPaid: boolean;
}

export async function createGame({ date, startTime, location, isPaid }: CreateGameParams) {
  try {
    const command = new PutCommand({
      TableName: "Games",
      Item: {
        GameId: date,
        Date: date,
        StartTime: startTime,
        Location: location,
        Status: "UPCOMING",
        IsPaid: isPaid,
      },
    });

    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

export async function getNextGame() {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    const command = new QueryCommand({
      TableName: "Games",
      IndexName: "Status-index",
      KeyConditionExpression: "#status = :status",
      FilterExpression: "GameId >= :currentDate",
      ExpressionAttributeNames: {
        "#status": "Status"
      },
      ExpressionAttributeValues: {
        ":status": "UPCOMING",
        ":currentDate": currentDate
      },
      ScanIndexForward: true // This ensures we get results in ascending order
    });

    const result = await docClient.send(command);    
    // Sort the items by GameId to ensure we get the earliest game
    if (result.Items && result.Items.length > 0) {
      const sortedItems = result.Items.sort((a, b) => {
        if (a.GameId < b.GameId) return -1;
        if (a.GameId > b.GameId) return 1;
        return 0;
      });
      return sortedItems[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error getting next game:", error);
    throw error;
  }
}

export async function getGameById(id: string) {
  try {
    console.log('Getting game with ID:', id);
    
    const command = new GetCommand({
      TableName: "Games",
      Key: {
        GameId: id,
        Date: id // Including Date as part of the composite key
      }
    });
    
    const response = await docClient.send(command);
    console.log('Response from DynamoDB:', response);
    
    if (!response.Item) {
      return null;
    }
    
    return {
      id: response.Item.GameId,
      date: response.Item.Date,
      day: new Date(response.Item.Date).toLocaleDateString('en-US', { weekday: 'long' }),
      time: response.Item.StartTime,
      location: response.Item.Location,
      status: response.Item.Status,
      isPaid: response.Item.IsPaid
    };
  } catch (error) {
    console.error("Error getting game by ID:", error);
    throw error;
  }
}

export async function getAllGames(): Promise<Game[]> {
  try {
    const command = new QueryCommand({
      TableName: "Games",
      IndexName: "Status-index",
      KeyConditionExpression: "#status = :upcoming OR #status = :completed",
      ExpressionAttributeNames: {
        "#status": "Status"
      },
      ExpressionAttributeValues: {
        ":upcoming": "UPCOMING",
        ":completed": "COMPLETED"
      }
    });

    const result = await docClient.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Process and format all games at once
    const gamesWithParticipants = await Promise.all(result.Items.map(async (item) => {
      const participants = await getGameParticipants(item.GameId);
      
      return {
        id: item.GameId,
        date: item.Date,
        day: new Date(item.Date).toLocaleDateString('en-US', { weekday: 'long' }),
        time: item.StartTime,
        location: item.Location,
        status: item.Status,
        playersCount: participants.length,
        isPaid: item.IsPaid || false,
        winner: item.Winner || undefined,
        loser: item.Loser || undefined
      };
    }));
    
    return gamesWithParticipants;
  } catch (error) {
    console.error("Error getting all games:", error);
    throw error;
  }
}

export async function getUpcomingGames(limit: number = 5): Promise<Game[]> {
  try {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    
    const command = new QueryCommand({
      TableName: "Games",
      IndexName: "Status-index",
      KeyConditionExpression: "#status = :status",
      FilterExpression: "GameId >= :currentDate",
      ExpressionAttributeNames: {
        "#status": "Status"
      },
      ExpressionAttributeValues: {
        ":status": "UPCOMING",
        ":currentDate": currentDate
      },
      ScanIndexForward: true // This ensures we get results in ascending order
    });

    const result = await docClient.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Sort by GameId (date) in ascending order
    const sortedItems = result.Items.sort((a, b) => {
      if (a.GameId < b.GameId) return -1;
      if (a.GameId > b.GameId) return 1;
      return 0;
    }).slice(0, limit);

    // Process and format games
    const gamesWithParticipants = await Promise.all(sortedItems.map(async (item) => {
      const participants = await getGameParticipants(item.GameId);
      
      return {
        id: item.GameId,
        date: item.Date,
        day: new Date(item.Date).toLocaleDateString('en-US', { weekday: 'long' }),
        time: item.StartTime,
        location: item.Location,
        status: item.Status,
        playersCount: participants.length,
        isPaid: item.IsPaid || false
      };
    }));
    
    return gamesWithParticipants;
  } catch (error) {
    console.error("Error getting upcoming games:", error);
    throw error;
  }
}

export async function getPastGames(limit: number = 5): Promise<Game[]> {
  try {
    const command = new QueryCommand({
      TableName: "Games",
      IndexName: "Status-index",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: {
        "#status": "Status"
      },
      ExpressionAttributeValues: {
        ":status": "COMPLETED"
      },
      ScanIndexForward: false // This ensures we get results in descending order
    });

    const result = await docClient.send(command);
    
    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    // Sort by GameId (date) in descending order
    const sortedItems = result.Items.sort((a, b) => {
      if (a.GameId > b.GameId) return -1;
      if (a.GameId < b.GameId) return 1;
      return 0;
    }).slice(0, limit);

    // Process and format games
    const gamesWithParticipants = await Promise.all(sortedItems.map(async (item) => {
      const participants = await getGameParticipants(item.GameId);
      
      return {
        id: item.GameId,
        date: item.Date,
        day: new Date(item.Date).toLocaleDateString('en-US', { weekday: 'long' }),
        time: item.StartTime,
        location: item.Location,
        status: item.Status,
        playersCount: participants.length,
        isPaid: item.IsPaid || false,
        winner: item.Winner || undefined,
        loser: item.Loser || undefined
      };
    }));
    
    return gamesWithParticipants;
  } catch (error) {
    console.error("Error getting past games:", error);
    throw error;
  }
}