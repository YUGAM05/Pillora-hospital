/**
 * ⚠️ UNVERIFIED MARKETING CLAIMS: single place to edit or remove them.
 *
 * Shown on the hospital homepage today but not verified during the SEO audit
 * (18 Nov 2026). Kept unchanged until the owner decides.
 *
 *   TODO(verify-claims): confirm each with evidence, edit, or delete it (and
 *   remove its usage in src/app/HomeClient.tsx). Do NOT reuse on new pages.
 */
export const UNVERIFIED_CLAIMS = {
    /** "Trusted by 500+ Hospitals": site data showed 2 hospitals at audit time */
    trustedByHospitals: { kicker: 'Trusted by', value: '500+ Hospitals' },
    /** "99.9% Uptime": no SLA or monitoring evidence on record */
    uptime: { value: '99.9%', label: 'Uptime' },
    /** "24/7 Live Support": no support rota / SLA on record */
    liveSupport: { kicker: '24/7', value: 'Live Support' },
    /** Security section heading: "Compliant" with which standard is unspecified */
    securityHeading: 'Secure, Compliant & Reliable.',
    /** Security section copy: "enterprise-grade encryption" not documented */
    securityCopy:
        'Your hospital data is protected with enterprise-grade encryption. We ensure strict multi-tenancy so your records remain private and accessible only to your authorized personnel.',
    /** Feature card: the QA review (Nov 2026) found paid slots can be double-booked */
    appointmentEngineCopy:
        'Generate real-time consultation slots with customizable durations. Prevent double-bookings with atomic slot locking.',
} as const;
