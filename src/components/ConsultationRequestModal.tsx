import { useState } from 'react';
import { X, AlertTriangle, Upload, FileText } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  physicianId: string;
  physicianName: string;
  physicianSpecialty: string;
}

export function ConsultationRequestModal({
  isOpen,
  onClose,
  physicianId,
  physicianName,
  physicianSpecialty,
}: ConsultationRequestModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState<'advice' | 'second-opinion' | 'televisit'>('advice');
  const [medicalRecords, setMedicalRecords] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.some(f => f.size > 10 * 1024 * 1024)) {
      setError('Files must be less than 10MB each');
      return;
    }
    setMedicalRecords(files);
    setError('');
  };

  const uploadMedicalRecords = async (consultationId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of medicalRecords) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${consultationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data } = supabase.storage
        .from('medical-records')
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!message.trim()) {
    setError('Please provide details about your consultation request');
    return;
  }

  if (!user?.id) {
    setError('Please sign in to send a consultation request');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const response = await fetch(
      "http://localhost:5000/consultation-requests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          member_id: user.id,
          professional_id: physicianId,
          request_type: requestType,
          message: message.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to send consultation request"
      );
    }

    console.log("Consultation request created:", data);

    setSuccess(true);

    setTimeout(() => {
      onClose();
      setSuccess(false);
      setMessage('');
      setMedicalRecords([]);
      setRequestType('advice');
    }, 2000);

  } catch (err: any) {
    console.error("Consultation request error:", err);
    setError(
      err.message || "Failed to send consultation request"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Request Consultation</h2>
        <p className="text-gray-600 mb-4">
          Dr. {physicianName} - {physicianSpecialty}
        </p>

        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-bold mb-1">IMPORTANT MEDICAL DISCLAIMER</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This is for second opinion and advisory purposes only</li>
                <li>Always consult your Primary Care Physician (PCP) before making medical decisions</li>
                <li>This does not establish a formal doctor-patient relationship</li>
                <li>Taking medications or treatments based on Healdox advice is at your own risk</li>
                <li>In case of emergency, call 911 or visit your nearest emergency room</li>
              </ul>
            </div>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-900 mb-2">Request Sent!</h3>
            <p className="text-green-800">
              Dr. {physicianName} will review your consultation request and respond soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Type
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="advice">General Health Advice</option>
                <option value="second-opinion">Second Opinion</option>
                <option value="televisit">Televisit Appointment Request</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your health concern, symptoms, or reason for consultation..."
                required
              />
            </div>

            {requestType === 'second-opinion' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Records (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Upload files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, JPG, PNG, DOC up to 10MB each
                  </p>
                </div>
                {medicalRecords.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {medicalRecords.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Note:</span> Response times vary by physician availability.
                This platform is for advisory purposes only and should not replace in-person medical care.
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
