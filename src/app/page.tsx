import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { pageMetadata } from "@/lib/seo";
import { HOME_FAQS } from "@/content/marketing";
import { JsonLd, faqJsonLd, softwareApplicationJsonLd } from "@/lib/structuredData";

// Title, description, og:* and twitter:* all come from pageMetadata; canonical is
// https://www.pillorahospital.in/ (self-referencing, www host).
export const metadata: Metadata = pageMetadata({
    title: "Hospital Appointment Booking Software for India | Pillora",
    description:
        "Pillora helps hospitals, clinics and doctors take online appointments, manage walk-ins and organise doctor slots from one dashboard. Request a demo.",
    path: "/",
});

export default function Home() {
    return (
        <>
            <JsonLd
                data={[
                    softwareApplicationJsonLd(),
                    faqJsonLd(HOME_FAQS.map(({ question, answer }) => ({ question, answer }))),
                ]}
            />
            <HomeClient />
        </>
    );
}
