/**
 * Server-side data fetching for SEO wrappers.
 * Same API base as src/lib/api.ts. Every call has a timeout and returns null
 * on any failure, so pages fall back to their existing client-side fetch
 * instead of rendering empty.
 */
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://apex-backend-theta.vercel.app/api' : 'http://localhost:5000/api');

export async function serverGet<T>(path: string, { revalidate = 3600, timeoutMs = 5000 } = {}): Promise<T | null> {
    try {
        const res = await fetch(`${API_BASE_URL}${path}`, {
            next: { revalidate },
            signal: AbortSignal.timeout(timeoutMs),
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}
