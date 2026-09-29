import { useState, useEffect } from 'react';
import { Plus, DollarSign, Eye, MessageSquare, TrendingUp, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { CreateListingModal } from './CreateListingModal';
import { ViewBidsModal } from './ViewBidsModal';

interface Listing {
  id: string;
  title: string;
  description: string;
  condition_category: string;
  asking_price: number;
  minimum_bid: number | null;
  bidding_enabled: boolean;
  listing_status: string;
  views_count: number;
  bids_count: number;
  created_at: string;
  expires_at: string | null;
}

export function MedicalRecordsMarketplace() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bidsModalOpen, setBidsModalOpen] = useState(false);
  const [hasMarketplaceAccess, setHasMarketplaceAccess] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalEarnings: 0,
    pendingBids: 0
  });

  useEffect(() => {
    checkMarketplaceAccess();
    fetchListings();
    fetchStats();
  }, [user]);

  const checkMarketplaceAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_id, subscription_plans(limits)')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (error) throw error;

      const hasAccess = data?.subscription_plans?.limits?.marketplace_access === true;
      setHasMarketplaceAccess(hasAccess);
    } catch (error) {
      console.error('Error checking marketplace access:', error);
    }
  };

  const fetchListings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medical_records_listings')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: listingsData } = await supabase
        .from('medical_records_listings')
        .select('listing_status, bids_count')
        .eq('patient_id', user.id);

      const { data: salesData } = await supabase
        .from('medical_records_sales')
        .select('patient_earnings')
        .eq('patient_id', user.id)
        .eq('sale_status', 'completed');

      const totalEarnings = salesData?.reduce((sum, sale) => sum + Number(sale.patient_earnings), 0) || 0;
      const activeListings = listingsData?.filter(l => l.listing_status === 'active').length || 0;
      const pendingBids = listingsData?.reduce((sum, l) => sum + (l.bids_count || 0), 0) || 0;

      setStats({
        totalListings: listingsData?.length || 0,
        activeListings,
        totalEarnings,
        pendingBids
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateListing = () => {
    if (!hasMarketplaceAccess) {
      alert('Upgrade to Premium to access the Medical Records Marketplace');
      return;
    }
    setCreateModalOpen(true);
  };

  const handleViewBids = (listing: Listing) => {
    setSelectedListing(listing);
    setBidsModalOpen(true);
  };

  const handleWithdrawListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to withdraw this listing?')) return;

    try {
      const { error } = await supabase
        .from('medical_records_listings')
        .update({ listing_status: 'withdrawn' })
        .eq('id', listingId);

      if (error) throw error;
      fetchListings();
      fetchStats();
    } catch (error) {
      console.error('Error withdrawing listing:', error);
      alert('Failed to withdraw listing');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'sold':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medical Records Marketplace</h2>
            <p className="text-gray-600 mt-1">Earn money by selling your medical data to verified research organizations</p>
          </div>
          <button
            onClick={handleCreateListing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasMarketplaceAccess
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!hasMarketplaceAccess}
          >
            <Plus className="w-5 h-5" />
            Create Listing
          </button>
        </div>

        {!hasMarketplaceAccess && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Upgrade to Premium to Access Marketplace</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Sell your medical records to verified pharmaceutical companies and research centers worldwide.
                  Earn money while contributing to medical research with secure escrow payments through Healdox.
                </p>
                <button
                  onClick={() => window.location.href = '/subscription-plans'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  View Premium Plans
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Total Listings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.activeListings}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Pending Bids</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.pendingBids}</p>
          </div>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Listings Yet</h3>
          <p className="text-gray-600 mb-6">
            {hasMarketplaceAccess
              ? 'Create your first listing to start earning from your medical records'
              : 'Upgrade to Premium to start creating listings and earning money'}
          </p>
          {hasMarketplaceAccess && (
            <button
              onClick={handleCreateListing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Your First Listing
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(listing.listing_status)}
                    <h3 className="text-lg font-bold text-gray-900">{listing.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      listing.listing_status === 'active' ? 'bg-green-100 text-green-700' :
                      listing.listing_status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      listing.listing_status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {listing.listing_status.charAt(0).toUpperCase() + listing.listing_status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{listing.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {listing.views_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {listing.bids_count} bids
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {listing.condition_category}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    ${listing.asking_price.toFixed(2)}
                  </div>
                  {listing.bidding_enabled && listing.minimum_bid && (
                    <div className="text-sm text-gray-500">
                      Min bid: ${listing.minimum_bid.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {listing.bids_count > 0 && (
                  <button
                    onClick={() => handleViewBids(listing)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  >
                    View Bids ({listing.bids_count})
                  </button>
                )}
                {listing.listing_status === 'active' && (
                  <button
                    onClick={() => handleWithdrawListing(listing.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
                  >
                    Withdraw Listing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateListingModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchListings();
          fetchStats();
          setCreateModalOpen(false);
        }}
      />

      {selectedListing && (
        <ViewBidsModal
          isOpen={bidsModalOpen}
          onClose={() => {
            setBidsModalOpen(false);
            setSelectedListing(null);
          }}
          listing={selectedListing}
          onAcceptBid={() => {
            fetchListings();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
