import { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

interface Bid {
  id: string;
  corporate_id: string;
  bid_amount: number;
  intended_use: string;
  research_purpose: string | null;
  bid_status: string;
  created_at: string;
  expires_at: string;
  profiles: {
    username: string;
    full_name: string;
    company_name: string;
  };
}

interface ViewBidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: {
    id: string;
    title: string;
    asking_price: number;
  };
  onAcceptBid: () => void;
}

export function ViewBidsModal({ isOpen, onClose, listing, onAcceptBid }: ViewBidsModalProps) {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBids();
    }
  }, [isOpen, listing.id]);

  const fetchBids = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records_bids')
        .select(`
          *,
          profiles!medical_records_bids_corporate_id_fkey(username, full_name, company_name)
        `)
        .eq('listing_id', listing.id)
        .order('bid_amount', { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    if (!confirm(`Accept bid of $${bid.bid_amount.toFixed(2)} from ${bid.profiles.company_name}?`)) {
      return;
    }

    setProcessing(bid.id);

    try {
      const commission = bid.bid_amount * 0.10;
      const patientEarnings = bid.bid_amount - commission;
      const holdUntil = new Date();
      holdUntil.setDate(holdUntil.getDate() + 15);

      const { data: saleData, error: saleError } = await supabase
        .from('medical_records_sales')
        .insert({
          listing_id: listing.id,
          bid_id: bid.id,
          patient_id: user?.id,
          corporate_id: bid.corporate_id,
          sale_amount: bid.bid_amount,
          healdox_commission_rate: 10.00,
          healdox_commission: commission,
          patient_earnings: patientEarnings,
          sale_status: 'pending',
          sale_terms: {
            intended_use: bid.intended_use,
            research_purpose: bid.research_purpose
          }
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .insert({
          sale_id: saleData.id,
          listing_id: listing.id,
          patient_id: user?.id,
          corporate_id: bid.corporate_id,
          amount: bid.bid_amount,
          healdox_fee: commission,
          patient_payout: patientEarnings,
          payment_method: 'escrow',
          payment_status: 'holding',
          hold_until: holdUntil.toISOString()
        });

      if (escrowError) throw escrowError;

      const { error: bidError } = await supabase
        .from('medical_records_bids')
        .update({ bid_status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', bid.id);

      if (bidError) throw bidError;

      const { error: listingError } = await supabase
        .from('medical_records_listings')
        .update({ listing_status: 'sold' })
        .eq('id', listing.id);

      if (listingError) throw listingError;

      await supabase
        .from('medical_records_bids')
        .update({ bid_status: 'rejected', responded_at: new Date().toISOString() })
        .eq('listing_id', listing.id)
        .neq('id', bid.id)
        .eq('bid_status', 'pending');

      alert(`Bid accepted! Payment of $${patientEarnings.toFixed(2)} will be released to you after 15-day escrow period.`);
      onAcceptBid();
      onClose();
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Failed to accept bid. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectBid = async (bidId: string) => {
    if (!confirm('Are you sure you want to reject this bid?')) {
      return;
    }

    setProcessing(bidId);

    try {
      const { error } = await supabase
        .from('medical_records_bids')
        .update({
          bid_status: 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', bidId);

      if (error) throw error;

      fetchBids();
      alert('Bid rejected successfully');
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Failed to reject bid');
    } finally {
      setProcessing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bids for Listing</h2>
              <p className="text-sm text-gray-600 mt-1">{listing.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">15-Day Escrow Protection</p>
                <p>When you accept a bid, payment is held in escrow for 15 days. This ensures the transaction is genuine before funds are released to you. Healdox charges a 10% commission on all sales.</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading bids...</div>
            </div>
          ) : bids.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bids Yet</h3>
              <p className="text-gray-600">Verified corporates haven't placed any bids on this listing yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => {
                const isExpired = new Date(bid.expires_at) < new Date();
                const commission = bid.bid_amount * 0.10;
                const youReceive = bid.bid_amount - commission;

                return (
                  <div
                    key={bid.id}
                    className={`border rounded-xl p-6 ${
                      bid.bid_status === 'accepted' ? 'bg-green-50 border-green-200' :
                      bid.bid_status === 'rejected' ? 'bg-gray-50 border-gray-200' :
                      isExpired ? 'bg-orange-50 border-orange-200' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {bid.profiles.company_name || bid.profiles.full_name}
                          </h3>
                          {bid.bid_status === 'accepted' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Accepted
                            </span>
                          )}
                          {bid.bid_status === 'rejected' && (
                            <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                              Rejected
                            </span>
                          )}
                          {isExpired && bid.bid_status === 'pending' && (
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          <span className="font-medium">Intended Use:</span> {bid.intended_use}
                        </p>
                        {bid.research_purpose && (
                          <p className="text-gray-600 text-sm mb-2">
                            <span className="font-medium">Research Purpose:</span> {bid.research_purpose}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted {new Date(bid.created_at).toLocaleDateString()}
                          </span>
                          <span>Expires {new Date(bid.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          ${bid.bid_amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Healdox fee (10%): -${commission.toFixed(2)}</div>
                          <div className="font-semibold text-green-600 border-t border-gray-300 pt-1">
                            You receive: ${youReceive.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {bid.bid_status === 'pending' && !isExpired && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleAcceptBid(bid)}
                          disabled={processing === bid.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {processing === bid.id ? 'Processing...' : 'Accept Bid'}
                        </button>
                        <button
                          onClick={() => handleRejectBid(bid.id)}
                          disabled={processing === bid.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
