import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Loader } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface ConnectButtonProps {
  userId: string;
  userName: string;
}

export function ConnectButton({ userId, userName }: ConnectButtonProps) {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'loading'>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id && userId) {
      checkConnectionStatus();
    }
  }, [user?.id, userId]);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(requester_id.eq.${user?.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user?.id})`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConnectionStatus(data.status);
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
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
      const { error } = await supabase
        .from('user_connections')
        .insert({
          requester_id: user.id,
          receiver_id: userId,
          status: 'pending',
        });

      if (error) throw error;

      setConnectionStatus('pending');
      alert(`Connection request sent to ${userName}`);
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted' })
        .eq('requester_id', userId)
        .eq('receiver_id', user?.id);

      if (error) throw error;

      setConnectionStatus('accepted');
      alert(`You are now connected with ${userName}`);
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove connection with ${userName}?`)) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .or(`and(requester_id.eq.${user?.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${user?.id})`);

      if (error) throw error;

      setConnectionStatus('none');
    } catch (error) {
      console.error('Error removing connection:', error);
      alert('Failed to remove connection');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === userId) return null;

  if (loading && connectionStatus === 'loading') {
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
