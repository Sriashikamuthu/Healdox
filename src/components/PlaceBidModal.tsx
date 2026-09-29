import { useState } from 'react';
import { X, DollarSign, AlertCircle, FileText } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    asking_price: number;
    minimum_bid: number | null;
    bidding_enabled: boolean;
    usage_restrictions: string;
  };
  onSuccess: () => void;
}

export function PlaceBidModal({ isOpen, onClose, listing, onSuccess }: PlaceBidModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bid_amount: listing.minimum_bid?.toString() || listing.asking_price.toString(),
    intended_use: '',
    research_purpose: '',
    terms_agreed: false,
    privacy_agreement_signed: false
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.terms_agreed || !formData.privacy_agreement_signed) {
      alert('Please agree to the terms and privacy agreement');
      return;
    }

    const bidAmount = parseFloat(formData.bid_amount);
    if (listing.minimum_bid && bidAmount < listing.minimum_bid) {
      alert(`Bid amount must be at least $${listing.minimum_bid.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Bid expires in 7 days

      const { error } = await supabase
        .from('medical_records_bids')
        .insert({
          listing_id: listing.id,
          corporate_id: user.id,
          bid_amount: bidAmount,
          intended_use: formData.intended_use,
          research_purpose: formData.research_purpose || null,
          terms_agreed: formData.terms_agreed,
          privacy_agreement_signed: formData.privacy_agreement_signed,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Update bid count on listing
      const { data: currentListing } = await supabase
        .from('medical_records_listings')
        .select('bids_count')
        .eq('id', listing.id)
        .single();

      if (currentListing) {
        await supabase
          .from('medical_records_listings')
          .update({ bids_count: (currentListing.bids_count || 0) + 1 })
          .eq('id', listing.id);
      }

      alert('Bid submitted successfully! The patient will review your offer.');
      onSuccess();
    } catch (error: any) {
      console.error('Error placing bid:', error);
      if (error.message?.includes('duplicate key')) {
        alert('You already have a pending bid on this listing');
      } else {
        alert('Failed to place bid. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {listing.bidding_enabled ? 'Place Bid' : 'Purchase Medical Records'}
          </h2>
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
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">{listing.title}</p>
                <p>
                  {listing.bidding_enabled
                    ? `Asking Price: $${listing.asking_price.toFixed(2)} | Minimum Bid: $${listing.minimum_bid?.toFixed(2) || 'N/A'}`
                    : `Price: $${listing.asking_price.toFixed(2)}`
                  }
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              {listing.bidding_enabled ? 'Your Bid Amount (USD) *' : 'Purchase Price (USD)'}
            </label>
            <input
              type="number"
              required
              min={listing.minimum_bid || 1}
              step="0.01"
              value={formData.bid_amount}
              onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={listing.minimum_bid?.toFixed(2) || listing.asking_price.toFixed(2)}
            />
            {listing.minimum_bid && (
              <p className="text-sm text-gray-500 mt-1">
                Minimum bid: ${listing.minimum_bid.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intended Use *
            </label>
            <select
              required
              value={formData.intended_use}
              onChange={(e) => setFormData({ ...formData, intended_use: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select intended use</option>
              <option value="Clinical Research">Clinical Research</option>
              <option value="Drug Development">Drug Development</option>
              <option value="Medical Device Research">Medical Device Research</option>
              <option value="Epidemiological Study">Epidemiological Study</option>
              <option value="AI/ML Model Training">AI/ML Model Training</option>
              <option value="Healthcare Analytics">Healthcare Analytics</option>
              <option value="Other Research">Other Research</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Research Purpose (Optional)
            </label>
            <textarea
              value={formData.research_purpose}
              onChange={(e) => setFormData({ ...formData, research_purpose: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide details about your research project and how this data will be used..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">15-Day Escrow Period</p>
                <p className="mb-2">
                  Upon acceptance of your bid, payment will be held in escrow by Healdox for 15 days to ensure transaction authenticity.
                  The patient will receive 90% of the bid amount (10% Healdox commission).
                </p>
                <p className="font-semibold">Usage Restrictions: {listing.usage_restrictions.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.terms_agreed}
                onChange={(e) => setFormData({ ...formData, terms_agreed: e.target.checked })}
                className="w-5 h-5 text-blue-600 mt-0.5"
                required
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium">I agree to the Terms of Use *</p>
                <p className="text-gray-600">
                  I will use this data only for the stated purpose and comply with all applicable data protection regulations including HIPAA.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.privacy_agreement_signed}
                onChange={(e) => setFormData({ ...formData, privacy_agreement_signed: e.target.checked })}
                className="w-5 h-5 text-blue-600 mt-0.5"
                required
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium">I agree to the Privacy Agreement *</p>
                <p className="text-gray-600">
                  I will maintain patient anonymity and will not attempt to re-identify individuals from this data.
                </p>
              </div>
            </label>
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
              disabled={loading || !formData.terms_agreed || !formData.privacy_agreement_signed}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : listing.bidding_enabled ? 'Submit Bid' : 'Purchase Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
