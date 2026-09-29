import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { MedicalRecordRequest, MedicalRecordShare } from '../types/database';
import { FileText, Download, Clock, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';

export function ProviderMedicalRecords() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MedicalRecordRequest[]>([]);
  const [sharedRecords, setSharedRecords] = useState<MedicalRecordShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'records'>('requests');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('medical_record_requests')
        .select(`
          *,
          patient_profile:profiles!medical_record_requests_patient_id_fkey(*)
        `)
        .eq('requester_id', user.id)
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_record_shares')
        .select(`
          *,
          patient_profile:profiles!medical_record_shares_patient_id_fkey(*)
        `)
        .eq('recipient_id', user.id)
        .order('shared_at', { ascending: false });

      if (recordsError) throw recordsError;

      setRequests(requestsData || []);
      setSharedRecords(recordsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(record: MedicalRecordShare) {
    try {
      const { error } = await supabase
        .from('medical_record_shares')
        .update({
          download_count: record.download_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (error) throw error;

      window.open(record.record_url, '_blank');
      loadData();
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const activeRecords = sharedRecords.filter(r => !r.access_expires_at || new Date(r.access_expires_at) > new Date());

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Medical Records Access</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Requests</p>
                <p className="text-2xl font-bold text-yellow-800">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-800">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Records</p>
                <p className="text-2xl font-bold text-blue-800">{activeRecords.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'records'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Shared Records ({sharedRecords.length})
          </button>
        </div>
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No medical record requests yet</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {request.patient_user?.fullName || request.patient_user?.username}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Requested {formatDistanceToNow(request.requested_at)} ago
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 font-medium mb-2">Your Request:</p>
                  <p className="text-gray-800">{request.request_reason}</p>
                </div>

                {request.patient_response_notes && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-600 font-medium mb-2">Patient's Response:</p>
                    <p className="text-gray-800">{request.patient_response_notes}</p>
                  </div>
                )}

                {request.status === 'approved' && request.expires_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Access expires on {new Date(request.expires_at).toLocaleDateString()}</span>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm font-medium">Waiting for patient response</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          {sharedRecords.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No shared records yet</p>
            </div>
          ) : (
            sharedRecords.map((record) => {
              const isExpired = record.access_expires_at && new Date(record.access_expires_at) < new Date();

              return (
                <div key={record.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{record.record_name}</h3>
                          <p className="text-sm text-gray-600">
                            From: {record.patient_user?.fullName || record.patient_user?.username}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {record.record_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span>Shared {formatDistanceToNow(record.shared_at)} ago</span>
                        <span>Downloaded {record.download_count} times</span>
                      </div>

                      {record.access_expires_at && (
                        <div className={`flex items-center gap-2 mt-2 text-sm ${
                          isExpired ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            {isExpired
                              ? 'Access expired on'
                              : 'Access expires on'
                            } {new Date(record.access_expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {!isExpired && (
                      <button
                        onClick={() => handleDownload(record)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
