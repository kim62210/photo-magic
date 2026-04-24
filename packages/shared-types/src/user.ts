export type SubscriptionTier = 'free' | 'pro' | 'pro-plus';

export interface Quota {
  aiEnhanceDaily: number;
  backgroundRemovalDaily: number;
  snsUploadDaily: number;
  maxResolution: number;
  priority: 'low' | 'normal' | 'high';
}

export const QUOTA_BY_TIER: Record<SubscriptionTier, Quota> = {
  free: {
    aiEnhanceDaily: 3,
    backgroundRemovalDaily: 3,
    snsUploadDaily: 5,
    maxResolution: 2048,
    priority: 'low',
  },
  pro: {
    aiEnhanceDaily: 50,
    backgroundRemovalDaily: 50,
    snsUploadDaily: 50,
    maxResolution: 4096,
    priority: 'normal',
  },
  'pro-plus': {
    aiEnhanceDaily: Number.POSITIVE_INFINITY,
    backgroundRemovalDaily: Number.POSITIVE_INFINITY,
    snsUploadDaily: Number.POSITIVE_INFINITY,
    maxResolution: 8192,
    priority: 'high',
  },
};

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  birthYear?: number;
  createdAt: string;
}
