import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Loader } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface ConnectButtonProps {
  userId: string;
  userName: string;
}

export function ConnectButton({ userId, userName }: ConnectButtonProps) {
  const { user } = useAuth();

  const [connectionStatus, setConnectionStatus] = useState<
    'none' | 'pending' | 'accepted' | 'loading'
  >('none');

  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && userId) {
      checkConnectionStatus();
    }
  }, [user?.id, userId]);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/connections/status/${user?.id}/${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to check connection status');
      }

      const data = await response.json();

      setConnectionStatus(data.status || 'none');
      setConnectionId(data.connection_id || null);
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('none');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user?.id) {
      alert('Please sign in to connect with users');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:5000/connection/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender_id: user.id,
            receiver_id: userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send connection request');
      }

      setConnectionStatus('pending');

      alert(`Connection request sent to ${userName}`);
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      alert(error.message || 'Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
  if (!connectionId) {
    alert('Connection not found');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      'http://localhost:5000/connections/accept',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_id: connectionId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to accept connection');
    }

    setConnectionStatus('accepted');

    alert(`You are now connected with ${userName}`);
  } catch (error: any) {
    console.error('Error accepting connection:', error);
    alert(error.message || 'Failed to accept connection');
  } finally {
    setLoading(false);
  }
};

  const handleRemove = async () => {
  if (!connectionId) {
    alert('Connection not found');
    return;
  }

  if (!confirm(`Remove connection with ${userName}?`)) {
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `http://localhost:5000/connections/remove/${connectionId}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove connection');
    }

    setConnectionStatus('none');
    setConnectionId(null);

  } catch (error: any) {
    console.error('Error removing connection:', error);
    alert(error.message || 'Failed to remove connection');
  } finally {
    setLoading(false);
  }
};
  if (!user || user.id === userId) {
    return null;
  }

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed"
      >
        <Loader className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  if (connectionStatus === 'accepted') {
    return (
      <button
        onClick={handleRemove}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
      >
        <UserCheck className="w-4 h-4" />
        <span>Connected</span>
      </button>
    );
  }

  if (connectionStatus === 'pending') {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md cursor-not-allowed"
        >
          <UserX className="w-4 h-4" />
          <span>Pending</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      <UserPlus className="w-4 h-4" />
      <span>Connect</span>
    </button>
  );
}