/**
 * Marketing copy for www.pillorahospital.in.
 *
 * RULES (agreed with the owner, Nov 2026):
 *  - Describe ONLY verified capabilities (list below). No statistics,
 *    customer counts, testimonials, ratings, awards or prices.
 *  - Never reuse anything from src/content/claims.ts on these pages.
 *  - Do not say "real-time": the dashboard and pillora.in share one backend,
 *    so changes are synced/shared (visible on the next page load). Live push
 *    is not available in production.
 *  - Anything that needs a real fact is a TODO.
 */

export interface Capability {
    id: string;
    title: string;
    summary: string;
    details: string[];
}

/** Verified capabilities (owner-confirmed list + behaviour checked in code). */
export const CAPABILITIES: Capability[] = [
    {
        id: 'online-booking',
        title: 'Online appointment booking for patients',
        summary:
            'Patients find your hospital or clinic on Pillora.in, pick a doctor and a free slot, and book an appointment online.',
        details: [
            'Your hospital page on Pillora.in lists your doctors, their consultation fees and their open slots.',
            'Patients choose a date and a slot and confirm the booking themselves.',
            'Each booking appears in your hospital dashboard with the patient’s details and slot time.',
        ],
    },
    {
        id: 'walk-in',
        title: 'Offline and walk-in appointment management',
        summary:
            'Register walk-in patients and phone bookings from the same dashboard, so online and offline appointments share one schedule.',
        details: [
            'Book a walk-in appointment for a patient at the front desk in a few steps.',
            'Walk-in and online appointments appear together, so staff see one list per doctor and day.',
            'Update an appointment’s status as the patient moves through the visit.',
        ],
    },
    {
        id: 'scheduling',
        title: 'Digital scheduling with flexible slots',
        summary:
            'Each doctor’s availability is set as slots: choose the date, start and end time, and the length of each consultation slot.',
        details: [
            'Set timings per doctor instead of maintaining a shared paper register.',
            'Choose a slot length that suits each doctor’s consultations.',
            'Change or cancel upcoming slots from the dashboard when a doctor’s plans change.',
        ],
    },
    {
        id: 'advance-payment',
        title: 'Advance online consultation fee payment',
        summary:
            'Patients can pay part of the consultation fee online when they book, and the rest at your clinic.',
        details: [
            'Online advance payments are recorded against the appointment.',
            'Your dashboard shows what was paid online and what is still due at the clinic.',
            // TODO(confirm-advance-share): state the advance percentage only after the owner confirms it is fixed policy.
        ],
    },
    {
        id: 'doctor-directory',
        title: 'Doctor directory with availability and fees',
        summary:
            'List your doctors with their specialisation, consultation fee and availability, so patients know who to see before they visit.',
        details: [
            'Add doctors individually, or as a specialty group when patients book a department rather than a named doctor.',
            'Show each doctor’s consultation fee on your Pillora.in hospital page.',
            'Patients see the slots each doctor has opened.',
        ],
    },
    {
        id: 'synced',
        title: 'Synced with the Pillora.in booking portal',
        summary:
            'Doctors, schedules and fees you manage in the hospital dashboard are shared with your hospital page on Pillora.in.',
        details: [
            'There is no second system to update: the dashboard and Pillora.in use the same data.',
            'New slots and fee changes show on Pillora.in the next time a patient loads your page.',
            'Bookings made by patients on Pillora.in appear in your dashboard.',
        ],
    },
];

export interface Faq {
    question: string;
    answer: string;
    /** true when the answer still needs the owner to supply a fact */
    todo?: boolean;
}

/** 10 FAQs. Answers use only verified capabilities; unknowns are TODO. */
export const FAQS: Faq[] = [
    {
        question: 'What is Pillora for Hospitals?',
        answer:
            'Pillora for Hospitals is appointment and doctor schedule software for hospitals and clinics in India. It lets you take online appointments through Pillora.in, manage walk-in and offline appointments, set doctor slots, accept advance consultation fee payments and keep a doctor directory with availability and fees.',
    },
    {
        question: 'How do patients book an appointment with our doctors?',
        answer:
            'Patients open your hospital page on Pillora.in, choose a doctor, pick a date and an open slot, and confirm the booking. The appointment then appears in your hospital dashboard.',
    },
    {
        question: 'Can we manage walk-in and phone appointments too?',
        answer:
            'Yes. Front-desk staff can book walk-in and offline appointments from the hospital dashboard, so online and walk-in patients share one schedule for each doctor.',
    },
    {
        question: 'How are doctor slots set up?',
        answer:
            'Slots are set per doctor: you choose the date, the start and end time, and the length of each consultation slot. Doctors with different consultation lengths can have different slot durations.',
    },
    {
        question: 'Can patients pay the consultation fee in advance?',
        answer:
            'Yes. Patients can pay part of the consultation fee online when they book and pay the rest at your clinic. The dashboard shows what was paid online and what is still due.',
    },
    {
        question: 'Will our doctors and fees be shown on Pillora.in?',
        answer:
            'Yes. Your hospital page on Pillora.in lists your doctors with their specialisation, consultation fee and open slots, taken from what you manage in the dashboard.',
    },
    {
        question: 'Do changes in the dashboard show on Pillora.in?',
        answer:
            'Yes. The dashboard and Pillora.in use the same data, so new slots, doctors and fee changes are shown on your Pillora.in page the next time a patient opens it.',
    },
    {
        question: 'Is it suitable for a single-doctor clinic as well as a hospital?',
        answer:
            'Yes. A clinic can start with one doctor, and a hospital can add many doctors and specialty groups. Each doctor has their own slots and fee.',
    },
    {
        question: 'How much does Pillora for Hospitals cost?',
        // TODO(pricing): add pricing or plan information once the owner publishes it. Do not invent prices.
        answer:
            'Pricing depends on your hospital or clinic. Use the Get a quote page to tell us about your setup and we will send you a quote.',
        todo: true,
    },
    {
        question: 'How do we get started?',
        // TODO(onboarding): add typical onboarding steps and timeline once confirmed by the owner.
        answer:
            'Request a demo or a quote with your hospital or clinic details. The Pillora team sets up your hospital account and doctors, and then you can manage appointments from the hospital dashboard.',
        todo: true,
    },
];

