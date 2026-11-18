import { NextResponse, type NextRequest } from "next/server";
import { BLOG_ARTICLES } from "@/content/blog";

/**
 * Before the clinic blog existed, /blog/<slug> on this domain served copies of
 * www.pillora.in blog posts. Any /blog/<slug> that is not one of our own
 * articles is sent to the original post with a real HTTP 301 (a redirect from
 * inside the page would be streamed as 200 + meta refresh).
 *
 * Scoped to /blog/:slug only; every other route is untouched.
 */
export function middleware(req: NextRequest) {
    const parts = req.nextUrl.pathname.split("/").filter(Boolean); // ["blog", slug, ...]
    const slug = parts.length === 2 ? parts[1] : undefined;
    if (slug && !BLOG_ARTICLES.some((a) => a.slug === slug)) {
        return NextResponse.redirect(`https://www.pillora.in/blog/${encodeURIComponent(slug)}`, 301);
    }
    return NextResponse.next();
}

// "/blog/:path+" (one or more segments); single-segment slugs are checked above.
export const config = { matcher: ["/blog/:path+"] };
