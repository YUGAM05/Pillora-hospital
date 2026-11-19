import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Contact Pillora | Hospital & Clinic Partnerships",
    description: "Talk to Pillora about appointment and doctor schedule software for your hospital or clinic, partner onboarding, or help with the hospital portal.",
    path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
