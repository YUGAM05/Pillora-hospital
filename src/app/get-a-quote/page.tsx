import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, PageHero, Section } from "@/components/marketing/Blocks";
import DemoRequestForm from "@/components/marketing/DemoRequestForm";

export const metadata: Metadata = pageMetadata({
    title: "Pricing: Get a Quote for Your Hospital or Clinic | Pillora",
    description:
        "Get a quote for Pillora's appointment and doctor schedule software. Tell us about your hospital or clinic and the Pillora team will contact you.",
    path: "/get-a-quote",
});

export default function GetAQuotePage() {
    return (
        <main className="bg-white">
            <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Get a quote", path: "/get-a-quote" }])} />
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Get a quote" }]} />
            <PageHero
                eyebrow="Pricing"
                title="Get a quote for your hospital or clinic"
                subtitle="Pricing depends on your setup. Tell us about your hospital or clinic and we will send you a quote, or book a demo to see the dashboard first."
            />
            {/* TODO(pricing): publish plans or price ranges here once the owner confirms them. Do not invent prices. */}

            <Section id="request" title="Request a demo or a quote">
                <DemoRequestForm intent="quote" source="get-a-quote" />
                <p className="text-sm text-slate-500 mt-6">
                    Prefer to talk? Call <a href="tel:+919429167856" className="font-semibold text-blue-600 hover:underline">+91 94291 67856</a>, or see{" "}
                    <Link href="/features" className="font-semibold text-blue-600 hover:underline">what&apos;s included in the hospital dashboard</Link> and the{" "}
                    <Link href="/faq" className="font-semibold text-blue-600 hover:underline">frequently asked questions</Link>.
                </p>
            </Section>
        </main>
    );
}
