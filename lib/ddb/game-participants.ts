import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

interface GuestInfo {
  name: string;
  rating: number;
}

interface CreateGameParticipantParams {
  gameId: string;
  userId: string;
  firstName: string;
  lastName: string;
  guestList?: GuestInfo[];
}

export async function createGameParticipant({ 
  gameId, 
  userId,
  firstName,
  lastName,
  guestList,
}: CreateGameParticipantParams) {
  try {
    const timestamp = new Date().toISOString();
    
    const command = new PutCommand({
      TableName: "Game-Participants",
      Item: {
        GameId: gameId,
        UserId: userId,
        FirstName: firstName,
        LastName: lastName,
        GuestList: guestList || [],
        CreatedAt: timestamp,
        UpdatedAt: timestamp,
      },
    });

    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error creating game participant:", error);
    throw error;
  }
}

export async function getGameParticipants(gameId: string) {
  try {
    const command = new QueryCommand({
      TableName: "Game-Participants",
      KeyConditionExpression: "GameId = :gameId",
      ExpressionAttributeValues: {
        ":gameId": gameId
      }
    });

    const response = await docClient.send(command);
    
    return response.Items || [];
  } catch (error) {
    console.error("Error getting game participants:", error);
    throw error;
  }
}

export async function isUserParticipatingInGame(gameId: string, userId: string) {
  try {
    const command = new QueryCommand({
      TableName: "Game-Participants",
      KeyConditionExpression: "GameId = :gameId AND UserId = :userId",
      ExpressionAttributeValues: {
        ":gameId": gameId,
        ":userId": userId
      }
    });

    const response = await docClient.send(command);
    
    return response.Items && response.Items.length > 0;
  } catch (error) {
    console.error("Error checking if user is participating in game:", error);
    throw error;
  }
}

export async function deleteGameParticipant(gameId: string, userId: string) {
  try {
    const command = new DeleteCommand({
      TableName: "Game-Participants",
      Key: {
        GameId: gameId,
        UserId: userId
      }
    });

    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting game participant:", error);
    throw error;
  }
}
