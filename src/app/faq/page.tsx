import type { Metadata } from "next";
import { FAQS } from "@/content/marketing";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, CtaBand, FaqList, PageHero } from "@/components/marketing/Blocks";

export const metadata: Metadata = pageMetadata({
    title: "FAQ: Hospital Appointment Software | Pillora",
    description:
        "Answers about Pillora for Hospitals: online and walk-in appointments, doctor slots, advance fees, Pillora.in listings, pricing and getting started.",
    path: "/faq",
});

export default function FaqPage() {
    return (
        <main className="bg-white">
            <JsonLd
                data={[
                    faqJsonLd(FAQS.map(({ question, answer }) => ({ question, answer }))),
                    breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }]),
                ]}
            />
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "FAQ" }]} />
            <PageHero
                eyebrow="FAQ"
                title="Questions about Pillora for Hospitals"
                subtitle="How appointments, doctor slots, advance payments and your Pillora.in listing work."
            />
            <div className="max-w-4xl mx-auto px-6 pb-8">
                <FaqList faqs={FAQS} />
            </div>
            <CtaBand title="Still have a question?" text="Ask us directly. Request a demo and we will answer it with your own setup on screen." />
        </main>
    );
}
