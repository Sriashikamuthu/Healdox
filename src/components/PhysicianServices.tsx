import { useState, useEffect } from 'react';
import { Plus, DollarSign, Clock, Edit, Trash2, ToggleLeft, ToggleRight, Search, User } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  service_type: string;
  specialty: string;
  title: string;
  description: string;
  is_free: boolean;
  fee_amount: number;
  currency: string;
  duration_minutes: number;
  conditions_treated: string[];
  is_active: boolean;
  created_at: string;
}

interface Patient {
  id: string;
  full_name: string;
  username: string;
  country: string;
  journeys: Array<{
    id: string;
    title: string;
    condition: string;
    symptoms_description: string;
    current_status: string;
  }>;
}

export function PhysicianServices() {
  const { profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchSymptom, setSearchSymptom] = useState('');
  const [activeView, setActiveView] = useState<'services' | 'patients'>('services');

  const [formData, setFormData] = useState({
    service_type: 'consultation',
    title: '',
    description: '',
    is_free: true,
    fee_amount: 0,
    currency: 'USD',
    duration_minutes: 30,
    conditions_treated: '',
  });

  useEffect(() => {
    if (profile?.id) {
      fetchServices();
    }
  }, [profile?.id]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('physician_services')
        .select('*')
        .eq('physician_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async () => {
    if (!searchSymptom.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_journeys')
        .select(`
          id,
          title,
          condition,
          symptoms_description,
          current_status,
          user_id,
          profiles!patient_journeys_user_id_fkey (
            id,
            full_name,
            username,
            country
          )
        `)
        .or(`condition.ilike.%${searchSymptom}%,symptoms_description.ilike.%${searchSymptom}%`)
        .eq('is_anonymous', false)
        .limit(20);

      if (error) throw error;

      const groupedPatients: Record<string, Patient> = {};

      data?.forEach((journey: any) => {
        const userId = journey.profiles.id;
        if (!groupedPatients[userId]) {
          groupedPatients[userId] = {
            id: userId,
            full_name: journey.profiles.full_name,
            username: journey.profiles.username,
            country: journey.profiles.country,
            journeys: [],
          };
        }
        groupedPatients[userId].journeys.push({
          id: journey.id,
          title: journey.title,
          condition: journey.condition,
          symptoms_description: journey.symptoms_description,
          current_status: journey.current_status,
        });
      });

      setPatients(Object.values(groupedPatients));
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const serviceData = {
      physician_id: profile?.id,
      service_type: formData.service_type,
      specialty: profile?.specialty || '',
      title: formData.title,
      description: formData.description,
      is_free: formData.is_free,
      fee_amount: formData.is_free ? 0 : formData.fee_amount,
      currency: formData.currency,
      duration_minutes: formData.duration_minutes,
      conditions_treated: formData.conditions_treated.split(',').map(c => c.trim()).filter(Boolean),
    };

    try {
      if (editingService) {
        const { error } = await supabase
          .from('physician_services')
          .update(serviceData)
          .eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('physician_services')
          .insert([serviceData]);
        if (error) throw error;
      }

      setShowServiceForm(false);
      setEditingService(null);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('physician_services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('physician_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      service_type: 'consultation',
      title: '',
      description: '',
      is_free: true,
      fee_amount: 0,
      currency: 'USD',
      duration_minutes: 30,
      conditions_treated: '',
    });
  };

  const startEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      service_type: service.service_type,
      title: service.title,
      description: service.description,
      is_free: service.is_free,
      fee_amount: service.fee_amount,
      currency: service.currency,
      duration_minutes: service.duration_minutes,
      conditions_treated: service.conditions_treated.join(', '),
    });
    setShowServiceForm(true);
  };

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Services</h1>
        <p className="text-gray-600">Offer services to patients and help them with their health journey</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView('services')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'services'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          My Services
        </button>
        <button
          onClick={() => setActiveView('patients')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeView === 'patients'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Find Patients
        </button>
      </div>

      {activeView === 'services' && (
        <>
          <button
            onClick={() => {
              setShowServiceForm(!showServiceForm);
              setEditingService(null);
              resetForm();
            }}
            className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Service
          </button>

          {showServiceForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type
                  </label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="consultation">Consultation</option>
                    <option value="diet_plan">Diet Plan</option>
                    <option value="exercise_plan">Exercise Plan</option>
                    <option value="medication_review">Medication Review</option>
                    <option value="general_advice">General Advice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Free Diabetes Management Consultation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this service includes..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conditions Treated (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.conditions_treated}
                    onChange={(e) => setFormData({ ...formData, conditions_treated: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Diabetes, High Blood Pressure, Obesity"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_free}
                      onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Offer for Free</span>
                  </label>
                </div>

                {!formData.is_free && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fee Amount
                      </label>
                      <input
                        type="number"
                        value={formData.fee_amount}
                        onChange={(e) => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowServiceForm(false);
                    setEditingService(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {loading ? (
              <p className="text-gray-600">Loading services...</p>
            ) : services.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">No services yet. Create your first service to start helping patients!</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                        {service.is_free ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            FREE
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {service.currency} {service.fee_amount}
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          service.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 capitalize">
                        {service.service_type.replace('_', ' ')} • {service.duration_minutes} minutes
                      </p>
                      <p className="text-gray-700 mb-3">{service.description}</p>
                      {service.conditions_treated.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {service.conditions_treated.map((condition, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {condition}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title={service.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {service.is_active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(service)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeView === 'patients' && (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Search Patients by Symptoms or Condition</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchSymptom}
                onChange={(e) => setSearchSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                placeholder="e.g., diabetes, back pain, anxiety..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchPatients}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Find patients who might benefit from your expertise and offer them help
            </p>
          </div>

          {patients.length > 0 && (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{patient.full_name}</h3>
                      <p className="text-sm text-gray-600">@{patient.username} • {patient.country}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {patient.journeys.map((journey) => (
                      <div key={journey.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{journey.title}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {journey.current_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Condition:</span> {journey.condition}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Symptoms:</span> {journey.symptoms_description}
                        </p>
                        <button
                          onClick={() => {
                            window.location.href = `/provide-suggestion?patient=${patient.id}&journey=${journey.id}`;
                          }}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Provide Medical Suggestion
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
