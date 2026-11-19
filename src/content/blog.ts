/**
 * Clinic-focused articles for www.pillorahospital.in/blog.
 *
 * Publishing workflow:
 *  - `draft: true` articles are NOT rendered in production (404), are always
 *    noindex and never appear in the sitemap. Set SHOW_DRAFTS=true locally to
 *    review them.
 *  - To publish: get the article reviewed, fill in every TODO, set
 *    `draft: false` and `datePublished`.
 *  - Same rules as src/content/marketing.ts: verified capabilities only,
 *    no statistics or claims from src/content/claims.ts, no "real-time".
 */

export interface ArticleSection {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
}

export interface ArticleSource {
    title: string;
    url?: string;
    /** true when the source still needs to be found and checked */
    todo?: boolean;
}

export interface BlogArticle {
    slug: string;
    title: string;
    /** ≤155 chars, used as meta description */
    description: string;
    draft: boolean;
    datePublished?: string; // ISO date, set when publishing
    dateModified?: string;
    readTime: string;
    intro: string;
    sections: ArticleSection[];
    faqs: { question: string; answer: string }[];
    /** Internal links to product pages shown at the end of the article */
    related: { href: string; label: string }[];
    sources: ArticleSource[];
    /** TODO(reviewer): name and role of the person who reviewed the article */
    reviewer?: string;
}

