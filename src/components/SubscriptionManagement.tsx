import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, CheckCircle, TrendingUp, Gift, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlans } from './pages/SubscriptionPlans';


import { useAuth } from '../contexts/AuthContext';
import { Subscription, SubscriptionPlan, SubscriptionHistory } from '../types/database';
import { getUsageStats, getFeatureDisplayName, formatLimit } from '../utils/featureGating';
import { formatDistanceToNow } from '../utils/date';

export function SubscriptionManagement() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [usageStats, setUsageStats] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsageStats();
    }
  }, [user]);

  const activePlan = JSON.parse(
    localStorage.getItem(
      `subscription_${user?.email}`
    ) || '{}'
  );

  const fetchUsageStats = async () => {
    if (!user) return;

    try {
      const stats = await getUsageStats(user.id);
      setUsageStats(stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; text: string }> = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      trialing: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, text: 'Trial' },
      past_due: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Past Due' },
      canceled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'Canceled' },
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const localSubscription = JSON.parse(
    localStorage.getItem(
      `subscription_${user?.email}`
    ) || 'null'
  );

  if (!localSubscription?.active) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Active Subscription
        </h3>

        <p className="text-gray-600 mb-4">
          You don't have an active subscription. Upgrade to unlock premium features!
        </p>

        <button
          onClick={() => {
            window.location.href = '/subscription-plans';
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-2xl font-bold text-green-700 mb-2">
            Active Subscription
          </h3>

          <p className="text-gray-700">
            You are subscribed to the
            <span className="font-bold text-blue-600 ml-1">
              {activePlan.plan}
            </span>
            {' '}Plan
          </p>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">
                Plan
              </p>

              <p className="font-semibold text-gray-900">
                {activePlan.plan}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">
                Billing
              </p>

              <p className="font-semibold text-gray-900">
                {activePlan.billing_cycle}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">
                Price
              </p>

              <p className="font-semibold text-gray-900">
                ${activePlan.amount}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border">
              <p className="text-xs text-gray-500">
                Status
              </p>

              <p className="font-semibold text-green-600">
                Active
              </p>
            </div>

          </div>

        </div>

        <div className="flex gap-3">

          <button
            onClick={() => {
              window.location.href = '/subscription-plans';
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            Upgrade Plan
          </button>

          <button
            onClick={() => {
              localStorage.removeItem(
                `subscription_${user?.email}`
              )
              window.location.reload();
            }}
            className="px-5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  ); 

  const isTrialing = subscription.status === 'trialing';
  const daysUntilRenewal = subscription.current_period_end
    ? Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.display_name}</h2>
            <p className="text-gray-600">{plan.description}</p>
          </div>
          {getStatusBadge(subscription.status)}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Plan Price</div>
              <div className="text-xl font-bold text-gray-900">
                ${subscription.billing_cycle === 'monthly' ? plan.price_monthly : plan.price_yearly}
                <span className="text-sm font-normal text-gray-600">
                  /{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">
                {isTrialing ? 'Trial Ends' : subscription.cancel_at_period_end ? 'Cancels On' : 'Renews On'}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {subscription.trial_end && isTrialing
                  ? new Date(subscription.trial_end).toLocaleDateString()
                  : subscription.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                {daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : 'Today'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Billing Cycle</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">
                {subscription.billing_cycle}
              </div>
              {subscription.billing_cycle === 'yearly' && (
                <div className="text-xs text-green-600 font-medium">Save 17%</div>
              )}
            </div>
          </div>
        </div>

        {isTrialing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900">You're on a free trial</div>
                <div className="text-sm text-blue-700 mt-1">
                  Your trial ends in {Math.ceil((new Date(subscription.trial_end!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days.
                  You won't be charged until then.
                </div>
              </div>
            </div>
          </div>
        )}

        {subscription.cancel_at_period_end && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900">Subscription Canceling</div>
                <div className="text-sm text-red-700 mt-1">
                  Your subscription will be canceled on {new Date(subscription.current_period_end!).toLocaleDateString()}.
                  You'll lose access to premium features.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upgrade Plan
          </button>
          {!subscription.cancel_at_period_end && (
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel Subscription
            </button>
          )}
          {subscription.cancel_at_period_end && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Reactivate Subscription
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Period</h3>
        <div className="space-y-4">
          {Object.entries(usageStats).length === 0 ? (
            <p className="text-gray-600 text-center py-4">No usage data available</p>
          ) : (
            Object.entries(usageStats).map(([key, stats]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700 font-medium">{getFeatureDisplayName(key)}</span>
                  <span className="text-gray-600">
                    {stats.current} / {formatLimit(stats.limit, key.includes('mb') ? 'mb' : undefined)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageColor(stats.percentage)}`}
                    style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Gift className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Refer Friends, Get Rewards</h3>
            <p className="text-blue-100 mb-4">
              Share your referral code and get 1 month free for every friend who subscribes!
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 font-mono text-xl font-bold">
                {referralCode}
              </div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h3>
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.action.includes('succeeded') ? 'bg-green-500' :
                    item.action.includes('failed') ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {item.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(item.created_at)}
                    </div>
                  </div>
                </div>
                {item.amount && (
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${item.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">{item.currency}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
