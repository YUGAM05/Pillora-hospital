import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "About Pillora for Hospitals and Clinics",
    description: "Pillora connects hospitals and clinics with patients on pillora.in through online and walk-in appointment management and doctor schedules.",
    path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
