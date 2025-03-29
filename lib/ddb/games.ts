import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

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
