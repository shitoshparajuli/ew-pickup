import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  BatchGetCommand,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput,
  BatchGetCommandOutput
} from "@aws-sdk/lib-dynamodb";
import { CognitoUser, UserProfile, Player, Position } from "@/data/types";

// Configure AWS credentials
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TableName = "Users";

// Get user ID from Cognito user
export function getUserId(user: CognitoUser | null): string | null {
  if (user && user.attributes?.sub) {
    return user.attributes.sub;
  }
  return null;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("Getting user profile for userId:", userId);
  if (!userId) return null;
  console.log("userId", userId);
  
  try {
    const command = new GetCommand({
      TableName,
      Key: { UserId: userId },
    });
    return response.Item as UserProfile | null;
  } catch (error) {
    console.error("Error fetching user profile:", {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      request: {
        TableName,
        Key: { UserId: userId }
      }
    });
    throw error;
  }
}

/**
 * Get multiple user profiles in a batch and convert them to Player objects
 * 
 * @param userIds - Array of user IDs to retrieve
 * @param options - Optional parameters for the batch get operation
 * @returns Object with retrieved players and any unprocessed keys
 * 
 * Note: DynamoDB BatchGet has the following limits:
 * - Maximum of 100 items per batch
 * - Maximum 16MB total response size
 * - If these limits are exceeded, DynamoDB returns partial results with UnprocessedKeys
 */
export async function getBatchPlayers(
  userIds: string[],
  options: {
    consistentRead?: boolean,
    projectionExpression?: string,
    returnConsumedCapacity?: "INDEXES" | "TOTAL" | "NONE"
  } = {}
): Promise<{ 
  players: Player[], 
  unprocessedKeys: string[] 
}> {
  if (!userIds || userIds.length === 0) {
    return { players: [], unprocessedKeys: [] };
  }
  
  // DynamoDB batch get limit is 100 items
  if (userIds.length > 100) {
    console.warn(`BatchGet request exceeded the 100 item limit. Truncating to first 100 items.`);
    userIds = userIds.slice(0, 100);
  }
  
  try {
    const keys = userIds.map(id => ({ UserId: id }));
    
    const command = new BatchGetCommand({
      RequestItems: {
        [TableName]: {
          Keys: keys,
          ConsistentRead: options.consistentRead,
          ProjectionExpression: options.projectionExpression
        }
      },
      ReturnConsumedCapacity: options.returnConsumedCapacity
    });
    
    const response: BatchGetCommandOutput = await docClient.send(command);
    
    // Process response and convert directly to Player objects
    const players: Player[] = [];
    
    if (response.Responses && response.Responses[TableName]) {
      const items = response.Responses[TableName];
      items.forEach(item => {
        players.push({
          uuid: item.UserId,
          name: `${item.FirstName} ${item.LastName}`,
          rating: item.Rating || 7, // Default rating, adjust as needed
          position: item.PreferredPositions as Position[] || []
        });
      });
    }
    
    // Handle unprocessed keys if any
    const unprocessedKeys: string[] = [];
    
    if (response.UnprocessedKeys && 
        response.UnprocessedKeys[TableName] && 
        response.UnprocessedKeys[TableName].Keys) {
      response.UnprocessedKeys[TableName].Keys.forEach(key => {
        if (key.UserId) {
          unprocessedKeys.push(key.UserId as string);
        }
      });
    }
    
    if (unprocessedKeys.length > 0) {
      console.warn(`Some user profiles were not processed in the batch request. Consider retrying with exponential backoff.`, {
        totalRequested: userIds.length,
        processed: players.length,
        unprocessed: unprocessedKeys.length
      });
    }
    
    if (response.ConsumedCapacity) {
      console.log("BatchGet consumed capacity:", response.ConsumedCapacity);
    }
    
    return { 
      players, 
      unprocessedKeys 
    };
    
  } catch (error) {
    console.error("Error batch fetching players:", {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      request: {
        TableName,
        Keys: userIds.map(id => ({ UserId: id }))
      }
    });
    throw error;
  }
}

// Save user profile
export async function saveUserProfile(
  userId: string, 
  profileData: Omit<UserProfile, 'UserId'>
): Promise<boolean> {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const timestamp = new Date().toISOString();
    
    const command = new PutCommand({
      TableName,
      Item: {
        UserId: userId,
        ...profileData,
        CreatedAt: profileData.CreatedAt || timestamp,
        UpdatedAt: timestamp,
        IsAdmin: false,
        IsMember: false,
      },
    });
    
    await docClient.send(command);
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string, 
  updateData: Partial<Omit<UserProfile, 'userId'>>
): Promise<UserProfile | null> {
  if (!userId) throw new Error("User ID is required");
  
  try {
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    
    // Build update expression and expression attribute values
    const updateExpression = "set " + Object.keys(dataToUpdate)
      .map((key) => `#${key} = :${key}`)
      .join(", ");
    
    const expressionAttributeNames: Record<string, string> = Object.keys(dataToUpdate).reduce(
      (acc, key) => {
        acc[`#${key}`] = key;
        return acc;
      },
      {} as Record<string, string>
    );
    
    const expressionAttributeValues: Record<string, any> = Object.entries(dataToUpdate).reduce(
      (acc, [key, value]) => {
        acc[`:${key}`] = value;
        return acc;
      },
      {} as Record<string, any>
    );
    
    const command = new UpdateCommand({
      TableName,
      Key: { UserId: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });
    
    const response: UpdateCommandOutput = await docClient.send(command);
    return response.Attributes as UserProfile | null;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}