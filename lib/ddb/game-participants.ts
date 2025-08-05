import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getGameById } from "./games";

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
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
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

export async function updateGuestApprovalStatus(
  gameId: string,
  hostUserId: string,
  guestName: string,
  approvalStatus: 'APPROVED' | 'REJECTED',
  approvedBy: string,
  rejectionReason?: string
) {
  try {
    console.log('Updating guest approval status:', {
      gameId,
      hostUserId,
      guestName,
      approvalStatus,
      approvedBy,
      rejectionReason
    });

    let participant = null;

    // Try GetCommand first
    try {
      const getCommand = new GetCommand({
        TableName: "Game-Participants",
        Key: {
          GameId: gameId,
          UserId: hostUserId
        }
      });

      const getResponse = await docClient.send(getCommand);
      participant = getResponse.Item;
      console.log('GetCommand successful, found participant:', participant);
    } catch (getError) {
      console.log('GetCommand failed, trying QueryCommand:', getError);
      
      // Fallback to QueryCommand
      try {
        const queryCommand = new QueryCommand({
          TableName: "Game-Participants",
          KeyConditionExpression: "GameId = :gameId",
          FilterExpression: "UserId = :userId",
          ExpressionAttributeValues: {
            ":gameId": gameId,
            ":userId": hostUserId
          }
        });

        const queryResponse = await docClient.send(queryCommand);
        participant = queryResponse.Items?.[0];
        console.log('QueryCommand successful, found participant:', participant);
      } catch (queryError) {
        console.log('QueryCommand also failed:', queryError);
        
        // Last resort: Scan and filter
        try {
          const scanCommand = new ScanCommand({
            TableName: "Game-Participants",
            FilterExpression: "GameId = :gameId AND UserId = :userId",
            ExpressionAttributeValues: {
              ":gameId": gameId,
              ":userId": hostUserId
            }
          });

          const scanResponse = await docClient.send(scanCommand);
          participant = scanResponse.Items?.[0];
          console.log('ScanCommand successful, found participant:', participant);
        } catch (scanError) {
          console.error('All methods failed to find participant:', scanError);
          throw new Error(`Participant not found for game ${gameId} and user ${hostUserId}`);
        }
      }
    }

    if (!participant) {
      console.error('Participant not found for:', { gameId, hostUserId });
      throw new Error(`Participant not found for game ${gameId} and user ${hostUserId}`);
    }

    console.log('Found participant:', {
      GameId: participant.GameId,
      UserId: participant.UserId,
      GuestList: participant.GuestList
    });

    if (!participant.GuestList || !Array.isArray(participant.GuestList)) {
      console.error('No GuestList found for participant:', participant);
      throw new Error('No guest list found for this participant');
    }

    // Find the specific guest
    const guestIndex = participant.GuestList.findIndex((guest: any) => guest.name === guestName);
    
    if (guestIndex === -1) {
      console.error('Guest not found:', { guestName, availableGuests: participant.GuestList.map((g: any) => g.name) });
      throw new Error(`Guest "${guestName}" not found for this participant`);
    }

    console.log('Found guest at index:', guestIndex, participant.GuestList[guestIndex]);

    // Update the specific guest's approval status
    const updatedGuestList = [...participant.GuestList];
    updatedGuestList[guestIndex] = {
      ...updatedGuestList[guestIndex],
      approvalStatus,
      approvedAt: approvalStatus === 'APPROVED' ? new Date().toISOString() : undefined,
      approvedBy: approvalStatus === 'APPROVED' ? approvedBy : undefined,
      rejectionReason: approvalStatus === 'REJECTED' ? rejectionReason : undefined
    };

    console.log('Updated guest list:', updatedGuestList);

    // Update the participant record
    const updateCommand = new PutCommand({
      TableName: "Game-Participants",
      Item: {
        ...participant,
        GuestList: updatedGuestList,
        UpdatedAt: new Date().toISOString()
      }
    });

    console.log('Sending update command...');
    await docClient.send(updateCommand);
    console.log('Update successful');
    
    return { success: true };
  } catch (error) {
    console.error("Error updating guest approval status:", {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      gameId,
      hostUserId,
      guestName,
      approvalStatus
    });
    throw error;
  }
}

