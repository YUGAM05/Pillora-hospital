/**
 * AI receptionist numbers are stored as digits with the country code
 * (e.g. 912269857389). Shown as +91 22 6985 7389 (landline) or
 * +91 98765 43210 (mobile).
 */
export const formatAiNumber = (digits: string) => {
    const d = String(digits).replace(/\D/g, "");
    if (d.length === 12 && d.startsWith("91")) {
        const r = d.slice(2);
        return /^[6-9]/.test(r) ? `+91 ${r.slice(0, 5)} ${r.slice(5)}` : `+91 ${r.slice(0, 2)} ${r.slice(2, 6)} ${r.slice(6)}`;
    }
    return `+${d}`;
};
