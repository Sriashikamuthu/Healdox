import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from '../utils/date';

interface ConsultationRequest {
  id: string;
  member_id: string;
  professional_id: string;
  message: string;
  status: string;
  request_type?: string;
  urgency_level?: string;
  provider_response?: string;
  response_date?: string;
  created_at: string;
  provider?: {
    id: string;
    username: string;
    full_name: string;
    specialty?: string;
  };
}

interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  appointment_type: string;
  title: string;
  description?: string;
  scheduled_date: string;
  duration_minutes: number;
  location: string;
  meeting_link?: string;
  status: string;
  patient_notes?: string;
  provider_notes?: string;
  created_at: string;
  provider?: {
    id: string;
    username: string;
    full_name: string;
    specialty?: string;
  };
}

type TabType = 'requests' | 'approved' | 'upcoming' | 'history';

export function PatientAppointments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConsultationRequests();
      fetchAppointments();
    }
  }, [user]);

  const fetchConsultationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select(`
          *,
          provider:profiles!consultation_requests_professional_id_fkey(
            id,
            username,
            full_name,
            specialty
          )
        `)
        .eq('member_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultationRequests(data || []);
    } catch (error) {
      console.error('Error fetching consultation requests:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          provider:profiles!appointments_provider_id_fkey(
            id,
            username,
            full_name,
            specialty
          )
        `)
        .eq('patient_id', user?.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const pendingRequests = consultationRequests.filter(r => r.status === 'pending');
  const approvedRequests = consultationRequests.filter(r => r.status === 'accepted');

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    a => ['scheduled', 'confirmed'].includes(a.status) && new Date(a.scheduled_date) > now
  );

  const pastAppointments = appointments.filter(
    a => ['completed', 'cancelled', 'no_show'].includes(a.status) ||
    (new Date(a.scheduled_date) < now && !['completed', 'cancelled', 'no_show'].includes(a.status))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6">My Appointments</h2>

        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests Sent
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'approved'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved
            {approvedRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                {approvedRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'upcoming'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upcoming
            {upcomingAppointments.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                {upcomingAppointments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            History
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'requests' && (
            <>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending consultation requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Dr. {request.provider?.full_name || request.provider?.username}
                          </p>
                          {request.provider?.specialty && (
                            <p className="text-sm text-gray-600">{request.provider.specialty}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-gray-700 mb-2 line-clamp-2">{request.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(request.created_at)}
                      </span>
                      {request.request_type && (
                        <span className="capitalize">{request.request_type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'approved' && (
            <>
              {approvedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No approved consultation requests</p>
                </div>
              ) : (
                approvedRequests.map((request) => (
                  <div key={request.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Dr. {request.provider?.full_name || request.provider?.username}
                          </p>
                          {request.provider?.specialty && (
                            <p className="text-sm text-gray-600">{request.provider.specialty}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.provider_response && (
                      <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Provider Response:</p>
                        <p className="text-sm text-gray-900">{request.provider_response}</p>
                      </div>
                    )}
                    <p className="text-gray-700 mb-2 line-clamp-2">{request.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(request.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'upcoming' && (
            <>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming appointments</p>
                </div>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Dr. {appointment.provider?.full_name || appointment.provider?.username}
                          </p>
                          {appointment.provider?.specialty && (
                            <p className="text-sm text-gray-600">{appointment.provider.specialty}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{appointment.title}</h3>
                    {appointment.description && (
                      <p className="text-sm text-gray-700 mb-3">{appointment.description}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>{new Date(appointment.scheduled_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{new Date(appointment.scheduled_date).toLocaleTimeString()} ({appointment.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        {appointment.location === 'Online' ? (
                          <>
                            <Video className="w-4 h-4 text-blue-600" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{appointment.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {appointment.meeting_link && (
                      <a
                        href={appointment.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting
                      </a>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {pastAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No appointment history</p>
                </div>
              ) : (
                pastAppointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Dr. {appointment.provider?.full_name || appointment.provider?.username}
                          </p>
                          {appointment.provider?.specialty && (
                            <p className="text-sm text-gray-600">{appointment.provider.specialty}</p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{appointment.title}</h3>
                    {appointment.description && (
                      <p className="text-sm text-gray-700 mb-3">{appointment.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.scheduled_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.duration_minutes} min
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
