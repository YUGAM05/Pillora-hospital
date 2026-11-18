import type { Metadata } from "next";
import Link from "next/link";
import { CAPABILITIES, PATIENT_SITE } from "@/content/marketing";
import { pageMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { Breadcrumbs, CapabilityCard, CtaBand, PageHero, PrimaryLink, SecondaryLink, Section } from "@/components/marketing/Blocks";

export const metadata: Metadata = pageMetadata({
    title: "Clinic Appointment Software in India | Pillora",
    description:
        "Appointment software for clinics: patients book online on Pillora.in, you add walk-ins, set your own slots and take part of the fee in advance.",
    path: "/for-clinics",
});

const pick = (ids: string[]) => CAPABILITIES.filter((c) => ids.includes(c.id));

export default function ForClinicsPage() {
    return (
        <main className="bg-white">
            <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "For clinics", path: "/for-clinics" }])} />
            <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "For clinics" }]} />
            <PageHero
                eyebrow="For clinics"
                title="Appointment software for clinics in India"
                subtitle="Replace the paper register with a simple schedule: patients book a slot online, walk-ins go into the same list, and you can take part of the consultation fee in advance."
            >
                <PrimaryLink href="/get-a-quote#request">Request a demo</PrimaryLink>
                <SecondaryLink href="/features">See all features</SecondaryLink>
            </PageHero>

            <Section title="How a day works with Pillora" intro="A typical flow for a clinic using the hospital dashboard.">
                <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { t: "Set your slots", d: "Choose the dates, timings and slot length you want to offer for each doctor." },
                        { t: "Patients book online", d: "Patients find your clinic on Pillora.in, pick a free slot and book. Bookings appear in your dashboard." },
                        { t: "Add walk-ins at the desk", d: "Walk-in and phone patients are added to the same schedule, so nothing is double-entered." },
                    ].map((s, i) => (
                        <li key={s.t} className="p-8 bg-slate-50/70 border border-slate-100 rounded-[2rem]">
                            <p className="text-sm font-black text-blue-600">Step {i + 1}</p>
                            <h3 className="text-xl font-black text-slate-900 mt-1">{s.t}</h3>
                            <p className="text-slate-500 mt-2 leading-relaxed">{s.d}</p>
                        </li>
                    ))}
                </ol>
            </Section>

            <Section title="What clinics use most" muted>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pick(["scheduling", "walk-in", "advance-payment", "online-booking"]).map((c) => (
                        <CapabilityCard key={c.id} cap={c} />
                    ))}
                </div>
            </Section>

            <Section title="Your clinic on Pillora.in">
                <p className="text-slate-600 leading-relaxed max-w-3xl">
                    Your clinic gets a page on <a href={PATIENT_SITE + "/hospitals"} className="text-blue-600 font-semibold hover:underline">the Pillora.in hospital directory</a>{" "}
                    with your doctors, consultation fees and open slots. Changes you make in the dashboard are shared with that page, so patients see the schedule you have set.
                    Read more about <Link href="/features#synced" className="text-blue-600 font-semibold hover:underline">how the dashboard and Pillora.in stay synced</Link>.
                </p>
                {/* TODO(case-study): add a real clinic case study or testimonial once the owner supplies one. Do not invent. */}
            </Section>

            <CtaBand title="See it with your clinic's schedule" />
        </main>
    );
}
