import { useState, useEffect } from 'react';
import { Calendar, Clock, User, MessageSquare, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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
  physician: {
    full_name: string;
    specialty: string;
    medicine_system: string;
  };
}

export function PatientCounsellingSessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<CounsellingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled' | 'completed'>('pending');

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
          physician:physician_id (
            full_name,
            specialty,
            medicine_system
          )
        `)
        .eq('member_id', profile?.id)
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

  const cancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this counselling session?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('counselling_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId);

      if (error) throw error;
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'scheduled':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Counselling Sessions</h2>
          <p className="text-sm text-gray-600">Manage your counselling appointments</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Reminder:</span> Counselling sessions are for guidance only.
            Always consult your PCP for medical decisions. In emergencies, call emergency services.
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
            Pending
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
                    {getStatusIcon(session.status)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{session.topic}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <User className="w-4 h-4" />
                      <span>Dr. {session.physician?.full_name} - {session.physician?.specialty}</span>
                    </div>
                    {session.physician?.medicine_system && (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded mt-1">
                        {session.physician.medicine_system.charAt(0).toUpperCase() + session.physician.medicine_system.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
                {(activeTab === 'pending' || activeTab === 'scheduled') && (
                  <button
                    onClick={() => cancelSession(session.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-md p-3 mb-3">
                <p className="text-sm text-gray-700">{session.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
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

              {session.session_notes && (
                <div className="mt-3 bg-blue-50 border-l-4 border-blue-500 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Session Notes</p>
                      <p className="text-sm text-blue-800">{session.session_notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
