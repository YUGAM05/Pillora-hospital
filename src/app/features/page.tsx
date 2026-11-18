import type { Metadata } from "next";
import Link from "next/link";
import { CAPABILITIES } from "@/content/marketing";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, CapabilityCard, CtaBand, PageHero, PrimaryLink, SecondaryLink, Section } from "@/components/marketing/Blocks";

export const metadata: Metadata = pageMetadata({
    title: "Hospital Appointment Software Features | Pillora",
    description:
        "Online appointment booking, walk-in management, flexible doctor slots, advance fee payment and a doctor directory synced with Pillora.in.",
    path: "/features",
});

export default function FeaturesPage() {
    return (
        <main className="bg-white">
            <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }])} />
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features" }]} />
            <PageHero
                eyebrow="Features"
                title="Features of Pillora's hospital appointment software"
                subtitle="One dashboard for online and walk-in appointments, doctor schedules and advance consultation fees, with your doctors and slots shown to patients on Pillora.in."
            >
                <PrimaryLink href="/get-a-quote#request">Request a demo</PrimaryLink>
                <SecondaryLink href="/faq">Read the FAQ</SecondaryLink>
            </PageHero>

            <nav aria-label="On this page" className="max-w-6xl mx-auto px-6">
                <ul className="flex flex-wrap gap-2 justify-center">
                    {CAPABILITIES.map((c) => (
                        <li key={c.id}>
                            <a href={`#${c.id}`} className="inline-block px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-sm font-semibold text-slate-600 hover:text-blue-600">
                                {c.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <Section title="What you can do with Pillora" intro="Each feature below is part of the hospital dashboard today.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {CAPABILITIES.map((c) => (
                        <CapabilityCard key={c.id} cap={c} />
                    ))}
                </div>
            </Section>

            <Section title="Which setup fits you?" muted>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/for-clinics" className="block p-8 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200">
                        <h3 className="text-xl font-black text-slate-900">Appointment software for clinics</h3>
                        <p className="text-slate-500 mt-2">For single-doctor and small clinics moving from a paper register to online booking.</p>
                    </Link>
                    <Link href="/for-hospitals" className="block p-8 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200">
                        <h3 className="text-xl font-black text-slate-900">OPD appointment management for hospitals</h3>
                        <p className="text-slate-500 mt-2">For hospitals with many doctors and specialty groups sharing one front desk.</p>
                    </Link>
                </div>
            </Section>

            <CtaBand />
        </main>
    );
}
