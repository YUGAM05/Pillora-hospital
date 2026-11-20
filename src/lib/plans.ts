// Plan codes stored on the hospital (Hospital.plan) -> the names shown to people.
// Clinic ₹2,999 · Hospital ₹7,999 · Enterprise ₹14,999 a month (+ GST).
export const PLAN_LABEL: Record<string, string> = { Standard: 'Clinic', Premium: 'Hospital', Enterprise: 'Enterprise' };

export const planLabel = (code?: string | null) => PLAN_LABEL[code ?? ''] ?? 'Clinic';