export const BLOG_ARTICLES: BlogArticle[] = [
    {
        slug: 'reduce-patient-no-shows-clinic',
        title: 'How to reduce patient no-shows in your clinic',
        description:
            'Practical steps to reduce missed appointments in your clinic: clear booking, reminders, advance payment, easy rescheduling and a tidy walk-in process.',
        draft: true,
        readTime: '6 min read',
        intro:
            'A patient who books and does not turn up costs your clinic a consultation slot that another patient could have used. No-shows cannot be removed completely, but a few habits at the front desk and in how you take bookings make them less common and easier to absorb.',
        sections: [
            {
                heading: 'Know your no-show pattern first',
                paragraphs: [
                    'Before changing anything, look at the last few weeks of appointments. Note which days, times and doctors have the most missed visits, and whether they are first visits or follow-ups.',
                    'A simple tally in your register or appointment software is enough. The pattern tells you where to act: early-morning slots, a particular doctor’s Monday clinic, or patients who booked far in advance.',
                ],
            },
            {
                heading: 'Make booking clear and confirmed',
                paragraphs: [
                    'Many no-shows are patients who were never sure their appointment was fixed. Confirm the date, time, doctor and clinic address at the moment of booking, and keep it in writing where the patient can find it again.',
                    'When patients book a specific slot themselves online, they choose a time that suits them, which can make the appointment easier to keep than a time given over the phone.',
                ],
            },
            {
                heading: 'Remind patients before the visit',
                paragraphs: [
                    'A reminder the day before and on the morning of the appointment helps patients plan around it. Keep it short: doctor, date, time and how to reschedule if they cannot come.',
                    // TODO(verify-reminders): only mention Pillora reminders here if appointment reminders are confirmed as a live, owner-approved feature.
                ],
            },
            {
                heading: 'Ask for a small advance payment',
                paragraphs: [
                    'Paying part of the consultation fee when booking is a small commitment. It can encourage patients to come, or to tell you early if they cannot, so the slot can be offered to someone else.',
                    'Keep the advance small and explain clearly what happens to it if the patient cancels, so it does not put people off booking.',
                    // TODO(policy): link the clinic's refund/cancellation policy once the owner confirms the wording to use.
                ],
            },
            {
                heading: 'Make rescheduling easy',
                paragraphs: [
                    'A patient who cannot come but finds it hard to reschedule often simply does not turn up. Make it easy to call or message the front desk to move an appointment, and free the original slot straight away.',
                ],
            },
            {
                heading: 'Plan for walk-ins and gaps',
                paragraphs: [
                    'Some no-shows will still happen. If walk-in patients are added to the same schedule as online bookings, staff can see free slots immediately and fill them, instead of keeping two lists.',
                ],
            },
        ],
        faqs: [
            {
                question: 'Should every appointment need an advance payment?',
                answer:
                    'Not necessarily. Many clinics use an advance only for online bookings or for first visits, and keep walk-in and follow-up visits pay-at-clinic. Choose what suits your patients.',
            },
            {
                question: 'What is the simplest first step to reduce no-shows?',
                answer:
                    'Confirm every booking clearly and remind the patient the day before. It needs no new tools and addresses the most common reason for missed visits: patients who forget or are unsure.',
            },
        ],
        related: [
            { href: '/features#advance-payment', label: 'Advance online consultation fee payment' },
            { href: '/features#walk-in', label: 'Walk-in and offline appointment management' },
            { href: '/for-clinics', label: 'Appointment software for clinics' },
        ],
        sources: [
            { title: 'TODO(sources): add a published study or guideline on appointment no-shows, preferably from India', todo: true },
        ],
        reviewer: undefined, // TODO(reviewer)
    },
    {
        slug: 'token-system-vs-time-slot-booking-opd',
        title: 'Token system vs time-slot booking for your OPD',
        description:
            'Compare token queues and time-slot booking for an OPD: how each works, where each fits, and how many clinics combine both with walk-in patients.',
        draft: true,
        readTime: '6 min read',
        intro:
            'Most OPDs in India run on one of two models: a token queue, where patients are seen in order of arrival, or time-slot booking, where each patient gets a fixed time. Each has strengths. Many clinics end up using both.',
        sections: [
            {
                heading: 'How a token system works',
                paragraphs: [
                    'Patients arrive, collect a token number and wait to be called. It is simple to run, needs no booking in advance and suits walk-in heavy clinics.',
                    'The cost is waiting time. Patients cannot plan their day, the waiting area fills up at peak hours, and it is hard to tell a patient how long they will wait.',
                ],
            },
            {
                heading: 'How time-slot booking works',
                paragraphs: [
                    'Each doctor’s day is divided into slots of a fixed length, and each patient books a specific slot. Patients arrive close to their time and the waiting area stays calmer.',
                    'Slots work best when the slot length matches how long the doctor’s consultations really take. A doctor who needs longer per patient should have longer slots.',
                ],
            },
            {
                heading: 'Which one fits your OPD?',
                paragraphs: [
                    'Tokens fit clinics where most patients walk in without planning and consultations are short and similar. Time slots fit clinics where patients travel, consultations vary in length, or the waiting area is small.',
                ],
                bullets: [
                    'Mostly walk-in patients, short visits: a token queue is often enough.',
                    'Patients who plan ahead or travel far: time slots reduce waiting.',
                    'Doctors with different consultation lengths: time slots with a slot length per doctor.',
                ],
            },
            {
                heading: 'Combining both: slots plus walk-ins',
                paragraphs: [
                    'Many clinics offer bookable slots and still accept walk-ins. The key is one shared schedule: when walk-ins are added to the same list as booked slots, staff can see free time and avoid overlaps.',
                ],
            },
            {
                heading: 'Making the switch',
                paragraphs: [
                    'Start with one doctor or one session and choose a slot length based on how long consultations usually take. Keep accepting walk-ins while patients get used to booking, then adjust slot lengths after a few weeks.',
                ],
            },
        ],
        faqs: [
            {
                question: 'Can we keep tokens for walk-ins and still offer online booking?',
                answer:
                    'Yes. Many clinics book some patients into time slots and fit walk-ins around them. What matters is that both are recorded in one schedule.',
            },
            {
                question: 'How long should a consultation slot be?',
                answer:
                    'Base it on how long the doctor’s consultations usually take, and review it after a few weeks. Different doctors can have different slot lengths.',
            },
        ],
        related: [
            { href: '/features#scheduling', label: 'Digital scheduling with flexible doctor slots' },
            { href: '/features#walk-in', label: 'Walk-in appointment management' },
            { href: '/for-hospitals', label: 'OPD appointment management for hospitals' },
        ],
        sources: [
            { title: 'TODO(sources): add a reference on OPD queue management or patient waiting times in Indian hospitals', todo: true },
        ],
        reviewer: undefined, // TODO(reviewer)
    },
    {
        slug: 'paper-register-to-online-appointments-checklist',
        title: 'Moving from paper registers to online appointments: a checklist',
        description:
            'A step-by-step checklist for clinics moving from a paper appointment register to online booking: doctors, slots, fees, walk-ins, staff and patients.',
        draft: true,
        readTime: '7 min read',
        intro:
            'Moving from a paper register to online appointments is less about software and more about preparation. This checklist covers what to decide and gather before you switch, and how to run the first weeks.',
        sections: [
            {
                heading: '1. List your doctors and their timings',
                paragraphs: ['Write down every doctor who sees patients, their specialisation, the days and hours they consult, and their consultation fee. This becomes your doctor directory.'],
            },
            {
                heading: '2. Decide your slot length',
                paragraphs: ['For each doctor, decide how long a typical consultation takes. That is your slot length. It can differ between doctors.'],
            },
            {
                heading: '3. Decide how you will handle walk-ins',
                paragraphs: ['Decide whether walk-ins are fitted into free slots or kept for set hours, and make sure the front desk records them in the same schedule as online bookings.'],
            },
            {
                heading: '4. Choose your advance payment rule',
                paragraphs: ['Decide whether online bookings need part of the fee in advance, and how cancellations and refunds are handled. Write the rule down so staff explain it the same way.'],
            },
            {
                heading: '5. Train the front desk',
                paragraphs: ['Show staff how to find a patient’s booking, add a walk-in, mark a patient as seen and handle a reschedule. Run a few practice bookings before going live.'],
            },
            {
                heading: '6. Tell your patients',
                paragraphs: ['Put a notice at reception and tell patients at the end of their visit that they can book their next appointment online. Share the link to your clinic’s page.'],
            },
            {
                heading: '7. Run both for a short overlap',
                paragraphs: ['Keep the paper register for a short period while staff and patients adjust, then stop using it so there is only one schedule to trust.'],
            },
            {
                heading: '8. Review after a few weeks',
                paragraphs: ['Check whether slot lengths match reality, how many patients book online versus walk in, and whether the advance payment rule is working. Adjust and continue.'],
            },
        ],
        faqs: [
            {
                question: 'Do we need to stop accepting walk-ins when we go online?',
                answer: 'No. Online booking and walk-ins can run together, as long as both are recorded in the same schedule.',
            },
            {
                question: 'What should we prepare before switching?',
                answer: 'A list of doctors with their timings and fees, a slot length per doctor, a walk-in rule, an advance payment rule and a short training session for the front desk.',
            },
        ],
        related: [
            { href: '/features', label: 'Features of Pillora’s hospital appointment software' },
            { href: '/for-clinics', label: 'Appointment software for clinics' },
            { href: '/get-a-quote', label: 'Get a quote for your clinic' },
        ],
        sources: [
            { title: 'Ayushman Bharat Digital Mission (ABDM): National Health Authority', url: 'https://abdm.gov.in/' },
            // TODO(sources): confirm the ABDM link is the reference the owner wants and add any ABDM guidance relevant to clinics.
        ],
        reviewer: undefined, // TODO(reviewer)
    },
];

/** Drafts are visible only when SHOW_DRAFTS=true (local review). */
export const SHOW_DRAFTS = process.env.SHOW_DRAFTS === 'true';

export const visibleArticles = (): BlogArticle[] => BLOG_ARTICLES.filter((a) => SHOW_DRAFTS || !a.draft);
export const publishedArticles = (): BlogArticle[] => BLOG_ARTICLES.filter((a) => !a.draft);
export const getArticle = (slug: string): BlogArticle | undefined => BLOG_ARTICLES.find((a) => a.slug === slug);
