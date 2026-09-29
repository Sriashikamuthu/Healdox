import { useState, useEffect } from 'react';
import { Heart, Globe, Calendar, Users, X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface Offer {
  id: string;
  title: string;
  description: string;
  offer_type: string;
  specialization: string | null;
  eligibility_criteria: string | null;
  countries_available: string[];
  slots_remaining: number;
  valid_until: string;
  provider: {
    id: string;
    full_name: string;
    role: string;
    specialization?: string;
  };
}

interface MyApplication {
  id: string;
  status: string;
  created_at: string;
  offer: {
    title: string;
    provider: {
      full_name: string;
    };
  };
}

export function FreeConsultationsMarket() {
  const { profile } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchOffers();
    fetchMyApplications();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('free_consultation_offers')
        .select(`
          *,
          provider:profiles!free_consultation_offers_provider_id_fkey(
            id,
            full_name,
            role,
            specialization
          )
        `)
        .eq('status', 'active')
        .gt('valid_until', new Date().toISOString())
        .gt('slots_remaining', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('free_consultation_applications')
        .select(`
          id,
          status,
          created_at,
          offer:free_consultation_offers(
            title,
            provider:profiles!free_consultation_offers_provider_id_fkey(
              full_name
            )
          )
        `)
        .eq('patient_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const openApplicationModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowApplicationModal(true);
  };

  const filteredOffers = filterType === 'all'
    ? offers
    : offers.filter(offer => offer.offer_type === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Medical Consultations</h1>
        <p className="text-gray-600">
          Healthcare professionals offering free consultations to patients worldwide
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <Heart className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Get Free Medical Help</h3>
            <p className="text-gray-700 text-sm">
              Compassionate healthcare providers are offering free consultations, second opinions, and even
              surgery support to patients in need. Apply for these opportunities and get the medical help you deserve.
            </p>
          </div>
        </div>
      </div>

      {myApplications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Applications</h2>
          <div className="space-y-3">
            {myApplications.slice(0, 3).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{app.offer.title}</p>
                  <p className="text-sm text-gray-600">Dr. {app.offer.provider.full_name}</p>
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
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Offers
          </button>
          <button
            onClick={() => setFilterType('teleconsultation')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'teleconsultation'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Teleconsultation
          </button>
          <button
            onClick={() => setFilterType('surgery_support')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'surgery_support'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Surgery Support
          </button>
          <button
            onClick={() => setFilterType('second_opinion')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterType === 'second_opinion'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Second Opinion
          </button>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Offers Available</h3>
          <p className="text-gray-600">Check back later for new free consultation opportunities</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4">
                <div className="flex items-start justify-between">
                  <Heart className="w-8 h-8 text-white" />
                  <span className="px-2 py-1 bg-white text-green-700 text-xs font-bold rounded-full">
                    FREE
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{offer.title}</h3>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    Dr. {offer.provider.full_name}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {offer.specialization || offer.provider.role.replace('_', ' ')}
                  </p>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{offer.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{offer.slots_remaining} slots available</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span>{offer.countries_available.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Until {new Date(offer.valid_until).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => openApplicationModal(offer)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showApplicationModal && selectedOffer && (
        <ApplicationModal
          offer={selectedOffer}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedOffer(null);
          }}
          onSuccess={() => {
            setShowApplicationModal(false);
            setSelectedOffer(null);
            fetchMyApplications();
            fetchOffers();
          }}
        />
      )}
    </div>
  );
}

interface ApplicationModalProps {
  offer: Offer;
  onClose: () => void;
  onSuccess: () => void;
}

function ApplicationModal({ offer, onClose, onSuccess }: ApplicationModalProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    application_message: '',
    medical_condition: '',
    urgency_level: 'routine',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('free_consultation_applications')
        .insert({
          offer_id: offer.id,
          patient_id: profile?.id,
          ...formData,
          status: 'pending',
        });

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('You have already applied for this offer');
        }
        throw insertError;
      }

      alert('Application submitted successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
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

        <h2 className="text-2xl font-bold mb-2">Apply for Free Consultation</h2>
        <p className="text-gray-600 mb-1">{offer.title}</p>
        <p className="text-sm text-gray-600 mb-6">Dr. {offer.provider.full_name}</p>

        {offer.eligibility_criteria && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Eligibility Criteria:</p>
            <p className="text-sm text-blue-800">{offer.eligibility_criteria}</p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important Information</p>
              <ul className="list-disc list-inside space-y-1">
                <li>This is a free service provided by healthcare professionals</li>
                <li>Applications are reviewed on a case-by-case basis</li>
                <li>Approval is not guaranteed and depends on eligibility</li>
                <li>Be honest and provide accurate medical information</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Condition *
            </label>
            <textarea
              value={formData.medical_condition}
              onChange={(e) => setFormData({ ...formData, medical_condition: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Briefly describe your medical condition or concern..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Why do you need this consultation? *
            </label>
            <textarea
              value={formData.application_message}
              onChange={(e) => setFormData({ ...formData, application_message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="Explain your situation, why you need free consultation, and how it would help you..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency Level *
            </label>
            <select
              value={formData.urgency_level}
              onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="routine">Routine - Can wait</option>
              <option value="urgent">Urgent - Need soon</option>
              <option value="critical">Critical - Immediate need</option>
            </select>
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
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