export async function getPendingGuestApprovals(options: { 
  checkGameStatus?: boolean; 
  includeAllGames?: boolean;
} = {}): Promise<Array<{
  gameId: string;
  hostUserId: string;
  hostName: string;
  guest: any;
}>> {
  const { checkGameStatus = true, includeAllGames = false } = options;
  
  try {
    console.log(`=== Starting getPendingGuestApprovals (checkGameStatus: ${checkGameStatus}, includeAllGames: ${includeAllGames}) ===`);
    
    // Add timeout protection
    const timeoutPromise = new Promise<Array<{
      gameId: string;
      hostUserId: string;
      hostName: string;
      guest: any;
    }>>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout after 30 seconds')), 30000);
    });
    
    const fetchPromise = (async () => {
      // First, get all participants
      const command = new ScanCommand({
        TableName: "Game-Participants"
      });

      console.log('Sending ScanCommand for all participants...');
      const response = await docClient.send(command);
      const participants = response.Items || [];
      
      console.log('All participants found:', participants.length);
      if (participants.length > 0) {
        console.log('Sample participant:', JSON.stringify(participants[0], null, 2));
      } else {
        console.log('No participants found in database');
        return [];
      }

      // Get game statuses if needed
      let gameStatuses: Record<string, any> = {};
      
      if (checkGameStatus && !includeAllGames) {
        // Get unique game IDs first
        const uniqueGameIds = [...new Set(participants.map(p => p.GameId))];
        console.log('Unique game IDs found:', uniqueGameIds);

        // Batch fetch game statuses with retry logic
        for (const gameId of uniqueGameIds) {
          let retries = 0;
          const maxRetries = 3;
          
          while (retries < maxRetries) {
            try {
              console.log(`Fetching game status for ${gameId} (attempt ${retries + 1})`);
              const game = await getGameById(gameId);
              gameStatuses[gameId] = game;
              console.log(`Game status for ${gameId}:`, game?.status);
              break; // Success, exit retry loop
            } catch (error) {
              retries++;
              console.error(`Error fetching game ${gameId} (attempt ${retries}):`, error);
              
              if (retries >= maxRetries) {
                console.error(`Failed to fetch game ${gameId} after ${maxRetries} attempts`);
                gameStatuses[gameId] = null; // Mark as failed
              } else {
                // Wait before retry (exponential backoff)
                const waitTime = Math.pow(2, retries) * 1000; // 2s, 4s, 8s
                console.log(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          }
        }
      }

      // Filter and flatten to get all pending guests
      const pendingGuests: Array<{
        gameId: string;
        hostUserId: string;
        hostName: string;
        guest: any;
      }> = [];

      // Process participants
      for (const participant of participants) {
        console.log('--- Processing participant ---');
        console.log('Participant:', {
          UserId: participant.UserId,
          GameId: participant.GameId,
          FirstName: participant.FirstName,
          LastName: participant.LastName,
          GuestListLength: participant.GuestList ? participant.GuestList.length : 0
        });
        
        if (participant.GuestList && Array.isArray(participant.GuestList)) {
          console.log('GuestList found:', JSON.stringify(participant.GuestList, null, 2));
          
          // Check if we should include this game's guests
          let shouldIncludeGame = true;
          
          if (checkGameStatus && !includeAllGames) {
            const game = gameStatuses[participant.GameId];
            console.log('Game status for', participant.GameId, ':', game?.status);
            
            if (game && game.status === 'UPCOMING') {
              // Check if the game is paid
              if (game.isPaid) {
                console.log('Game is UPCOMING and PAID, checking guests...');
              } else {
                console.log('Skipping game', participant.GameId, 'because it is not a paid game (isPaid:', game.isPaid, ')');
                shouldIncludeGame = false;
              }
            } else if (!game) {
              console.log('Game status not available for', participant.GameId, '- skipping to avoid including guests from unknown game types');
              shouldIncludeGame = false;
            } else {
              console.log('Skipping game', participant.GameId, 'because it is not upcoming (status:', game?.status, ')');
              shouldIncludeGame = false;
            }
          } else if (includeAllGames) {
            console.log('Include all games mode - checking guests for all games...');
          }
          
          if (shouldIncludeGame) {
            participant.GuestList.forEach((guest: any, index: number) => {
              console.log(`Guest ${index}:`, {
                name: guest.name,
                approvalStatus: guest.approvalStatus,
                rating: guest.rating
              });
              
              // Check if guest has PENDING status or no approvalStatus (legacy guests)
              if (guest.approvalStatus === 'PENDING' || !guest.approvalStatus) {
                const mode = includeAllGames ? 'all games' : 'upcoming paid games';
                console.log(`Adding pending guest (${mode}):`, guest.name, 'for game:', participant.GameId);
                pendingGuests.push({
                  gameId: participant.GameId,
                  hostUserId: participant.UserId,
                  hostName: `${participant.FirstName} ${participant.LastName}`,
                  guest: {
                    ...guest,
                    approvalStatus: guest.approvalStatus || 'PENDING' // Default to PENDING for legacy guests
                  }
                });
              } else {
                console.log('Skipping guest:', guest.name, 'because status is:', guest.approvalStatus);
              }
            });
          }
        } else {
          console.log('No GuestList found for participant or GuestList is not an array');
        }
      }

      const mode = includeAllGames ? 'all games' : 'upcoming paid games';
      console.log(`=== Final Results (${mode}) ===`);
      console.log(`Total pending guests found for ${mode}:`, pendingGuests.length);
      if (pendingGuests.length > 0) {
        console.log('Pending guests:', JSON.stringify(pendingGuests, null, 2));
      }
      
      return pendingGuests;
    })();
    
    // Race between timeout and fetch
    return await Promise.race([fetchPromise, timeoutPromise]);
    
  } catch (error) {
    console.error("Error getting pending guest approvals:", error);
    // Return empty array instead of throwing to prevent infinite loading
    return [];
  }
}

export async function checkDatabaseStatus() {
  try {
    console.log('=== Checking Database Status ===');
    
    // Check if there are any participants at all
    const participantsCommand = new ScanCommand({
      TableName: "Game-Participants"
    });
    
    const participantsResponse = await docClient.send(participantsCommand);
    const allParticipants = participantsResponse.Items || [];
    
    console.log('Total participants in database:', allParticipants.length);
    
    if (allParticipants.length > 0) {
      console.log('Sample participant structure:', JSON.stringify(allParticipants[0], null, 2));
      
      // Check how many have guests
      const participantsWithGuests = allParticipants.filter(p => 
        p.GuestList && Array.isArray(p.GuestList) && p.GuestList.length > 0
      );
      
      console.log('Participants with guests:', participantsWithGuests.length);
      
      if (participantsWithGuests.length > 0) {
        console.log('Sample participant with guests:', JSON.stringify(participantsWithGuests[0], null, 2));
        
        // Check guest approval statuses
        const allGuests = participantsWithGuests.flatMap(p => p.GuestList);
        console.log('Total guests found:', allGuests.length);
        
        const pendingGuests = allGuests.filter(g => !g.approvalStatus || g.approvalStatus === 'PENDING');
        const approvedGuests = allGuests.filter(g => g.approvalStatus === 'APPROVED');
        const rejectedGuests = allGuests.filter(g => g.approvalStatus === 'REJECTED');
        
        console.log('Guest approval status breakdown:');
        console.log('- Pending:', pendingGuests.length);
        console.log('- Approved:', approvedGuests.length);
        console.log('- Rejected:', rejectedGuests.length);
        console.log('- No status:', allGuests.filter(g => !g.approvalStatus).length);
      }
    }
    
    // Check upcoming games
    const { getUpcomingGames } = await import('./games');
    const upcomingGames = await getUpcomingGames(10);
    console.log('Upcoming games found:', upcomingGames.length);
    
    if (upcomingGames.length > 0) {
      console.log('Upcoming games:', upcomingGames.map(g => ({ id: g.id, date: g.date, status: g.status })));
    }
    
    return {
      totalParticipants: allParticipants.length,
      participantsWithGuests: allParticipants.filter(p => 
        p.GuestList && Array.isArray(p.GuestList) && p.GuestList.length > 0
      ).length,
      totalGuests: allParticipants.flatMap(p => p.GuestList || []).length,
      pendingGuests: allParticipants.flatMap(p => p.GuestList || []).filter(g => !g.approvalStatus || g.approvalStatus === 'PENDING').length,
      upcomingGames: upcomingGames.length
    };
  } catch (error) {
    console.error('Error checking database status:', error);
    throw error;
  }
}
