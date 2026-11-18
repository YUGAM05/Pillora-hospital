import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
    title: "Partner with Pillora | Hospitals & Clinics in India",
    description: "List your hospital or clinic on pillora.in and manage online and walk-in appointments, doctor schedules and advance consultation fees.",
    path: "/partners",
});

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
