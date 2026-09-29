# Subscription System Setup Guide

This guide explains how to set up and integrate Stripe subscriptions into the Healdox healthcare platform.

## Overview

The subscription system includes:
- **Tiered Plans**: Free, Premium, Professional, and Enterprise tiers
- **Role-Based Plans**: Separate plans for patients, physicians, and pharma companies
- **Usage Tracking**: Monitor and enforce feature limits
- **Stripe Integration**: Secure payment processing
- **Referral System**: Reward users for referrals

## Database Schema

The system uses the following tables:
- `subscription_plans` - Available subscription tiers and their features
- `subscriptions` - User subscription records
- `usage_tracking` - Track feature usage against limits
- `subscription_history` - Audit trail of all subscription changes
- `referral_codes` - User referral codes
- `referral_usage` - Track referral rewards

## Stripe Setup

### 1. Create a Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Get your API keys from the Dashboard

### 2. Configure Stripe Products and Prices

For each subscription plan, create:
1. A **Product** in Stripe Dashboard
2. **Monthly Price** for the product
3. **Yearly Price** for the product (with discount)

### 3. Add Stripe Keys to Environment Variables

Update your `.env` file with Stripe keys:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Update Database with Stripe IDs

Run SQL to update subscription plans with Stripe product/price IDs:

```sql
UPDATE subscription_plans
SET
  stripe_product_id = 'prod_...',
  stripe_price_id_monthly = 'price_...',
  stripe_price_id_yearly = 'price_...'
WHERE name = 'patient_premium';
```

### 5. Configure Stripe Webhooks

Set up webhook endpoint in Stripe Dashboard:

**Endpoint URL**: `https://[your-project]..co/functions/v1/stripe-webhooks`

**Events to listen for**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Usage

### Display Subscription Plans

```tsx
import { SubscriptionPlans } from './components/SubscriptionPlans';

function App() {
  const handleSelectPlan = (plan, billingCycle) => {
    // Redirect to Stripe Checkout or handle subscription creation
    console.log('Selected plan:', plan, billingCycle);
  };

  return <SubscriptionPlans onSelectPlan={handleSelectPlan} />;
}
```

### Show Subscription Management

```tsx
import { SubscriptionManagement } from './components/SubscriptionManagement';

function ProfilePage() {
  return (
    <div>
      <h1>My Subscription</h1>
      <SubscriptionManagement />
    </div>
  );
}
```

### Check Feature Access

```tsx
import { checkFeatureAccess, checkUsageLimit } from './utils/featureGating';

async function createHealthJourney() {
  const userId = user.id;

  // Check if user has reached their limit
  const access = await checkUsageLimit(userId, 'journeys_per_month');

  if (!access.hasAccess) {
    // Show upgrade prompt
    setUpgradePrompt({
      isOpen: true,
      feature: 'Health Journeys Limit Reached',
      description: access.reason,
      currentUsage: access.currentUsage,
      limit: access.limit
    });
    return;
  }

  // Create journey
  // ... create journey logic

  // Increment usage
  await incrementUsage(userId, 'journeys_per_month');
}
```

### Show Upgrade Prompt

```tsx
import { UpgradePrompt } from './components/UpgradePrompt';

function MyComponent() {
  const [upgradePrompt, setUpgradePrompt] = useState({ isOpen: false });

  return (
    <UpgradePrompt
      isOpen={upgradePrompt.isOpen}
      onClose={() => setUpgradePrompt({ isOpen: false })}
      feature={upgradePrompt.feature}
      description={upgradePrompt.description}
      currentUsage={upgradePrompt.currentUsage}
      limit={upgradePrompt.limit}
    />
  );
}
```

## Feature Gating Examples

### Limit Health Journey Posts

```tsx
import { canPerformAction, incrementUsage } from './utils/featureGating';

const handleCreateJourney = async () => {
  const access = await canPerformAction(user.id, 'create_journey');

  if (!access.hasAccess) {
    showUpgradePrompt('Health Journeys', access.reason, access.currentUsage, access.limit);
    return;
  }

  // Create journey
  await createJourney();

  // Track usage
  await incrementUsage(user.id, 'journeys_per_month');
};
```

