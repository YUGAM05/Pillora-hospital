import type { Metadata } from "next";
import Link from "next/link";
import { CAPABILITIES } from "@/content/marketing";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, CapabilityCard, CtaBand, PageHero, PrimaryLink, SecondaryLink, Section } from "@/components/marketing/Blocks";

export const metadata: Metadata = pageMetadata({
    title: "OPD Appointment Management for Hospitals | Pillora",
    description:
        "Manage OPD appointments across doctors and specialty groups: online booking via Pillora.in, walk-ins, doctor slots and advance consultation fees.",
    path: "/for-hospitals",
});

const pick = (ids: string[]) => CAPABILITIES.filter((c) => ids.includes(c.id));

export default function ForHospitalsPage() {
    return (
        <main className="bg-white">
            <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "For hospitals", path: "/for-hospitals" }])} />
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "For hospitals" }]} />
            <PageHero
                eyebrow="For hospitals"
                title="OPD appointment management for hospitals"
                subtitle="Give every doctor and department their own slots, keep online and walk-in patients in one schedule, and show patients your doctors, fees and availability on Pillora.in."
            >
                <PrimaryLink href="/get-a-quote#request">Request a demo</PrimaryLink>
                <SecondaryLink href="/faq">Read the FAQ</SecondaryLink>
            </PageHero>

            <Section title="Built for many doctors and departments">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pick(["doctor-directory", "scheduling", "walk-in", "online-booking"]).map((c) => (
                        <CapabilityCard key={c.id} cap={c} />
                    ))}
                </div>
            </Section>

            <Section title="Payments and patient booking" muted>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pick(["advance-payment", "synced"]).map((c) => (
                        <CapabilityCard key={c.id} cap={c} />
                    ))}
                </div>
            </Section>

            <Section title="Getting started">
                <p className="text-slate-600 leading-relaxed max-w-3xl">
                    Share your hospital&apos;s details through the <Link href="/get-a-quote#request" className="text-blue-600 font-semibold hover:underline">demo and quote request form</Link>.
                    The Pillora team sets up your hospital account and doctors; your staff then manage appointments from the hospital dashboard.
                </p>
                {/* TODO(onboarding): add a typical onboarding timeline and what the hospital needs to provide, once confirmed. */}
                {/* TODO(case-study): add a real hospital case study once the owner supplies one. Do not invent. */}
            </Section>

            <CtaBand title="See it with your hospital's doctors" />
        </main>
    );
}
