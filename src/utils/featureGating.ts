export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentUsage?: number;
  limit?: number;
}

export async function getUserSubscription(userId: string) {

  const localSubscription = JSON.parse(
    localStorage.getItem('subscription') || 'null'
  );

  if (localSubscription?.active) {
    return {
      subscription: localSubscription,
      plan: {
        name: localSubscription.plan,
        features: ['all'],
        limits: {}
      }
    };
  }

  return {
    subscription: null,
    plan: null
  };
}

export async function checkFeatureAccess(
  userId: string,
  featureKey: string
): Promise<FeatureAccess> {

  const localSubscription = JSON.parse(
    localStorage.getItem('subscription') || 'null'
  );

  if (localSubscription?.active) {
    return {
      hasAccess: true
    };
  }

  return {
    hasAccess: false,
    reason: 'No active subscription found',
    upgradeRequired: true
  };
}

export async function checkUsageLimit(
  userId: string,
  limitKey: string
): Promise<FeatureAccess> {

  const localSubscription = JSON.parse(
    localStorage.getItem('subscription') || 'null'
  );

  if (localSubscription?.active) {
    return {
      hasAccess: true,
      reason: 'Unlimited usage',
      currentUsage: 0,
      limit: -1
    };
  }

  return {
    hasAccess: false,
    reason: 'No active subscription found',
    upgradeRequired: true
  };
}

export async function getUsageStats(userId: string) {
  return {};
}

export async function incrementUsage() {
  return true;
}

export function getFeatureDisplayName(featureKey: string): string {
  return featureKey;
}

export function formatLimit(limit: number, unit?: string): string {

  if (limit === -1) return 'Unlimited';

  return limit.toString();
}

export async function canPerformAction(
  userId: string,
  action:
    | 'create_journey'
    | 'create_consultation'
    | 'create_post'
    | 'add_dependent'
    | 'send_message'
): Promise<FeatureAccess> {

  const localSubscription = JSON.parse(
    localStorage.getItem('subscription') || 'null'
  );

  if (localSubscription?.active) {
    return {
      hasAccess: true
    };
  }

  return {
    hasAccess: false,
    reason: 'No active subscription'
  };
}