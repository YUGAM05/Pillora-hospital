import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

// TODO(step-3): currently lists patient posts (duplicate of www.pillora.in/blog), so it is
// noindex until the clinic-focused blog index replaces it.
export const metadata: Metadata = noIndexMetadata("Blog");

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
