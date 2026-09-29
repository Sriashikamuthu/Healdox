import { useState, useEffect } from 'react';
import { X, AlertTriangle, User, Search } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface PediatricConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: {
    id: string;
    full_name: string;
    date_of_birth: string;
    gender: string;
    allergies: string[];
    chronic_conditions: string[];
  };
  onSuccess: () => void;
}

interface Pediatrician {
  id: string;
  username: string;
  full_name: string;
  specialty?: string;
  institution?: string;
}

export function PediatricConsultationRequestModal({
  isOpen,
  onClose,
  child,
  onSuccess,
}: PediatricConsultationRequestModalProps) {
  const { user } = useAuth();
  const [pediatricians, setPediatricians] = useState<Pediatrician[]>([]);
  const [selectedPediatrician, setSelectedPediatrician] = useState<Pediatrician | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    request_type: 'illness',
    urgency_level: 'routine',
    symptoms_summary: '',
    parent_concerns: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchPediatricians();
    }
  }, [isOpen]);

  const fetchPediatricians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, specialty, institution')
        .eq('role', 'physician')
        .eq('is_verified', true)
        .ilike('specialty', '%pediatric%')
        .order('full_name');

      if (error) throw error;
      setPediatricians(data || []);
    } catch (error) {
      console.error('Error fetching pediatricians:', error);
    }
  };

  const filteredPediatricians = pediatricians.filter(
    (ped) =>
      ped.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ped.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ped.institution?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPediatrician) {
      setError('Please select a pediatrician');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('dependent_consultation_requests')
        .insert({
          dependent_id: child.id,
          parent_id: user?.id,
          physician_id: selectedPediatrician.id,
          request_type: formData.request_type,
          urgency_level: formData.urgency_level,
          symptoms_summary: formData.symptoms_summary,
          parent_concerns: formData.parent_concerns || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      onSuccess();
      setStep(1);
      setSelectedPediatrician(null);
      setFormData({
        request_type: 'illness',
        urgency_level: 'routine',
        symptoms_summary: '',
        parent_concerns: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send consultation request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Request Pediatric Consultation</h2>
        <p className="text-gray-600 mb-6">For {child.full_name}</p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-bold mb-1">IMPORTANT DISCLAIMER</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This is for advisory purposes only</li>
                <li>Always consult your child's primary care physician before making decisions</li>
                <li>In case of emergency, call 911 or visit the nearest emergency room</li>
                <li>This does not replace in-person medical examination</li>
              </ul>
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for Pediatrician
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, specialty, or institution..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredPediatricians.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No pediatricians found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPediatricians.map((ped) => (
                  <button
                    key={ped.id}
                    onClick={() => {
                      setSelectedPediatrician(ped);
                      setStep(2);
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Dr. {ped.full_name || ped.username}
                        </p>
                        {ped.specialty && (
                          <p className="text-sm text-gray-600">{ped.specialty}</p>
                        )}
                        {ped.institution && (
                          <p className="text-xs text-gray-500">{ped.institution}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedPediatrician && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Selected Pediatrician</p>
                <p className="font-semibold text-gray-900">
                  Dr. {selectedPediatrician.full_name || selectedPediatrician.username}
                </p>
                {selectedPediatrician.specialty && (
                  <p className="text-sm text-gray-600">{selectedPediatrician.specialty}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type *
                </label>
                <select
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="general_checkup">General Checkup</option>
                  <option value="illness">Illness</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="emergency">Emergency</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level *
                </label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>

            {child.allergies.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900 mb-1">Known Allergies:</p>
                <p className="text-sm text-red-800">{child.allergies.join(', ')}</p>
              </div>
            )}

            {child.chronic_conditions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900 mb-1">Chronic Conditions:</p>
                <p className="text-sm text-yellow-800">{child.chronic_conditions.join(', ')}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symptoms Summary *
              </label>
              <textarea
                value={formData.symptoms_summary}
                onChange={(e) => setFormData({ ...formData, symptoms_summary: e.target.value })}
                rows={5}
                placeholder="Please describe your child's symptoms in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Concerns (Optional)
              </label>
              <textarea
                value={formData.parent_concerns}
                onChange={(e) => setFormData({ ...formData, parent_concerns: e.target.value })}
                rows={3}
                placeholder="Any specific concerns or questions you have..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedPediatrician(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back
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
