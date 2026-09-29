import { useState, useEffect } from 'react';
import { Calendar, MessageSquare, FileText, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { PhysicianCounselling } from './PhysicianCounselling';
import { AIHealthcareSearch } from './AIHealthcareSearch';

interface ConsultationRequest {
  id: string;
  member: {
    username: string;
    full_name: string;
  };
  message: string;
  status: string;
  created_at: string;
  journey?: {
    title: string;
    condition: string;
  };
}

export function PhysicianDashboard() {
  const { profile } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'completed'>('pending');
  const [dashboardView, setDashboardView] = useState<'consultations' | 'counselling'>('consultations');

  useEffect(() => {
    if (profile?.id) {
      fetchConsultations();
    }
  }, [profile?.id, activeTab]);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select(`
          id,
          message,
          status,
          created_at,
          member:member_id (
            username,
            full_name
          ),
          journey:journey_id (
            title,
            condition
          )
        `)
        .eq('professional_id', profile?.id)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsultationStatus = async (consultationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultation_requests')
        .update({ status: newStatus })
        .eq('id', consultationId);

      if (error) throw error;
      fetchConsultations();
    } catch (error) {
      console.error('Error updating consultation:', error);
    }
  };

  if (!profile?.is_verified) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-yellow-900 mb-2">Account Verification Pending</h2>
          <p className="text-yellow-800">
            Your physician account is currently under review. You'll be able to access the physician dashboard once your credentials are verified within 48 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-bold mb-1">IMPORTANT DISCLAIMER</p>
            <p>
              This platform is for second opinions and general health advice only. All consultations are advisory in nature.
              Members should always consult their Primary Care Physician (PCP) for medical decisions. Taking medications or
              treatments recommended by Healdox physicians is at the member's own risk. This does not constitute a
              doctor-patient relationship for treatment purposes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Physician Dashboard</h1>
            <p className="text-gray-600">Welcome back, Dr. {user?.fullName}</p>
          </div>
          <a
            href="/physician-services"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Manage Services
          </a>
          <div className="text-right">
            <p className="text-sm text-gray-600">Specialty</p>
            <p className="font-medium text-gray-900">{profile?.specialty}</p>
            {profile?.medicine_system && (
              <>
                <p className="text-sm text-gray-600 mt-2">System</p>
                <p className="font-medium text-gray-900">
                  {profile.medicine_system.charAt(0).toUpperCase() + profile.medicine_system.slice(1)}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">Pending</p>
                <p className="text-2xl font-bold text-blue-900">
                  {consultations.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {consultations.filter(c => c.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {consultations.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setDashboardView('consultations')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            dashboardView === 'consultations'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-5 h-5 inline-block mr-2" />
          Consultations
        </button>
        <button
          onClick={() => setDashboardView('counselling')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            dashboardView === 'counselling'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-5 h-5 inline-block mr-2" />
          Counselling Sessions
        </button>
      </div>

      {dashboardView === 'counselling' ? (
        <PhysicianCounselling />
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'accepted'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Consultations
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading consultations...</div>
          ) : consultations.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No {activeTab} consultations at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {consultation.patient?.full_name || consultation.patient?.username}
                        </p>
                        {consultation.journey && (
                          <p className="text-sm text-gray-600">
                            Re: {consultation.journey.title} ({consultation.journey.condition})
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(consultation.created_at).toLocaleDateString()} at{' '}
                          {new Date(consultation.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {activeTab === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateConsultationStatus(consultation.id, 'accepted')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateConsultationStatus(consultation.id, 'declined')}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {activeTab === 'accepted' && (
                      <button
                        onClick={() => updateConsultationStatus(consultation.id, 'completed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-700">{consultation.message}</p>
                  </div>
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                    <p className="text-xs text-yellow-800">
                      <span className="font-semibold">Reminder:</span> This is advisory only.
                      Patient should consult their PCP for medical decisions.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
        </div>

        <div className="lg:col-span-2">
          <AIHealthcareSearch />
        </div>
      </div>
    </div>
  );
}
