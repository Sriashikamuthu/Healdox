import { useState, useEffect } from 'react';
import { AlertTriangle, Pill, Utensils, Activity, Heart, Calendar, ArrowLeft } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export function ProvideMedicalSuggestion() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [journeyId, setJourneyId] = useState('');
  const [patientInfo, setPatientInfo] = useState<any>(null);

  const [formData, setFormData] = useState({
    suggestion_type: 'comprehensive',
    title: '',
    description: '',
    medications: [] as Medication[],
    diet_plan: '',
    exercise_plan: '',
    lifestyle_changes: '',
    follow_up_date: '',
    urgency_level: 'medium',
    physician_notes: '',
  });

  const [currentMedication, setCurrentMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patient = params.get('patient');
    const journey = params.get('journey');

    if (patient) {
      setPatientId(patient);
      fetchPatientInfo(patient);
    }
    if (journey) {
      setJourneyId(journey);
    }
  }, []);

  const fetchPatientInfo = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, country')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setPatientInfo(data);
    } catch (error) {
      console.error('Error fetching patient info:', error);
    }
  };

  const addMedication = () => {
    if (!currentMedication.name || !currentMedication.dosage) {
      alert('Please fill in at least medication name and dosage');
      return;
    }

    setFormData({
      ...formData,
      medications: [...formData.medications, currentMedication],
    });

    setCurrentMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
    });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      alert('Patient information is missing');
      return;
    }

    setLoading(true);
    try {
      const suggestionData = {
        physician_id: profile?.id,
        patient_id: patientId,
        journey_id: journeyId || null,
        suggestion_type: formData.suggestion_type,
        title: formData.title,
        description: formData.description,
        medications: formData.medications,
        diet_plan: formData.diet_plan || null,
        exercise_plan: formData.exercise_plan || null,
        lifestyle_changes: formData.lifestyle_changes || null,
        follow_up_date: formData.follow_up_date || null,
        urgency_level: formData.urgency_level,
        physician_notes: formData.physician_notes || null,
      };

      const { error } = await supabase
        .from('medical_suggestions')
        .insert([suggestionData]);

      if (error) throw error;

      alert('Medical suggestion sent successfully! The patient will be notified.');
      window.history.back();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit medical suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => window.history.back()}
        className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Provide Medical Suggestion</h1>
        {patientInfo && (
          <p className="text-gray-600">
            For: <span className="font-semibold">{patientInfo.full_name}</span> (@{patientInfo.username})
          </p>
        )}
      </div>

      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-bold mb-2">CRITICAL MEDICAL DISCLAIMER</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You are providing suggestions for educational purposes only</li>
              <li>The patient must validate all suggestions with their Primary Care Physician</li>
              <li>Never prescribe controlled substances or medications requiring prescription</li>
              <li>Patient must accept risk disclaimer before following any suggestions</li>
              <li>This is NOT a substitute for in-person medical consultation</li>
              <li>In emergencies, patient should seek immediate medical attention</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Basic Information</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggestion Type
              </label>
              <select
                value={formData.suggestion_type}
                onChange={(e) => setFormData({ ...formData, suggestion_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="comprehensive">Comprehensive Plan</option>
                <option value="medication">Medication Suggestion</option>
                <option value="diet">Diet Plan</option>
                <option value="exercise">Exercise Plan</option>
                <option value="lifestyle">Lifestyle Changes</option>
                <option value="follow_up">Follow-up Recommendation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suggestion Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Diabetes Management Plan"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed explanation of your suggestions..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level
                </label>
                <select
                  value={formData.urgency_level}
                  onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold">Medication Suggestions</h3>
          </div>

          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={currentMedication.name}
                  onChange={(e) => setCurrentMedication({ ...currentMedication, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Metformin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={currentMedication.dosage}
                  onChange={(e) => setCurrentMedication({ ...currentMedication, dosage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500mg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={currentMedication.frequency}
                  onChange={(e) => setCurrentMedication({ ...currentMedication, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Twice daily"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={currentMedication.duration}
                  onChange={(e) => setCurrentMedication({ ...currentMedication, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 30 days"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={currentMedication.notes}
                onChange={(e) => setCurrentMedication({ ...currentMedication, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Take with meals"
              />
            </div>

            <button
              type="button"
              onClick={addMedication}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Add Medication
            </button>
          </div>

          {formData.medications.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Added Medications:</p>
              {formData.medications.map((med, idx) => (
                <div key={idx} className="bg-blue-50 rounded-lg p-3 flex justify-between items-start">
                  <div className="text-sm">
                    <p className="font-semibold">{med.name} - {med.dosage}</p>
                    <p className="text-gray-600">{med.frequency} for {med.duration}</p>
                    {med.notes && <p className="text-gray-600 italic">{med.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedication(idx)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold">Diet Plan</h3>
          </div>
          <textarea
            value={formData.diet_plan}
            onChange={(e) => setFormData({ ...formData, diet_plan: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Provide dietary recommendations and meal suggestions..."
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-bold">Exercise Plan</h3>
          </div>
          <textarea
            value={formData.exercise_plan}
            onChange={(e) => setFormData({ ...formData, exercise_plan: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Suggest exercises and physical activities..."
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold">Lifestyle Changes</h3>
          </div>
          <textarea
            value={formData.lifestyle_changes}
            onChange={(e) => setFormData({ ...formData, lifestyle_changes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Recommend lifestyle modifications and habits..."
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Private Physician Notes</h3>
          <textarea
            value={formData.physician_notes}
            onChange={(e) => setFormData({ ...formData, physician_notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Private notes for your records (not visible to patient)..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {loading ? 'Sending...' : 'Send Medical Suggestion'}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
