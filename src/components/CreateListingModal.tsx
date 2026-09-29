import { useState } from 'react';
import { X, DollarSign, FileText, Calendar, Shield, AlertCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateListingModal({ isOpen, onClose, onSuccess }: CreateListingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    condition_category: '',
    data_type: [] as string[],
    date_range_start: '',
    date_range_end: '',
    asking_price: '',
    minimum_bid: '',
    bidding_enabled: false,
    anonymization_level: 'full',
    usage_restrictions: 'research_only',
    expires_in_days: '30'
  });

  const dataTypes = [
    'Lab Results',
    'Imaging Reports',
    'Diagnosis Records',
    'Treatment History',
    'Medication Records',
    'Surgery Records',
    'Vital Signs',
    'Other'
  ];

  const conditionCategories = [
    'Cardiology',
    'Oncology',
    'Neurology',
    'Endocrinology',
    'Gastroenterology',
    'Dermatology',
    'Orthopedics',
    'Mental Health',
    'Other'
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expires_in_days));

      const { error } = await supabase
        .from('medical_records_listings')
        .insert({
          patient_id: user.id,
          title: formData.title,
          description: formData.description,
          condition_category: formData.condition_category,
          data_type: formData.data_type,
          date_range_start: formData.date_range_start || null,
          date_range_end: formData.date_range_end || null,
          asking_price: parseFloat(formData.asking_price),
          minimum_bid: formData.bidding_enabled && formData.minimum_bid ? parseFloat(formData.minimum_bid) : null,
          bidding_enabled: formData.bidding_enabled,
          anonymization_level: formData.anonymization_level,
          usage_restrictions: formData.usage_restrictions,
          listing_status: 'active',
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      alert('Listing created successfully!');
      onSuccess();
      setFormData({
        title: '',
        description: '',
        condition_category: '',
        data_type: [],
        date_range_start: '',
        date_range_end: '',
        asking_price: '',
        minimum_bid: '',
        bidding_enabled: false,
        anonymization_level: 'full',
        usage_restrictions: 'research_only',
        expires_in_days: '30'
      });
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleDataTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      data_type: prev.data_type.includes(type)
        ? prev.data_type.filter(t => t !== type)
        : [...prev.data_type, type]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create Medical Records Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Your Privacy is Protected</p>
                <p>All medical records are anonymized before being shared. Healdox holds payments in escrow for 15 days to ensure genuine transactions.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Type 2 Diabetes Treatment Records (2020-2024)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what medical records you're selling and what they contain..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition Category *
              </label>
              <select
                required
                value={formData.condition_category}
                onChange={(e) => setFormData({ ...formData, condition_category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {conditionCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anonymization Level *
              </label>
              <select
                required
                value={formData.anonymization_level}
                onChange={(e) => setFormData({ ...formData, anonymization_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full">Fully Anonymized (Recommended)</option>
                <option value="partial">Partially Anonymized</option>
                <option value="identified">With Identification</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Types Included * (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dataTypes.map(type => (
                <label
                  key={type}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                    formData.data_type.includes(type)
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.data_type.includes(type)}
                    onChange={() => handleDataTypeToggle(type)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range Start
              </label>
              <input
                type="date"
                value={formData.date_range_start}
                onChange={(e) => setFormData({ ...formData, date_range_start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range End
              </label>
              <input
                type="date"
                value={formData.date_range_end}
                onChange={(e) => setFormData({ ...formData, date_range_end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Asking Price (USD) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={formData.asking_price}
                onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Expires In
              </label>
              <select
                value={formData.expires_in_days}
                onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.bidding_enabled}
                onChange={(e) => setFormData({ ...formData, bidding_enabled: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">Enable Bidding</p>
                <p className="text-sm text-gray-600">Allow corporates to submit bids on your records</p>
              </div>
            </label>

            {formData.bidding_enabled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Bid Amount (USD)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.minimum_bid}
                  onChange={(e) => setFormData({ ...formData, minimum_bid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50.00"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Restrictions *
            </label>
            <select
              required
              value={formData.usage_restrictions}
              onChange={(e) => setFormData({ ...formData, usage_restrictions: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="research_only">Research Only</option>
              <option value="research_and_development">Research & Development</option>
              <option value="any_legitimate_use">Any Legitimate Medical Use</option>
            </select>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">Healdox Commission: 10%</p>
                <p>Healdox charges a 10% commission on all sales. Payments are held in escrow for 15 days to ensure transaction authenticity.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.data_type.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
