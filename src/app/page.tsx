import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, softwareApplicationJsonLd } from "@/lib/structuredData";

export const metadata: Metadata = pageMetadata({
    title: "Hospital Appointment Booking Software for India | Pillora",
    description:
        "Appointment and doctor schedule software for hospitals and clinics in India: online and walk-in bookings, doctor slots and fees in one dashboard.",
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
