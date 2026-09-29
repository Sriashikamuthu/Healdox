import { useState } from 'react';
import { useAuth } from "../contexts/AuthContext";
import {
  Check,
  Sparkles,
  Crown,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export function SubscriptionPlans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activePlan, setActivePlan] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { user } = useAuth();

  const plans = [
    {
      id: 1,
      name: 'Basic',
      priceMonthly: 7,
      priceYearly: 70,
      popular: false,
      icon: ShieldCheck,
      features: [
        'Appointment Management',
        'Medical Records',
        'Consultation Access',
        'Basic Support',
      ],
      disabled: [
        'Video Consultations',
        'Family Sharing',
        'Priority Support',
      ],
    },
    {
      id: 2,
      name: 'Advance',
      priceMonthly: 9,
      priceYearly: 90,
      popular: true,
      icon: Sparkles,
      features: [
        'Everything in Basic',
        'Video Consultations',
        'AI Health Tracking',
        'Priority Support',
        'Family Sharing',
        'Health Reports',
      ],
      disabled: ['Advanced Analytics'],
    },
    {
      id: 3,
      name: 'Premium',
      priceMonthly: 12,
      priceYearly: 120,
      popular: false,
      icon: Crown,
      features: [
        'Everything in Advance',
        'Unlimited Consultations',
        'Advanced Analytics',
        'Dedicated Support',
        'Enterprise Features',
        'Medical Insights',
      ],
      disabled: [],
    },
  ];

  let storedUser: any = {};

  try {
    const user = localStorage.getItem("user");

    storedUser =
      user && user !== "undefined"
        ? JSON.parse(user)
        : {};
  } catch {
    storedUser = {};
  }

  const handlePayment = async (plan: any, price: number) => {

  let storedUser: any = {};

  try {
    const user = localStorage.getItem("user");

    storedUser =
      user && user !== "undefined"
        ? JSON.parse(user)
        : {};
  } catch {
    storedUser = {};
  }

    const billingCycle = 'monthly';

    const options = {

      key: 'rzp_test_SrAN2xghe12QIo',

      amount: price * 100,

      currency: 'INR',

      name: 'Healdox',

      description: `${plan.name} Subscription`,

      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
      },

      retry: {
        enabled: false,
      },

      handler: async function (response: any) {

        console.log('PAYMENT SUCCESS');

        console.log('RAZORPAY RESPONSE:', response);

        console.log('USER:', storedUser);

        console.log('FETCH STARTING');

        try {

          // SAVE SUBSCRIPTION TO DATABASE
          const result = await fetch(
            'http://localhost:5000/api/subscription/save',
            {
              method: 'POST',

              headers: {
                'Content-Type': 'application/json',
              },

              body: JSON.stringify({

                user_email: storedUser?.email || 'test@gmail.com',

                plan_name: plan.name,

                amount: price,

                billing_cycle:
                  price === plan.priceYearly
                    ? 'yearly'
                    : 'monthly',

                payment_id: response.razorpay_payment_id,

              }),
            }
          );

          const data = await result.json();

          console.log('API RESPONSE:', data);

          // SAVE TO LOCAL STORAGE
          localStorage.setItem(
            `subscription_${user?.email}`,
            JSON.stringify({
              active: true,
              plan: plan.name,
              amount: price,                
              billing_cycle:
                  price === plan.priceYearly
                    ? 'yearly'
                    : 'monthly',
              status: 'Active'
            })
          );

          setActivePlan({
            active: true,
            plan: plan.name,
            amount: price,
            billing_cycle:
                price === plan.priceYearly
                  ? 'yearly'
                  : 'monthly',
            status: 'Active'
          });          

          alert(`Payment successful for ${plan.name}`);

          window.location.href = '/subscriptions';

        } catch (error) {

          console.error('FETCH ERROR:', error);

          alert('Subscription save failed');

        }

      },

      theme: {
        color: '#2563eb',
      },

    };

    const razorpay = new (window as any).Razorpay(options);

    razorpay.open();

  };

  return (
    <div className="w-full py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Choose Your Plan
        </h1>

        <p className="text-gray-600 text-lg">
          Select the perfect plan for your healthcare journey
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 inline-flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Monthly
          </button>

          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = plan.icon;

          const price =
            billingCycle === 'monthly'
              ? plan.priceMonthly
              : plan.priceYearly;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                plan.popular
                  ? 'border-blue-600 scale-105'
                  : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-xl">
                  Most Popular
                </div>
              )}

              <div className="p-8">

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                    plan.popular
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-bold text-gray-900">
                      ${price}
                    </span>

                    <span className="text-gray-500 mb-1">
                      /month
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8 min-h-[260px]">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />

                      <span className="text-gray-700 text-sm">
                        {feature}
                      </span>
                    </div>
                  ))}

                  {plan.disabled.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 opacity-40"
                    >
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />

                      <span className="text-sm line-through text-gray-500">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() =>
                    handlePayment(
                      plan,
                      billingCycle === 'yearly'
                        ? plan.priceYearly
                        : plan.priceMonthly
                    )
                  }
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-900'
                  }`}
                >
                  Choose Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison */}
      <div className="mt-10">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="w-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition rounded-xl py-4 flex items-center justify-center gap-2 text-gray-700 font-medium"
        >
        {showComparison
          ? 'Hide Detailed Plan Comparison'
          : 'Show Detailed Plan Comparison'}

          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showComparison ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {showComparison && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-900">
                  Features
                </th>

                <th className="px-6 py-4 text-center font-semibold text-gray-900">
                  Basic
                </th>

                <th className="px-6 py-4 text-center font-semibold text-blue-600">
                  Advance
                </th>

                <th className="px-6 py-4 text-center font-semibold text-gray-900">
                  Premium
                </th>
              </tr>
            </thead>

            <tbody>
              {[
                ['Appointment Management', true, true, true],
                ['Medical Records', true, true, true],
                ['Video Consultations', false, true, true],
                ['AI Health Tracking', false, true, true],
                ['Family Sharing', false, true, true],
                ['Advanced Analytics', false, false, true],
                ['Dedicated Support', false, false, true],
                ['Enterprise Features', false, false, true],
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100"
                >
                  <td className="px-6 py-4 text-gray-700">
                    {row[0]}
                  </td>

                  <td className="text-center py-4">
                    {row[1] ? '✅' : '❌'}
                  </td>

                  <td className="text-center py-4">
                    {row[2] ? '✅' : '❌'}
                  </td>

                  <td className="text-center py-4">
                    {row[3] ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}  

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Confirm Subscription
            </h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold">
                  {selectedPlan.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Billing</span>
                <span className="font-semibold capitalize">
                  {selectedPlan.billingCycle}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-blue-600">
                  ${selectedPlan.price}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  alert(`Subscribed to ${selectedPlan.name}`);
                  setSelectedPlan(null);
                }}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}          

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        All plans include secure healthcare data encryption & HIPAA compliance
      </div>
    </div>
  );
}