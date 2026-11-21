// Subscription status as sent by GET /hospital/dashboard/subscription.
// The backend (services/subscriptionService.ts) uses 'Pending' | 'Active' | 'Expiring Soon' | 'Expired'
// and does not send isExpired / isExpiringSoon booleans, so derive them here.
// 'Pending Payment' (older frontend wording) is accepted as an alias of 'Pending'.
export type SubscriptionStatus = 'Pending' | 'Active' | 'Expiring Soon' | 'Expired';

export const normalizeSubscriptionStatus = (status?: string | null): SubscriptionStatus | undefined => {
    if (!status) return undefined;
    if (status === 'Pending' || status === 'Pending Payment') return 'Pending';
    if (status === 'Active' || status === 'Expiring Soon' || status === 'Expired') return status;
    return undefined;
};

export const subscriptionFlags = (hospital?: { subscriptionStatus?: string | null; isExpired?: boolean; isExpiringSoon?: boolean } | null) => {
    const status = normalizeSubscriptionStatus(hospital?.subscriptionStatus);
    return {
        status,
        isPending: status === 'Pending',
        isExpired: hospital?.isExpired === true || status === 'Expired',
        isExpiringSoon: hospital?.isExpiringSoon === true || status === 'Expiring Soon',
    };
};
