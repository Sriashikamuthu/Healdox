import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { PatientDataAccessRequest } from '../types/database';
import { Shield, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';

export function PatientDataAccessManagement() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PatientDataAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PatientDataAccessRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [accessDuration, setAccessDuration] = useState(30);

  useEffect(() => {
    loadAccessRequests();
  }, [user]);

  async function loadAccessRequests() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('patient_data_access_requests')
        .select(`
          *,
          pharma_profile:profiles!pharma_company_id(*)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading access requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRespondToRequest(requestId: string, approved: boolean) {
    if (!user) return;

    try {
      const updates: any = {
        status: approved ? 'approved' : 'rejected',
        responded_at: new Date().toISOString(),
        patient_notes: responseNotes,
      };

      if (approved) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + accessDuration);
        updates.access_expires_at = expiryDate.toISOString();
      }

      const { error } = await supabase
        .from('patient_data_access_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      alert(`Access request ${approved ? 'approved' : 'rejected'} successfully`);
      setSelectedRequest(null);
      setResponseNotes('');
      loadAccessRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Failed to respond to request');
    }
  }

  async function handleRevokeAccess(requestId: string) {
    try {
      const { error } = await supabase
        .from('patient_data_access_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      if (error) throw error;

      alert('Access revoked successfully');
      loadAccessRequests();
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Failed to revoke access');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading access requests...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const otherRequests = requests.filter(r => !['pending', 'approved'].includes(r.status));

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Data Access Management</h2>
            <p className="text-gray-600">Control who can access your medical data</p>
          </div>
        </div>

        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {(request as any).pharma_profile?.company_name || 'Pharmaceutical Company'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {(request as any).pharma_profile?.company_type}
                      </p>
                      <p className="text-sm text-gray-700 mt-3">
                        <span className="font-medium">Reason:</span> {request.request_reason}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Requested on {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        handleRespondToRequest(request.id, false);
                      }}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {approvedRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Active Access ({approvedRequests.length})
            </h3>
            <div className="space-y-3">
              {approvedRequests.map((request) => (
                <div key={request.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {(request as any).pharma_profile?.company_name || 'Pharmaceutical Company'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {(request as any).pharma_profile?.company_type}
                      </p>
                      {request.access_expires_at && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Expires: {new Date(request.access_expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {request.patient_notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Your notes:</span> {request.patient_notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevokeAccess(request.id)}
                      className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Revoke Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Request History</h3>
            <div className="space-y-3">
              {otherRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {(request as any).pharma_profile?.company_name || 'Pharmaceutical Company'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{request.request_reason}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No data access requests yet</p>
          </div>
        )}
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Approve Data Access</h3>
            <p className="text-gray-700 mb-4">
              You are approving access for:{' '}
              <span className="font-semibold">
                {(selectedRequest as any).pharma_profile?.company_name}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Duration (days)
                </label>
                <select
                  value={accessDuration}
                  onChange={(e) => setAccessDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={3}
                  placeholder="Any conditions or notes about this access..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleRespondToRequest(selectedRequest.id, true)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Access
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setResponseNotes('');
                  }}
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
