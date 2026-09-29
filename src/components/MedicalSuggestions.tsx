import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Pill, Utensils, Activity, Heart, Calendar, MessageSquare, X } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from '../utils/date';

interface MedicalSuggestion {
  id: string;
  physician_id: string;
  suggestion_type: string;
  title: string;
  description: string;
  medications: any[];
  diet_plan: string | null;
  exercise_plan: string | null;
  lifestyle_changes: string | null;
  follow_up_date: string | null;
  urgency_level: string;
  patient_acknowledged: boolean;
  patient_acknowledged_at: string | null;
  patient_accepted_risk: boolean;
  patient_notes: string | null;
  status: string;
  created_at: string;
  physician: {
    full_name: string;
    username: string;
    specialty: string;
    license_number: string;
  };
}

export function MedicalSuggestions() {
  const { profile } = useAuth();
  const [suggestions, setSuggestions] = useState<MedicalSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MedicalSuggestion | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [patientNotes, setPatientNotes] = useState('');
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [acceptedRisk, setAcceptedRisk] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchSuggestions();
    }
  }, [profile?.id]);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_suggestions')
        .select(`
          *,
          physician:physician_id (
            full_name,
            username,
            specialty,
            license_number
          )
        `)
        .eq('patient_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSuggestion = (suggestion: MedicalSuggestion) => {
    setSelectedSuggestion(suggestion);
    setPatientNotes(suggestion.patient_notes || '');

    if (!suggestion.patient_acknowledged) {
      setShowConsentModal(true);
      setHasReadDisclaimer(false);
      setAcceptedRisk(false);
    }
  };

  const acknowledgeAndAccept = async () => {
    if (!hasReadDisclaimer || !acceptedRisk) {
      alert('Please read and accept all disclaimers before proceeding');
      return;
    }

    if (!selectedSuggestion) return;

    try {
      const { error } = await supabase
        .from('medical_suggestions')
        .update({
          patient_acknowledged: true,
          patient_acknowledged_at: new Date().toISOString(),
          patient_accepted_risk: true,
          status: 'acknowledged',
        })
        .eq('id', selectedSuggestion.id);

      if (error) throw error;

      setShowConsentModal(false);
      fetchSuggestions();
    } catch (error) {
      console.error('Error acknowledging suggestion:', error);
      alert('Failed to acknowledge suggestion');
    }
  };

  const updatePatientNotes = async () => {
    if (!selectedSuggestion) return;

    try {
      const { error } = await supabase
        .from('medical_suggestions')
        .update({ patient_notes: patientNotes })
        .eq('id', selectedSuggestion.id);

      if (error) throw error;
      alert('Notes saved successfully');
      fetchSuggestions();
    } catch (error) {
      console.error('Error updating notes:', error);
      alert('Failed to save notes');
    }
  };

  const updateStatus = async (suggestionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('medical_suggestions')
        .update({ status: newStatus })
        .eq('id', suggestionId);

      if (error) throw error;
      fetchSuggestions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Suggestions</h1>
        <p className="text-gray-600">View and manage medical suggestions from physicians</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important Health Information</p>
            <p>
              These suggestions are for educational purposes only. ALWAYS validate any medical recommendations
              with your Primary Care Physician before taking any medications, starting exercises, or making
              diet changes. In emergencies, call emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading suggestions...</p>
      ) : suggestions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No medical suggestions yet from physicians.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                suggestion.urgency_level === 'urgent' || suggestion.urgency_level === 'high'
                  ? 'border-red-500'
                  : 'border-blue-500'
              } cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => openSuggestion(suggestion)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{suggestion.title}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getUrgencyColor(suggestion.urgency_level)}`}>
                      {suggestion.urgency_level.toUpperCase()}
                    </span>
                    {suggestion.patient_acknowledged ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Acknowledged
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Review
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    From: <span className="font-semibold">{suggestion.physician.full_name}</span> ({suggestion.physician.specialty})
                  </p>
                  <p className="text-gray-700 line-clamp-2">{suggestion.description}</p>
                </div>
                <p className="text-xs text-gray-500 ml-4">
                  {formatDistanceToNow(suggestion.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {suggestion.medications.length > 0 && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded flex items-center gap-1">
                    <Pill className="w-3 h-3" />
                    {suggestion.medications.length} Medication(s)
                  </span>
                )}
                {suggestion.diet_plan && (
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    Diet Plan
                  </span>
                )}
                {suggestion.exercise_plan && (
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Exercise Plan
                  </span>
                )}
                {suggestion.lifestyle_changes && (
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Lifestyle Changes
                  </span>
                )}
                {suggestion.follow_up_date && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Follow-up: {new Date(suggestion.follow_up_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showConsentModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Medical Disclaimer & Consent</h2>
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setSelectedSuggestion(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-bold mb-2">CRITICAL HEALTH & SAFETY DISCLAIMER</p>
                  <p className="mb-3">Please read this carefully before proceeding:</p>
                  <ul className="list-disc list-inside space-y-2 mb-4">
                    <li>This medical suggestion is for <strong>EDUCATIONAL PURPOSES ONLY</strong></li>
                    <li>This is <strong>NOT</strong> a prescription or formal medical diagnosis</li>
                    <li>You <strong>MUST</strong> validate ALL suggestions with your Primary Care Physician (PCP)</li>
                    <li><strong>NEVER</strong> start any medication without consulting your doctor</li>
                    <li><strong>NEVER</strong> stop current medications without consulting your doctor</li>
                    <li>Exercise and diet changes should be discussed with your healthcare provider</li>
                    <li>The physician providing this suggestion is not liable for any outcomes</li>
                    <li>You assume <strong>ALL RISK</strong> if you follow these suggestions without medical validation</li>
                    <li>In emergencies, call emergency services immediately (911 in US)</li>
                    <li>If you experience adverse effects, seek immediate medical attention</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={hasReadDisclaimer}
                  onChange={(e) => setHasReadDisclaimer(e.target.checked)}
                  className="w-5 h-5 mt-1"
                />
                <span className="text-sm">
                  <strong>I have read and understood the disclaimer above.</strong> I understand that this is educational
                  information only and not medical advice.
                </span>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-red-300 rounded-lg cursor-pointer hover:bg-red-50">
                <input
                  type="checkbox"
                  checked={acceptedRisk}
                  onChange={(e) => setAcceptedRisk(e.target.checked)}
                  className="w-5 h-5 mt-1"
                />
                <span className="text-sm">
                  <strong>I accept full responsibility and risk.</strong> I will validate all suggestions with my
                  Primary Care Physician before taking any action. I understand the physician who provided this
                  suggestion is not liable for any outcomes.
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={acknowledgeAndAccept}
                disabled={!hasReadDisclaimer || !acceptedRisk}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                I Understand - View Suggestion
              </button>
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  setSelectedSuggestion(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSuggestion && !showConsentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSuggestion.title}</h2>
                <p className="text-sm text-gray-600">
                  From: <span className="font-semibold">{selectedSuggestion.physician.full_name}</span> ({selectedSuggestion.physician.specialty})
                  <br />
                  License: {selectedSuggestion.physician.license_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedSuggestion.description}</p>
              </div>

              {selectedSuggestion.medications.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">Medications</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedSuggestion.medications.map((med: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 rounded-lg p-4">
                        <p className="font-semibold text-gray-900">{med.name} - {med.dosage}</p>
                        <p className="text-sm text-gray-700">Frequency: {med.frequency}</p>
                        <p className="text-sm text-gray-700">Duration: {med.duration}</p>
                        {med.notes && <p className="text-sm text-gray-600 italic mt-1">{med.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSuggestion.diet_plan && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-gray-900">Diet Plan</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap bg-green-50 rounded-lg p-4">
                    {selectedSuggestion.diet_plan}
                  </p>
                </div>
              )}

              {selectedSuggestion.exercise_plan && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-gray-900">Exercise Plan</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap bg-orange-50 rounded-lg p-4">
                    {selectedSuggestion.exercise_plan}
                  </p>
                </div>
              )}

              {selectedSuggestion.lifestyle_changes && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-gray-900">Lifestyle Changes</h3>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap bg-red-50 rounded-lg p-4">
                    {selectedSuggestion.lifestyle_changes}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Your Notes & Questions</h3>
                </div>
                <textarea
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add your notes, questions, or feedback..."
                />
                <button
                  onClick={updatePatientNotes}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Save Notes
                </button>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Status</h3>
                <select
                  value={selectedSuggestion.status}
                  onChange={(e) => updateStatus(selectedSuggestion.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="acknowledged">Acknowledged</option>
                  <option value="following">Following This Plan</option>
                  <option value="completed">Completed</option>
                  <option value="declined">Not Following</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
