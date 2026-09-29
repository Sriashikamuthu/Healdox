import { useState, useEffect } from 'react';
import { Plus, X, Calendar, Users, Globe, Heart, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface Offer {
  id: string;
  title: string;
  description: string;
  offer_type: string;
  specialization: string | null;
  eligibility_criteria: string | null;
  countries_available: string[];
  slots_available: number;
  slots_remaining: number;
  valid_from: string;
  valid_until: string;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  application_message: string;
  medical_condition: string;
  urgency_level: string;
  status: string;
  created_at: string;
  patient: {
    id: string;
    full_name: string;
    username: string;
  };
}

export function PhysicianFreeConsultations() {
  const { profile } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('free_consultation_offers')
        .select('*')
        .eq('provider_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (offerId: string) => {
    try {
      const { data, error } = await supabase
        .from('free_consultation_applications')
        .select(`
          *,
          patient:profiles!free_consultation_applications_patient_id_fkey(
            id,
            full_name,
            username
          )
        `)
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const viewApplications = (offerId: string) => {
    setSelectedOffer(offerId);
    fetchApplications(offerId);
    setShowApplicationsModal(true);
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('free_consultation_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      if (selectedOffer) {
        fetchApplications(selectedOffer);
      }
      fetchOffers();
      alert(`Application ${status} successfully!`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    }
  };

  const updateOfferStatus = async (offerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('free_consultation_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offerId);

      if (error) throw error;
      fetchOffers();
      alert(`Offer ${status} successfully!`);
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Failed to update offer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Consultation Offers</h1>
          <p className="text-gray-600">Serve humanity by offering free medical consultations worldwide</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Offer
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Make a Difference</p>
            <p>
              Offer free consultations to patients who need medical guidance. Your expertise can change lives
              and provide hope to those who cannot afford healthcare services.
            </p>
          </div>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Offers Yet</h3>
          <p className="text-gray-600 mb-6">
            Start making a difference by creating your first free consultation offer
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Offer
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{offer.title}</h3>
                  <p className="text-sm text-gray-600 capitalize mb-2">
                    {offer.offer_type.replace('_', ' ')}
                    {offer.specialization && ` • ${offer.specialization}`}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    offer.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : offer.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : offer.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {offer.status}
                </span>
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{offer.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    {offer.slots_remaining} of {offer.slots_available} slots remaining
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>{offer.countries_available.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Valid until {new Date(offer.valid_until).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => viewApplications(offer.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View Applications
                </button>
                {offer.status === 'active' && (
                  <button
                    onClick={() => updateOfferStatus(offer.id, 'paused')}
                    className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors text-sm"
                  >
                    Pause
                  </button>
                )}
                {offer.status === 'paused' && (
                  <button
                    onClick={() => updateOfferStatus(offer.id, 'active')}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateOfferModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOffers();
          }}
        />
      )}

      {showApplicationsModal && selectedOffer && (
        <ApplicationsModal
          applications={applications}
          offer={offers.find((o) => o.id === selectedOffer)!}
          onClose={() => {
            setShowApplicationsModal(false);
            setSelectedOffer(null);
          }}
          onUpdateStatus={updateApplicationStatus}
        />
      )}
    </div>
  );
}

interface CreateOfferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateOfferModal({ onClose, onSuccess }: CreateOfferModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    offer_type: 'teleconsultation',
    specialization: '',
    eligibility_criteria: '',
    countries_available: ['Worldwide'],
    slots_available: 10,
    valid_until: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('free_consultation_offers')
        .insert({
          provider_id: profile?.id,
          ...formData,
          slots_remaining: formData.slots_available,
          status: 'active',
        });

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-4">Create Free Consultation Offer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Free Cardiology Consultation for Low-Income Patients"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Describe what you're offering and how it can help patients..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type *</label>
              <select
                value={formData.offer_type}
                onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="teleconsultation">Teleconsultation</option>
                <option value="surgery_support">Surgery Support</option>
                <option value="second_opinion">Second Opinion</option>
                <option value="general_consultation">General Consultation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Cardiology"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label>
            <textarea
              value={formData.eligibility_criteria}
              onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Who can apply for this offer..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Slots *</label>
              <input
                type="number"
                min="1"
                value={formData.slots_available}
                onChange={(e) => setFormData({ ...formData, slots_available: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ApplicationsModalProps {
  applications: Application[];
  offer: Offer;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

function ApplicationsModal({ applications, offer, onClose, onUpdateStatus }: ApplicationsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Applications for "{offer.title}"</h2>
        <p className="text-gray-600 mb-6">
          {applications.length} application{applications.length !== 1 ? 's' : ''} received
        </p>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No applications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.patient.full_name}</h3>
                    <p className="text-sm text-gray-600">@{app.patient.username}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : app.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Medical Condition:</p>
                    <p className="text-sm text-gray-600">{app.medical_condition}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Application Message:</p>
                    <p className="text-sm text-gray-600">{app.application_message}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {app.urgency_level}
                    </span>
                    <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStatus(app.id, 'approved')}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => onUpdateStatus(app.id, 'rejected')}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
