import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, softwareApplicationJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = pageMetadata({
    title: "Hospital Appointment Booking Software for India | Pillora",
    description:
        "Appointment and doctor schedule software for hospitals and clinics: online and walk-in bookings, flexible slots, advance fees, synced with pillora.in.",
    path: "/",
});

export default function Home() {
    return (
        <>
            <JsonLd data={softwareApplicationJsonLd()} />
            <HomeClient />
        </>
    );
}
