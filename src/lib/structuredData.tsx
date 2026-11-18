import { SITE, absoluteUrl } from './seo';

/**
 * JSON-LD helpers. Only verified facts are used: no ratings, reviews,
 * prices, customer counts or awards.
 */

/** Renders a JSON-LD <script>. `<` is escaped so content can never break out of the tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}

export const organizationJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.brand,
    alternateName: SITE.name,
    url: SITE.url,
    logo: absoluteUrl(SITE.logo),
    description:
        'Pillora provides hospitals and clinics in India with online and walk-in appointment management, doctor schedules with flexible slots, advance online consultation fee payment, and a doctor directory that syncs in real time with the pillora.in patient booking portal.',
    sameAs: [...SITE.sameAs, SITE.patientSiteUrl],
    contactPoint: [
        {
            '@type': 'ContactPoint',
            telephone: SITE.phone,
            contactType: 'sales',
            areaServed: 'IN',
            availableLanguage: ['en'],
        },
    ],
    areaServed: { '@type': 'Country', name: 'India' },
});

export const websiteJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE.url}/#organization` },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: absoluteUrl(item.path),
    })),
});

interface ArticleInput {
    headline: string;
    description: string;
    path: string;
    image?: string;
    datePublished?: string;
    dateModified?: string;
    authorName?: string;
}

/** BlogPosting for blog posts and Health Hub articles. Reviewer data is a TODO until supplied. */
export const articleJsonLd = ({ headline, description, path, image, datePublished, dateModified, authorName }: ArticleInput) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: headline.slice(0, 110),
    description,
    mainEntityOfPage: absoluteUrl(path),
    url: absoluteUrl(path),
    image: [absoluteUrl(image || SITE.ogImage)],
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified || datePublished ? { dateModified: dateModified || datePublished } : {}),
    // TODO(seo-reviewer): add `reviewedBy` (name, credentials) once a medical reviewer is confirmed.
    author: authorName
        ? { '@type': 'Person', name: authorName }
        : { '@type': 'Organization', name: SITE.brand, url: SITE.url },
    publisher: {
        '@type': 'Organization',
        name: SITE.brand,
        logo: { '@type': 'ImageObject', url: absoluteUrl(SITE.logo) },
    },
    inLanguage: 'en-IN',
});

export const faqJsonLd = (faqs: { question: string; answer: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
});

/**
 * The hospital product. Only verified capabilities are listed: no ratings,
 * reviews, prices, customer counts or uptime figures.
 */
export const softwareApplicationJsonLd = () => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE.url}/#software`,
    name: 'Pillora Hospital Portal',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Hospital appointment and doctor schedule management',
    operatingSystem: 'Web browser',
    url: SITE.url,
    image: absoluteUrl(SITE.ogImage),
    description:
        'Appointment and doctor schedule software for hospitals and clinics in India: online appointment booking for patients, offline and walk-in appointment management, digital scheduling with flexible doctor-configured slots, advance online consultation fee payment, a doctor directory with availability and fees, and real-time sync with the pillora.in patient booking portal.',
    featureList: [
        'Online appointment booking for patients',
        'Offline and walk-in appointment management',
        'Digital scheduling with flexible slots configured by doctors',
        'Advance online consultation fee payment',
        'Doctor directory with availability and fees',
        'Real-time sync between the hospital dashboard and pillora.in',
    ],
    areaServed: { '@type': 'Country', name: 'India' },
    provider: { '@id': `${SITE.url}/#organization` },
});
