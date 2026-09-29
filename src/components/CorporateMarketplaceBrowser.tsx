import { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, Eye, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { PlaceBidModal } from './PlaceBidModal';

interface Listing {
  id: string;
  title: string;
  description: string;
  condition_category: string;
  data_type: string[];
  asking_price: number;
  minimum_bid: number | null;
  bidding_enabled: boolean;
  anonymization_level: string;
  usage_restrictions: string;
  views_count: number;
  bids_count: number;
  expires_at: string | null;
  created_at: string;
}

export function CorporateMarketplaceBrowser() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isVerified, setIsVerified] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  const categories = [
    'all',
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

  useEffect(() => {
    checkVerificationStatus();
    fetchListings();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('corporate_verifications')
        .select('verification_status')
        .eq('company_profile_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsVerified(data?.verification_status === 'verified');
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const fetchListings = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('medical_records_listings')
        .select('*')
        .eq('listing_status', 'active')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewListing = async (listing: Listing) => {
    await supabase
      .from('medical_records_listings')
      .update({ views_count: listing.views_count + 1 })
      .eq('id', listing.id);

    fetchListings();
  };

  const handlePlaceBid = (listing: Listing) => {
    if (!isVerified) {
      alert('Your company must be verified before you can place bids. Please submit verification documents.');
      return;
    }
    setSelectedListing(listing);
    setBidModalOpen(true);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.condition_category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || listing.condition_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Records Marketplace</h2>
          <p className="text-gray-600">Browse and purchase anonymized medical records for research and development</p>
        </div>

        {!isVerified && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">Verification Required</h3>
                <p className="text-sm text-orange-800 mb-3">
                  Your company must be verified before you can place bids on medical records. This ensures patient safety and data security.
                </p>
                <button
                  onClick={() => window.location.href = '/pharma-profile'}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm"
                >
                  Submit Verification
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings by title, description, or condition..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>{filteredListings.length} listings available</span>
          {isVerified && (
            <div className="flex items-center gap-2 text-green-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">Verified Buyer</span>
            </div>
          )}
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Listings Found</h3>
          <p className="text-gray-600">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No active listings available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewListing(listing)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {listing.condition_category}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {listing.anonymization_level === 'full' ? 'Fully Anonymized' :
                       listing.anonymization_level === 'partial' ? 'Partially Anonymized' :
                       'With Identification'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {listing.data_type.slice(0, 3).map(type => (
                      <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {type}
                      </span>
                    ))}
                    {listing.data_type.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        +{listing.data_type.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {listing.views_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {listing.bids_count} bids
                    </span>
                    {listing.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Expires {new Date(listing.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${listing.asking_price.toFixed(2)}
                    </div>
                    {listing.bidding_enabled && listing.minimum_bid && (
                      <div className="text-sm text-gray-500">
                        Min bid: ${listing.minimum_bid.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaceBid(listing);
                    }}
                    disabled={!isVerified}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isVerified
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {listing.bidding_enabled ? 'Place Bid' : 'Purchase'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedListing && (
        <PlaceBidModal
          isOpen={bidModalOpen}
          onClose={() => {
            setBidModalOpen(false);
            setSelectedListing(null);
          }}
          listing={selectedListing}
          onSuccess={() => {
            fetchListings();
            setBidModalOpen(false);
            setSelectedListing(null);
          }}
        />
      )}
    </div>
  );
}
