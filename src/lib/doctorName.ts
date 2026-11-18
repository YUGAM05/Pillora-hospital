/**
 * Display helpers for doctor / specialty-group names.
 * Specialty groups ("Gastro Specialty Group") must not get a "Dr." prefix,
 * and names already starting with "Dr" must not become "Dr. Dr. …".
 */
type DoctorLike = string | { name?: string; isSpecialtyGroup?: boolean } | null | undefined;

const GROUP_PATTERN = /\b(group|department|dept|team|unit|clinic|centre|center|ward)\b/i;

const nameOf = (d: DoctorLike): string => (typeof d === 'string' ? d : d?.name || '').trim();

export const isSpecialtyGroup = (d: DoctorLike): boolean => {
    if (d && typeof d === 'object' && d.isSpecialtyGroup) return true;
    return GROUP_PATTERN.test(nameOf(d));
};

/** "Dr. Dilip Delivala", "Gastro Specialty Group", or a fallback. */
export const doctorLabel = (d: DoctorLike, fallback = 'Doctor'): string => {
    const name = nameOf(d);
    if (!name) return fallback;
    if (isSpecialtyGroup(d) || /^dr\.?\s/i.test(name)) return name;
    return `Dr. ${name}`;
};

/** Short label for charts: "Dr. Delivala" or "Gastro Group". */
export const doctorShortLabel = (d: DoctorLike): string => {
    const name = nameOf(d).replace(/^dr\.?\s+/i, '');
    if (!name) return 'Doctor';
    if (isSpecialtyGroup(d)) {
        const words = name.split(/\s+/);
        return words.length > 2 ? `${words[0]} ${words[words.length - 1]}` : name;
    }
    return `Dr. ${name.split(/\s+/).pop()}`;
};
