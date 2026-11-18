import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

// Private / utility page: kept out of search results and the sitemap.
export const metadata: Metadata = noIndexMetadata("Hospital login");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
