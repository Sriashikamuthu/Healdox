import React, { useState } from 'react';
import { X, FileText, Send } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface RequestMedicalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export function RequestMedicalRecordsModal({
  isOpen,
  onClose,
  patientId,
  patientName,
}: RequestMedicalRecordsModalProps) {
  const { user, profile } = useAuth();
  const [requestReason, setRequestReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requestReason.trim()) {
      setError('Please provide a reason for requesting medical records');
      return;
    }

    if (!user || !profile) {
      setError('You must be logged in to request medical records');
      return;
    }

    if (!profile.is_verified) {
      setError('Your account must be verified before requesting medical records');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('medical_record_requests')
        .insert({
          patient_id: patientId,
          requester_id: user.id,
          requester_role: profile.role,
          request_reason: requestReason,
          status: 'pending',
        });

      if (insertError) throw insertError;

      alert('Medical record request sent successfully');
      setRequestReason('');
      onClose();
    } catch (err: any) {
      console.error('Error sending request:', err);
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Request Medical Records</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              You are requesting medical records from: <strong>{patientName}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-2">
              The patient will be notified and can choose to approve or reject your request.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Request <span className="text-red-500">*</span>
            </label>
            <textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              rows={6}
              placeholder="Please provide a detailed reason for requesting these medical records. Include information about:
- Purpose of the request
- How the records will be used
- What specific information you need
- Expected timeline"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Be specific and professional. This will help the patient make an informed decision.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-medium mb-2">Important Notice:</p>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>Patient data must be used only for the stated purpose</li>
              <li>All data handling must comply with healthcare privacy regulations</li>
              <li>The platform is not responsible for how you use the shared data</li>
              <li>Unauthorized use or data breach may result in account suspension</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              {loading ? 'Sending Request...' : 'Send Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