### Check Dependent Limit

```tsx
import { checkUsageLimit } from './utils/featureGating';

const handleAddDependent = async () => {
  const access = await checkUsageLimit(user.id, 'dependents_max');

  if (!access.hasAccess) {
    showUpgradePrompt('Family Members',
      `You can add up to ${access.limit} family members on the free plan`,
      access.currentUsage,
      access.limit
    );
    return;
  }

  // Add dependent
  await addDependent();
};
```

### Check Storage Limit

```tsx
import { checkUsageLimit } from './utils/featureGating';

const handleUploadFile = async (fileSize: number) => {
  const access = await checkUsageLimit(user.id, 'storage_mb');

  const fileSizeMB = fileSize / (1024 * 1024);

  if (access.currentUsage + fileSizeMB > access.limit) {
    showUpgradePrompt('Storage Limit',
      `Your storage limit is ${access.limit}MB. Upgrade for more space.`,
      access.currentUsage,
      access.limit
    );
    return;
  }

  // Upload file
  await uploadFile();

  // Update usage
  await incrementUsage(user.id, 'storage_mb');
};
```

## Creating Stripe Checkout Session

```tsx
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const handleSubscribe = async (priceId: string) => {
  // Call your backend to create checkout session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      userId: user.id,
      successUrl: `${window.location.origin}/subscription-success`,
      cancelUrl: `${window.location.origin}/subscription-canceled`,
    }),
  });

  const { sessionId } = await response.json();

  // Redirect to Stripe Checkout
  await stripe.redirectToCheckout({ sessionId });
};
```

## Default Plans

The system comes pre-configured with these plans:

### Patient Plans
1. **Free** - Basic membership ($0/month)
   - 3 journeys/month, 2 consultations/month, 50 connections, 2 dependents, 100MB storage

2. **Premium** - Enhanced features ($9.99/month or $99/year)
   - Unlimited journeys, unlimited consultations, 2 video credits/month, 10 dependents, 5GB storage

3. **Family** - Complete family care ($19.99/month or $199/year)
   - Everything in Premium + 6 family members, pediatric priority, family dashboard

### Physician Plans
1. **Free** - Basic provider ($0/month)
   - 10 consultations/month, 5 posts/month, 30 connections, 3 specialties

2. **Professional** - Practice growth ($29.99/month or $299/year)
   - Unlimited consultations, featured listing, telemedicine, e-prescription, analytics

3. **Enterprise** - Clinic/Hospital ($99.99/month or $999/year)
   - Everything in Professional + 20 providers, API access, custom branding, EHR integration

### Pharma Plans
1. **Free** - Research access ($0/month)
   - View public data only

2. **Industry Partner** - Full access ($499/month or $4999/year)
   - Data requests, physician messaging, clinical trial recruitment, compliance tools

## Referral System

Each user gets a unique referral code. When a referred user subscribes:
- Referrer gets 30 days free credit
- Referred user gets standard trial period

```tsx


## Security Considerations

1. **Webhook Verification**: The webhook handler verifies Stripe signatures
2. **RLS Policies**: Users can only view/modify their own subscriptions
3. **Service Role**: Webhook handler uses service role for admin operations
4. **Feature Gates**: Always check limits server-side before critical operations

## Testing

### Test Mode
Use Stripe test keys to test without real payments:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

### Trigger Webhooks Manually
Use Stripe CLI to forward webhooks to local development:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhooks
```

## Troubleshooting

### Webhook not working
- Verify webhook secret matches Stripe Dashboard
- Check edge function logs in Supabase
- Ensure endpoint is publicly accessible

### Usage limits not enforcing
- Check that period_end is set correctly on usage_tracking
- Verify subscription has current_period_end date
- Check RLS policies allow reading usage_tracking

### Plan features not showing
- Ensure features are stored as JSON array
- Check that is_active is true on subscription_plans
- Verify role matches user's profile role

## Support

For issues or questions:
- Check Supabase logs for errors
- Review Stripe Dashboard for payment issues
- Verify webhook deliveries in Stripe Dashboard