/** Sections of the site, used by the header, footer and internal links. */
export const NAV_LINKS = [
    { href: '/features', label: 'Features' },
    { href: '/for-clinics', label: 'For clinics' },
    { href: '/for-hospitals', label: 'For hospitals' },
    { href: '/get-a-quote', label: 'Pricing' },
    { href: '/faq', label: 'FAQ' },
    { href: '/blog', label: 'Blog' },
] as const;

export const PATIENT_SITE = 'https://www.pillora.in';

/** Header links on public pages (owner brief, 19 Nov 2026). The footer keeps the full NAV_LINKS. */
export const HEADER_LINKS = [
    { href: '/features', label: 'Features' },
    { href: '/for-clinics', label: 'For Clinics' },
    { href: '/for-hospitals', label: 'For Hospitals' },
    { href: '/faq', label: 'FAQ' },
] as const;

/** Contact details shown on the homepage and in the footer. */
export const SUPPORT_PHONE = { display: '9429167856', tel: '+919429167856' } as const;

/** Registered address, as already published on the About page (src/app/about/page.tsx). */
export const REGISTERED_ADDRESS = '4 Pansheel Society, Jintan Road, Infront of Ultra Vision School, Surendranagar - 363002, Gujarat, India';

/**
 * Feature flag for the "Advance online payments" card on the homepage.
 * TODO(confirm-advance-payments) [CONFIRM]: keep false until the owner approves AND the
 * paid-slot double-booking bug is fixed (Pillora-backend paymentController.verifyPayment).
 */
export const SHOW_ADVANCE_PAYMENTS_CARD = false;

/**
 * Homepage FAQ (also emitted as FAQPage JSON-LD on "/"). Answers reuse the /faq
 * answers where one exists, or the owner's homepage copy.
 */
export const HOME_FAQS: Faq[] = [
    {
        question: 'What is Pillora?',
        answer:
            'Pillora is a healthcare technology platform that helps hospitals, clinics and doctors manage appointments digitally. Patients find your doctors and book available slots online on pillora.in. Your team manages online and walk-in appointments from the hospital dashboard.',
    },
    {
        question: 'Who is Pillora for?',
        answer:
            'Hospitals, clinics and individual doctors in India. Hospitals manage appointments across doctors and departments, clinics replace phone calls and paper registers, and individual doctors set their own available slots for patients to book online.',
    },
    {
        question: 'Can I manage walk-in patients too?',
        answer:
            'Yes. Front-desk staff can book walk-in and offline appointments from the hospital dashboard, so online and walk-in patients share one schedule for each doctor.',
    },
    {
        question: 'Can doctors set their own slots?',
        answer:
            'Yes. Slots are set per doctor: you choose the date, the start and end time, and the length of each consultation slot. Doctors with different consultation lengths can have different slot durations.',
    },
    {
        question: 'What is the AI receptionist?',
        // TODO(confirm-ai-availability) [CONFIRM]: "optional add-on" / "early access" wording.
        answer:
            'An optional add-on that answers patient phone calls for your hospital or clinic. Patients speak in Gujarati or Hindi, and the AI finds a free slot with the right doctor and books the appointment. It is in early access for partner hospitals, and you can try a live demo on this page.',
        todo: true,
    },
    {
        question: 'Can the AI receptionist book a wrong time?',
        answer:
            'It only offers times that are free for that doctor. Before booking, it reads the doctor, day, time and patient name back to the caller and books only after the caller confirms. It will not book a time the caller did not choose.',
    },
    {
        question: 'Which languages does the AI receptionist speak?',
        answer: 'Gujarati and Hindi. Patients can speak naturally, the way they would talk to your reception staff.',
    },
    {
        question: 'How do I get started?',
        // TODO(onboarding) [CONFIRM]: real onboarding steps (same as /faq).
        answer:
            'Request a demo or a quote with your hospital or clinic details. The Pillora team sets up your hospital account and doctors, and then you can manage appointments from the hospital dashboard.',
        todo: true,
    },
    {
        question: 'How much does it cost?',
        // TODO(pricing) [CONFIRM]: owner-approved answer; no prices until confirmed.
        answer: 'Pricing depends on your needs. Request a quote.',
        todo: true,
    },
];
