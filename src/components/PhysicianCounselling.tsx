import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface CounsellingSession {
  id: string;
  topic: string;
  description: string;
  status: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string;
  session_notes: string;
  created_at: string;
  member: {
    full_name: string;
    username: string;
  };
}

export function PhysicianCounselling() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled' | 'completed'>('pending');
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchSessions();
    }
  }, [profile?.id, activeTab]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('counselling_sessions')
        .select(`
          id,
          topic,
          description,
          status,
          preferred_date,
          preferred_time,
          scheduled_date,
          session_notes,
          created_at,
          member:member_id (
            full_name,
            username
          )
        `)
        .eq('physician_id', profile?.id)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching counselling sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleSession = async (sessionId: string) => {
    if (!scheduledDate) {
      alert('Please select a date and time for the session');
      return;
    }

    try {
      const { error } = await supabase
        .from('counselling_sessions')
        .update({
          status: 'scheduled',
          scheduled_date: scheduledDate,
        })
        .eq('id', sessionId);

      if (error) throw error;
      setEditingSession(null);
      setScheduledDate('');
      fetchSessions();
    } catch (error) {
      console.error('Error scheduling session:', error);
    }
  };

  const completeSession = async (sessionId: string) => {
    if (!sessionNotes.trim()) {
      alert('Please add session notes before completing');
      return;
    }

    try {
      const { error } = await supabase
        .from('counselling_sessions')
        .update({
          status: 'completed',
          session_notes: sessionNotes,
        })
        .eq('id', sessionId);

      if (error) throw error;
      setEditingSession(null);
      setSessionNotes('');
      fetchSessions();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const updateSessionNotes = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('counselling_sessions')
        .update({ session_notes: sessionNotes })
        .eq('id', sessionId);

      if (error) throw error;
      setEditingSession(null);
      setSessionNotes('');
      fetchSessions();
    } catch (error) {
      console.error('Error updating session notes:', error);
    }
  };

  const startEditing = (sessionId: string, notes: string = '') => {
    setEditingSession(sessionId);
    setSessionNotes(notes);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Counselling Sessions</h2>
          <p className="text-sm text-gray-600">Manage your counselling appointments with members</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            <span className="font-semibold">Reminder:</span> Counselling is advisory only. Always advise members
            to consult their PCP for medical decisions. Document all sessions appropriately.
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'scheduled'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No {activeTab} counselling sessions.
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{session.topic}</h3>
                    <p className="text-sm text-gray-600">
                      Member: {session.member?.full_name || session.member?.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-3 mb-3">
                <p className="text-sm text-gray-700">{session.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                {session.preferred_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Preferred: {new Date(session.preferred_date).toLocaleDateString()}</span>
                  </div>
                )}
                {session.preferred_time && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="capitalize">{session.preferred_time}</span>
                  </div>
                )}
                {session.scheduled_date && (
                  <div className="flex items-center gap-2 text-green-700 font-medium md:col-span-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Scheduled: {new Date(session.scheduled_date).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {activeTab === 'pending' && (
                <div className="border-t pt-3">
                  {editingSession === session.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Schedule Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => scheduleSession(session.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Confirm Schedule
                        </button>
                        <button
                          onClick={() => {
                            setEditingSession(null);
                            setScheduledDate('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(session.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Schedule Session
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'scheduled' && (
                <div className="border-t pt-3">
                  {editingSession === session.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Session Notes
                        </label>
                        <textarea
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter notes about the counselling session..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => completeSession(session.id)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Complete Session
                        </button>
                        <button
                          onClick={() => {
                            setEditingSession(null);
                            setSessionNotes('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(session.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Notes & Complete
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'completed' && session.session_notes && (
                <div className="border-t pt-3">
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-1">Session Notes</p>
                        <p className="text-sm text-blue-800">{session.session_notes}</p>
                      </div>
                      <button
                        onClick={() => startEditing(session.id, session.session_notes)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  {editingSession === session.id && (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSessionNotes(session.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Update Notes
                        </button>
                        <button
                          onClick={() => {
                            setEditingSession(null);
                            setSessionNotes('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
