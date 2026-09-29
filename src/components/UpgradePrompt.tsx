import { X, Lock, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
  currentUsage?: number;
  limit?: number;
}

export function UpgradePrompt({
  isOpen,
  onClose,
  feature,
  description,
  currentUsage,
  limit
}: UpgradePromptProps) {
  const { profile } = useAuth();

  if (!isOpen) return null;

  const getTierBenefits = () => {
    if (user?.role === 'patient') {
      return {
        title: 'Unlock Premium Features',
        benefits: [
          'Unlimited health journey posts',
          'Priority physician responses (24hrs)',
          '2 video consultations per month',
          'AI-powered symptom analysis',
          'Up to 10 family members',
          '5GB medical record storage',
          'Second opinion service',
          'Premium health content'
        ],
        price: '$9.99',
        trial: '14-day free trial'
      };
    } else if (user?.role === 'physician') {
      return {
        title: 'Grow Your Practice',
        benefits: [
          'Unlimited consultation requests',
          'Featured profile listing',
          'Priority inbox & 24hr response',
          'Telemedicine platform',
          'E-prescription tools',
          'Advanced analytics',
          'Marketing campaigns',
          'CME credits access'
        ],
        price: '$29.99',
        trial: '14-day free trial'
      };
    }

    return {
      title: 'Upgrade Your Account',
      benefits: ['Access premium features', 'Unlimited usage', 'Priority support'],
      price: '$9.99',
      trial: '14-day free trial'
    };
  };

  const benefits = getTierBenefits();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Feature Locked</h2>
              <p className="text-sm text-blue-100">Upgrade to unlock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900 mb-1">{feature}</div>
                {description && (
                  <p className="text-sm text-red-700">{description}</p>
                )}
                {currentUsage !== undefined && limit !== undefined && (
                  <p className="text-sm text-red-700 mt-2">
                    You've used <strong>{currentUsage} of {limit}</strong> available in your free plan.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {benefits.title}
            </h3>
            <p className="text-gray-600">
              Get unlimited access and premium features
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-gray-900">{benefits.price}</div>
                <div className="text-gray-600">/month</div>
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                {benefits.trial}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Cancel anytime. No questions asked.
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span>Everything in Premium includes:</span>
            </div>
            {benefits.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                window.location.href = '/subscription-plans';
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Start Free Trial
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              💳 Secure payment • ⚡ Instant activation • 🔒 Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
