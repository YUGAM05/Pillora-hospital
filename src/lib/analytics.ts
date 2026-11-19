/**
 * GA4 conversion events for www.pillorahospital.in. Safe no-op when GA4 is
 * not configured (NEXT_PUBLIC_GA4_ID unset) or blocked by the browser.
 *
 * Events in use:
 *   partner_click – a partner request was submitted (homepage "Partner with us" modal, /partners form)
 *   demo_request  – reserved for the "Request a demo" form (Step 3)
 * No personal data (names, phone numbers, emails) is ever sent.
 */
export type ConversionEvent = 'demo_request' | 'partner_click';

export const trackEvent = (name: ConversionEvent, params: Record<string, string | number | boolean> = {}) => {
    try {
        const w = window as unknown as { gtag?: (...args: unknown[]) => void };
        if (typeof w.gtag === 'function') w.gtag('event', name, params);
    } catch {
        /* never break the app for analytics */
    }
};
