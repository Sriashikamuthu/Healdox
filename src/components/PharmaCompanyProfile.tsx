import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { Profile, PatientDataAccessRequest, PharmaPhysicianMessage } from '../types/database';
import { Building2, MapPin, Calendar, Send, MessageSquare, Users, Shield, Clock } from 'lucide-react';

export function PharmaCompanyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accessRequests, setAccessRequests] = useState<PatientDataAccessRequest[]>([]);
  const [messages, setMessages] = useState<PharmaPhysicianMessage[]>([]);
  const [physicians, setPhysicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'access' | 'messages'>('profile');

  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedPhysician, setSelectedPhysician] = useState<Profile | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    loadPharmaData();
  }, [user]);

  async function loadPharmaData() {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      const { data: requestsData } = await supabase
        .from('patient_data_access_requests')
        .select(`
          *,
          patient_profile:profiles!patient_id(*)
        `)
        .eq('pharma_company_id', user.id)
        .order('created_at', { ascending: false });

      setAccessRequests(requestsData || []);

      const { data: messagesData } = await supabase
        .from('pharma_physician_messages')
        .select(`
          *,
          physician_profile:profiles!physician_id(*)
        `)
        .eq('pharma_company_id', user.id)
        .order('created_at', { ascending: false });

      setMessages(messagesData || []);

      const { data: physiciansData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'physician')
        .eq('is_verified', true);

      setPhysicians(physiciansData || []);
    } catch (error) {
      console.error('Error loading pharma data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !profile) return;

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: formData.get('company_name'),
          company_registration_number: formData.get('company_registration_number'),
          company_type: formData.get('company_type'),
          headquarters_location: formData.get('headquarters_location'),
          founded_year: parseInt(formData.get('founded_year') as string),
          bio: formData.get('bio'),
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Profile updated successfully');
      loadPharmaData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  }

  async function handleRequestAccess() {
    if (!user || !selectedPatient || !requestReason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('patient_data_access_requests')
        .insert({
          pharma_company_id: user.id,
          patient_id: selectedPatient,
          request_reason: requestReason,
        });

      if (error) throw error;

      alert('Access request sent successfully');
      setShowAccessRequestModal(false);
      setSelectedPatient('');
      setRequestReason('');
      loadPharmaData();
    } catch (error) {
      console.error('Error requesting access:', error);
      alert('Failed to send access request');
    }
  }

  async function handleSendMessage() {
    if (!user || !selectedPhysician || !messageContent) {
      alert('Please fill in all fields');
      return;
    }

    const threadId = `${user.id}-${selectedPhysician.id}`;

    try {
      const { error } = await supabase
        .from('pharma_physician_messages')
        .insert({
          pharma_company_id: user.id,
          physician_id: selectedPhysician.id,
          thread_id: threadId,
          sender_id: user.id,
          message_content: messageContent,
        });

      if (error) throw error;

      alert('Message sent successfully');
      setShowMessageModal(false);
      setSelectedPhysician(null);
      setMessageContent('');
      loadPharmaData();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {profile?.company_name || 'Pharmaceutical Company'}
            </h2>
            <p className="text-gray-600">{profile?.company_type || 'Company Profile'}</p>
          </div>
        </div>

        <div className="flex gap-2 border-b mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'access'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Access Requests ({accessRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'messages'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Messages ({messages.length})
          </button>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  defaultValue={profile?.company_name || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="company_registration_number"
                  defaultValue={profile?.company_registration_number || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Type
                </label>
                <select
                  name="company_type"
                  defaultValue={profile?.company_type || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select type</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="distributor">Distributor</option>
                  <option value="research">Research & Development</option>
                  <option value="biotech">Biotechnology</option>
                  <option value="generic">Generic Medicines</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Founded Year
                </label>
                <input
                  type="number"
                  name="founded_year"
                  defaultValue={profile?.founded_year || ''}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headquarters Location
                </label>
                <input
                  type="text"
                  name="headquarters_location"
                  defaultValue={profile?.headquarters_location || ''}
                  placeholder="City, Country"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                <textarea
                  name="bio"
                  defaultValue={profile?.bio || ''}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your company..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Update Profile
            </button>
          </form>
        )}

        {activeTab === 'access' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Patient Data Access Requests</h3>
              <button
                onClick={() => setShowAccessRequestModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Request Access
              </button>
            </div>

            <div className="space-y-3">
              {accessRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No access requests yet</p>
              ) : (
                accessRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          Patient: {(request as any).patient_user?.username}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{request.request_reason}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(request.requested_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : request.status === 'expired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    {request.patient_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Patient notes:</span> {request.patient_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Physician Messages</h3>
              <button
                onClick={() => setShowMessageModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                New Message
              </button>
            </div>

            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          Dr. {(message as any).physician_user?.fullName}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{message.message_content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!message.is_read && message.sender_id !== user?.id && (
                        <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showAccessRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Request Patient Data Access</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID
                </label>
                <input
                  type="text"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  placeholder="Enter patient ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Access
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why you need access to this patient's data..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestAccess}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Request
                </button>
                <button
                  onClick={() => setShowAccessRequestModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Send Message to Physician</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Physician
                </label>
                <select
                  value={selectedPhysician?.id || ''}
                  onChange={(e) => {
                    const physician = physicians.find(p => p.id === e.target.value);
                    setSelectedPhysician(physician || null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a physician</option>
                  {physicians.map((physician) => (
                    <option key={physician.id} value={physician.id}>
                      Dr. {physician.full_name} - {physician.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  placeholder="Write your message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendMessage}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
