import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { MedicalRecordRequest, MedicalRecordShare } from '../types/database';
import { FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle, Download, Shield } from 'lucide-react';
import { formatDistanceToNow } from '../utils/date';

export function PatientMedicalRecordRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MedicalRecordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MedicalRecordRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recordType, setRecordType] = useState<'lab_report' | 'prescription' | 'imaging' | 'diagnosis' | 'consultation' | 'other'>('other');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [user]);

  async function loadRequests() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medical_record_requests')
        .select(`
          *,
          requester_profile:profiles!medical_record_requests_requester_id_fkey(*)
        `)
        .eq('patient_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(requestId: string) {
    if (!confirm('Are you sure you want to reject this request?')) return;

    try {
      const { error } = await supabase
        .from('medical_record_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
          patient_response_notes: responseNotes || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      alert('Request rejected successfully');
      setSelectedRequest(null);
      setResponseNotes('');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  }

  async function handleApproveAndShare() {
    if (!selectedRequest || selectedFiles.length === 0) {
      alert('Please select at least one file to share');
      return;
    }

    setUploading(true);

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const { error: updateError } = await supabase
        .from('medical_record_requests')
        .update({
          status: 'approved',
          responded_at: new Date().toISOString(),
          expires_at: expiryDate.toISOString(),
          patient_response_notes: responseNotes || null,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${selectedRequest.requester_id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('medical-records')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('medical-records')
          .getPublicUrl(fileName);

        const { error: shareError } = await supabase
          .from('medical_record_shares')
          .insert({
            request_id: selectedRequest.id,
            patient_id: user!.id,
            recipient_id: selectedRequest.requester_id,
            record_name: file.name,
            record_url: urlData.publicUrl,
            record_type: recordType,
            access_expires_at: expiryDate.toISOString(),
          });

        if (shareError) throw shareError;
      }

      alert('Medical records shared successfully');
      setSelectedRequest(null);
      setSelectedFiles([]);
      setResponseNotes('');
      loadRequests();
    } catch (error) {
      console.error('Error sharing records:', error);
      alert('Failed to share records');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading requests...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Medical Record Requests</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <Shield className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Important Notice</h3>
              <p className="text-sm text-yellow-800 mb-2">
                This platform provides a secure mechanism for sharing your medical records with healthcare providers.
                However, please note:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>The platform is not responsible for how recipients use your shared data</li>
                <li>You can set expiration dates and revoke access at any time</li>
                <li>Only share records with trusted healthcare providers</li>
                <li>All access is logged for your security</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
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

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-800">{rejectedRequests.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </div>
      </div>

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
                      {request.requester_user?.fullName || request.requester_user?.username}
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
                  <p className="text-sm text-gray-600 mb-1">
                    Role: <span className="font-medium">{request.requester_role}</span>
                  </p>
                  {request.requester_profile?.specialty && (
                    <p className="text-sm text-gray-600 mb-1">
                      Specialty: <span className="font-medium">{request.requester_profile.specialty}</span>
                    </p>
                  )}
                  {request.requester_profile?.institution && (
                    <p className="text-sm text-gray-600 mb-1">
                      Institution: <span className="font-medium">{request.requester_profile.institution}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Requested {formatDistanceToNow(request.requested_at)} ago
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Reason for Request:</p>
                <p className="text-gray-800">{request.request_reason}</p>
              </div>

              {request.patient_response_notes && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-600 font-medium mb-2">Your Response:</p>
                  <p className="text-gray-800">{request.patient_response_notes}</p>
                </div>
              )}

              {request.status === 'approved' && request.expires_at && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <span>Access expires on {new Date(request.expires_at).toLocaleDateString()}</span>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Approve & Share Records
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setTimeout(() => handleReject(request.id), 100);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedRequest && selectedRequest.status === 'pending' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Share Medical Records</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  You're sharing records with: <strong>{selectedRequest.requester_user?.fullName}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Type
                </label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="lab_report">Lab Report</option>
                  <option value="prescription">Prescription</option>
                  <option value="imaging">Imaging (X-ray, MRI, CT)</option>
                  <option value="diagnosis">Diagnosis Report</option>
                  <option value="consultation">Consultation Notes</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Medical Records
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-700 list-disc list-inside">
                      {selectedFiles.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Expiry (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Records will be accessible until {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApproveAndShare}
                  disabled={uploading || selectedFiles.length === 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Share Records'}
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setSelectedFiles([]);
                    setResponseNotes('');
                  }}
                  disabled={uploading}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:cursor-not-allowed"
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
