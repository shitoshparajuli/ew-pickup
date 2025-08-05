'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPendingGuestApprovals, updateGuestApprovalStatus, checkDatabaseStatus } from '@/lib/ddb/game-participants';
import { getGameById } from '@/lib/ddb/games';
import { createGameParticipant } from '@/lib/ddb/game-participants';
import { Game } from '@/data/types';

interface PendingGuest {
  gameId: string;
  hostUserId: string;
  hostName: string;
  guest: {
    name: string;
    rating: number;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: string;
  };
}

export default function GuestApprovalsPage() {
  const { user, isAdmin } = useAuth();
  const [pendingGuests, setPendingGuests] = useState<PendingGuest[]>([]);
  const [games, setGames] = useState<Record<string, Game>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchPendingApprovals();
    }
  }, [isAdmin]);

  const fetchPendingApprovals = async () => {
    try {
      console.log('Fetching pending approvals...');
      setLoading(true);
      
      const guests = await getPendingGuestApprovals({ checkGameStatus: true, includeAllGames: false });
      console.log('Pending approvals result:', guests);
      setPendingGuests(guests);

      // Fetch game details for each pending guest
      const gameIds = [...new Set(guests.map(g => g.gameId))];
      const gameDetails: Record<string, Game> = {};
      
      for (const gameId of gameIds) {
        try {
          const game = await getGameById(gameId);
          if (game) {
            gameDetails[gameId] = game;
          }
        } catch (error) {
          console.error(`Error fetching game ${gameId}:`, error);
        }
      }
      
      setGames(gameDetails);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      alert('Error fetching pending approvals: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    gameId: string,
    hostUserId: string,
    guestName: string,
    approvalStatus: 'APPROVED' | 'REJECTED'
  ) => {
    const processingKey = `${gameId}-${hostUserId}-${guestName}`;
    
    try {
      setProcessing(processingKey);
      console.log('Processing approval:', { gameId, hostUserId, guestName, approvalStatus });
      
      const result = await updateGuestApprovalStatus(
        gameId,
        hostUserId,
        guestName,
        approvalStatus,
        user?.username || 'Unknown Admin',
        approvalStatus === 'REJECTED' ? rejectionReason : undefined
      );
      
      console.log('Approval result:', result);
      
      if (result.success) {
        // Remove the guest from the pending list
        setPendingGuests(prev => prev.filter(g => 
          !(g.gameId === gameId && g.hostUserId === hostUserId && g.guest.name === guestName)
        ));
        
        // Close modal if it was open
        if (showRejectionModal === processingKey) {
          setShowRejectionModal(null);
          setRejectionReason('');
        }
        
        alert(`Guest ${guestName} has been ${approvalStatus.toLowerCase()}`);
      } else {
        alert('Failed to update approval status');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to update approval status: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessing(null);
    }
  };



  const checkDatabase = async () => {
    try {
      console.log('Checking database status...');
      const status = await checkDatabaseStatus();
      console.log('Database status:', status);
      
      const summary = `
Database Status:
- Total participants: ${status.totalParticipants}
- Participants with guests: ${status.participantsWithGuests}
- Total guests: ${status.totalGuests}
- Pending guests: ${status.pendingGuests}
- Upcoming games: ${status.upcomingGames}

Check console for detailed breakdown.
      `;
      
      alert(summary);
    } catch (error) {
      console.error('Database check failed:', error);
      alert('Database check failed. Check console for details.');
    }
  };





  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
          Guest Approval Management
        </h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            ⚠️ Important Note
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-3">
            This dashboard only shows pending guest approvals for <strong>upcoming paid games</strong>. 
            Free games and completed games are automatically excluded from the approval process.
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Database Tools
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-3">
            Use these tools to manage guest approvals and test the system.
          </p>
          <div className="flex gap-3">
            <button
              onClick={checkDatabase}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Check Database Status
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-300">Loading pending approvals...</div>
          </div>
        ) : pendingGuests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-300">No pending guest approvals</div>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingGuests.map((pendingGuest) => {
              const game = games[pendingGuest.gameId];
              const processingKey = `${pendingGuest.gameId}-${pendingGuest.hostUserId}-${pendingGuest.guest.name}`;
              const isProcessing = processing === processingKey;
              const showModal = showRejectionModal === processingKey;

              return (
                <div key={processingKey} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Guest Information</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Name:</strong> {pendingGuest.guest.name}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Skill Level:</strong> {pendingGuest.guest.rating}/10
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Host:</strong> {pendingGuest.hostName}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Game Information</h3>
                      {game ? (
                        <>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong>Date:</strong> {game.date}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong>Time:</strong> {game.time}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong>Location:</strong> {game.location}
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">Game details not available</p>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Request Details</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        <strong>Requested:</strong> {formatDate(pendingGuest.guest.requestedAt)}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleApproval(
                            pendingGuest.gameId,
                            pendingGuest.hostUserId,
                            pendingGuest.guest.name,
                            'APPROVED'
                          )}
                          disabled={isProcessing}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processing...' : 'Approve'}
                        </button>
                        
                        <button
                          onClick={() => setShowRejectionModal(processingKey)}
                          disabled={isProcessing}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Modal */}
                  {showModal && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Rejection Reason</h4>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection (optional)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                      />
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleApproval(
                            pendingGuest.gameId,
                            pendingGuest.hostUserId,
                            pendingGuest.guest.name,
                            'REJECTED'
                          )}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectionModal(null);
                            setRejectionReason('');
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 