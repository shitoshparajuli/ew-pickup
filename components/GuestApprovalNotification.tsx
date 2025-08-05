'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPendingGuestApprovals } from '@/lib/ddb/game-participants';
import Link from 'next/link';
import { Bell, X } from 'lucide-react';

export default function GuestApprovalNotification() {
  const { isAdmin } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        setLoading(true);
        const pendingGuests = await getPendingGuestApprovals({ checkGameStatus: true, includeAllGames: false });
        setPendingCount(pendingGuests.length);
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin || !isVisible || pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Guest Approvals Pending
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              {pendingCount} guest{pendingCount !== 1 ? 's' : ''} waiting for approval in upcoming games
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-yellow-400 hover:text-yellow-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3">
        <Link
          href="/admin/guest-approvals"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          Review Approvals
        </Link>
      </div>
    </div>
  );
} 