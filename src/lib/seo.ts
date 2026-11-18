import type { Metadata } from 'next';

/**
 * Central SEO configuration for www.pillorahospital.in (B2B hospital portal).
 * Every public route builds its <head> through pageMetadata().
 */
export const SITE = {
    name: 'Pillora for Hospitals',
    brand: 'Pillora',
    url: 'https://www.pillorahospital.in',
    patientSiteUrl: 'https://www.pillora.in',
    locale: 'en_IN',
    phone: '+91-9429167856',
    logo: '/logo-sm.png',
    // 1200×630 share image generated from the existing logo files
    ogImage: '/og/pillorahospital-share.png',
    // Same social profiles as the footer links on www.pillora.in
    sameAs: [
        'https://www.facebook.com/share/1LPeKutMEw/',
        'https://www.instagram.com/pillora_official?igsh=MnBpemU0MW40bW5m',
    ],
} as const;

export const absoluteUrl = (path = '/'): string => {
    if (/^https?:\/\//i.test(path)) return path;
    const clean = path === '/' ? '' : `/${path.replace(/^\/+/, '').replace(/\/+$/, '')}`;
    return `${SITE.url}${clean}`;
};

/** Trim to a length on a word boundary (titles ≤60, descriptions ≈155). */
export const clamp = (text: string, max: number): string => {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    const cut = t.slice(0, max - 1);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,;:.\-–|]+$/, '')}…`;
};

interface PageMetaInput {
    /** Full title as it should appear in the browser tab (≤60 chars). */
    title: string;
    description: string;
    /** Path on www.pillorahospital.in, e.g. "/features". Used for canonical + og:url. */
    path: string;
    image?: string;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
}

/** Metadata for an indexable public page: self-canonical + OG + Twitter. */
export function pageMetadata({ title, description, path, image, type = 'website', publishedTime, modifiedTime }: PageMetaInput): Metadata {
    const fullTitle = clamp(title, 60);
    const desc = clamp(description, 158);
    const url = absoluteUrl(path);
    const img = absoluteUrl(image || SITE.ogImage);
    return {
        title: { absolute: fullTitle },
        description: desc,
        alternates: { canonical: url },
        openGraph: {
            title: fullTitle,
            description: desc,
            url,
            siteName: SITE.name,
            locale: SITE.locale,
            type,
            images: [{ url: img, width: 1200, height: 630, alt: fullTitle }],
            ...(type === 'article' ? { publishedTime, modifiedTime } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description: desc,
            images: [img],
        },
    };
}

/** Metadata for private / utility pages: never indexed, never in the sitemap. */
export const noIndexMetadata = (title: string): Metadata => ({
    title: { absolute: `${title} | Pillora Hospital Portal` },
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
});

/** Hospital-portal routes that must stay out of search results and the sitemap. */
export const PRIVATE_ROUTE_PATTERNS = [
    '/login', '/forgot-password', '/reset-password', '/auth/*', '/hospital/*', '/dashboard', '/api/*',
];
