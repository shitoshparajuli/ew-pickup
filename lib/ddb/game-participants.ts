import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

interface CreateGameParticipantParams {
  gameId: string;
  userId: string;
  guestList?: string;
}

export async function createGameParticipant({ 
  gameId, 
  userId,
  guestList,
}: CreateGameParticipantParams) {
  try {
    const timestamp = new Date().toISOString();
    
    const command = new PutCommand({
      TableName: "Game-Participants",
      Item: {
        GameId: gameId,
        UserId: userId,
        GuestList: guestList || "",
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
