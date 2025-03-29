import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  GetCommandOutput,
  PutCommandOutput,
  UpdateCommandOutput 
} from "@aws-sdk/lib-dynamodb";
import { CognitoUser, UserProfile } from "@/data/types";

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
  // For Cognito user from Google federation, the ID is typically in sub
  if (user && user.attributes?.sub) {
    return user.attributes.sub;
  }
  return null;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  
  try {
    const command = new GetCommand({
      TableName,
      Key: { UserId: userId },
    });
    
    const response: GetCommandOutput = await docClient.send(command);
    console.log("DynamoDB request:", {
      TableName,
      Key: { UserId: userId },
      command: command
    });
    console.log("DynamoDB response:", response);
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