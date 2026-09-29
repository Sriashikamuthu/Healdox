import { useState } from 'react';
import { X, AlertTriangle, Calendar } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface CounsellingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  physicianId: string;
  physicianName: string;
  physicianSpecialty: string;
}

export function CounsellingRequestModal({
  isOpen,
  onClose,
  physicianId,
  physicianName,
  physicianSpecialty,
}: CounsellingRequestModalProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !description.trim()) {
      setError('Please provide topic and description for the counselling session');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: sessionError } = await supabase
        .from('counselling_sessions')
        .insert({
          member_id: user?.id,
          physician_id: physicianId,
          topic,
          description,
          preferred_date: preferredDate || null,
          preferred_time: preferredTime,
          status: 'pending',
        });

      if (sessionError) throw sessionError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setTopic('');
        setDescription('');
        setPreferredDate('');
        setPreferredTime('morning');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to request counselling session');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Request Counselling Session</h2>
        <p className="text-gray-600 mb-4">
          Dr. {physicianName} - {physicianSpecialty}
        </p>

        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-bold mb-1">IMPORTANT COUNSELLING DISCLAIMER</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This counselling is for guidance and emotional support only</li>
                <li>Not a substitute for professional mental health treatment or emergency services</li>
                <li>Always consult your Primary Care Physician (PCP) for medical decisions</li>
                <li>In case of mental health emergency, call emergency services or crisis hotline</li>
                <li>Taking advice from Healdox counselling is at your own discretion and risk</li>
              </ul>
            </div>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-900 mb-2">Counselling Request Sent!</h3>
            <p className="text-green-800">
              Dr. {physicianName} will review your request and schedule a session with you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Counselling Topic *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Anxiety, Stress Management, Chronic Illness Coping"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please describe what you'd like to discuss in the counselling session..."
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date (Optional)
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                  <option value="evening">Evening (4 PM - 8 PM)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Note:</span> The physician will review your request and confirm the
                actual session date and time. You'll be notified once the session is scheduled.
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
                {loading ? 'Sending...' : 'Request Session'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
