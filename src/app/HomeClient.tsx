"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/tokenStorage";
import {
    ArrowRight,
    Building2,
    Calendar,
    CalendarX,
    CheckCircle2,
    ClipboardList,
    Globe,
    LayoutDashboard,
    NotebookPen,
    Phone,
    PhoneMissed,
    Stethoscope,
    UserRound,
    Users,
    Wallet,
    XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import PartnerRequestModal from "@/components/PartnerRequestModal";
import DemoRequestForm from "@/components/marketing/DemoRequestForm";
import { HOME_FAQS, PATIENT_SITE, SHOW_ADVANCE_PAYMENTS_CARD, SUPPORT_PHONE } from "@/content/marketing";

/**
 * pillorahospital.in homepage. Copy is the owner's brief (19 Nov 2026), word for word.
 * Rules: no statistics, customers, testimonials, prices or claims beyond this copy.
 * Never use: "500+ Hospitals", "99.9%", "24/7", "Trusted by", "Compliant",
 * "enterprise-grade", "atomic slot locking", "real-time", "leading", "best",
 * "no double bookings". Lines marked [CONFIRM] carry a TODO and are listed in
 * docs/seo/REPORT.md.
 */

type Card = { icon: React.ReactNode; title: string; desc: string };

const FEATURES: (Card & { hidden?: boolean })[] = [
    { icon: <Globe className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Online appointment booking", desc: "Patients book available appointments with your doctors online." },
    { icon: <ClipboardList className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Walk-in and offline appointments", desc: "Manage walk-in and offline patients alongside online bookings." },
    { icon: <Calendar className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Doctor slot management", desc: "Doctors set their available slots and consultation durations." },
    { icon: <Users className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Doctor directory", desc: "Specialist profiles, availability timings and consultation fees in one place." },
    {
        icon: <Wallet className="w-7 h-7 text-blue-600" aria-hidden="true" />,
        title: "Advance online payments",
        desc: "Patients can pay consultation fees in advance.",
        // TODO(confirm-advance-payments) [CONFIRM]: hidden by SHOW_ADVANCE_PAYMENTS_CARD
        // (src/content/marketing.ts) until the owner approves and the paid-slot
        // double-booking bug is fixed.
        hidden: !SHOW_ADVANCE_PAYMENTS_CARD,
    },
    { icon: <LayoutDashboard className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "One dashboard", desc: "Manage appointments, doctors and bookings from a single hospital dashboard." },
];

const PROBLEMS: Card[] = [
    { icon: <PhoneMissed className="w-6 h-6 text-rose-500" aria-hidden="true" />, title: "Missed calls", desc: "" },
    { icon: <CalendarX className="w-6 h-6 text-rose-500" aria-hidden="true" />, title: "Scheduling confusion", desc: "" },
    { icon: <NotebookPen className="w-6 h-6 text-rose-500" aria-hidden="true" />, title: "Manual registers and coordination", desc: "" },
];

const STEPS: { text: string; todo?: string }[] = [
    { text: "Request a demo or tell us about your hospital or clinic." },
    // TODO(onboarding) [CONFIRM]: confirm the real onboarding steps.
    { text: "We set up your hospital profile and doctors.", todo: "onboarding" },
    { text: "Patients start finding and booking your doctors on pillora.in." },
];

const AUDIENCES: (Card & { href?: string; linkText?: string })[] = [
    { icon: <Building2 className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Hospitals", desc: "Manage appointments across doctors and departments from one dashboard.", href: "/for-hospitals", linkText: "Appointment software for hospitals" },
    { icon: <Stethoscope className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Clinics", desc: "Replace phone calls and paper registers with online and walk-in appointment management.", href: "/for-clinics", linkText: "Appointment software for clinics" },
    { icon: <UserRound className="w-7 h-7 text-blue-600" aria-hidden="true" />, title: "Individual doctors", desc: "Set your own available slots and let patients book them online." },
];

const WITHOUT = ["Phone calls", "Paper register", "Patients unsure of their turn"];
const WITH = ["Online bookings", "Walk-ins in the same list", "Doctors see the day's schedule"];

export default function HospitalPortalHome() {
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const user = getUser();
        if (user && (user.role === 'hospital' || user.role === 'admin')) {
            window.location.replace("/hospital/dashboard");
        }
    }, [router]);

    return (
        <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700 overflow-x-hidden">
            {/* 1. Hero */}
            <section className="relative pt-12 md:pt-20 pb-16 md:pb-24">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -z-10 opacity-50" aria-hidden="true" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-100"
                        >
                            <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" /> For hospitals, clinics and doctors in India
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight"
                        >
                            Appointment and doctor schedule software for{" "}
                            <span className="text-blue-600">hospitals and clinics</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-500 font-medium mb-8 leading-relaxed"
                        >
                            Pillora helps your hospital or clinic take online appointments, manage walk-ins, and organise doctor slots from one dashboard.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
                        >
                            <a href="#request-demo" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                Request a demo <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-[2rem] font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                                Partner login
                            </Link>
                        </motion.div>
                        {/* TODO(confirm-onboarding-status) [CONFIRM]: is this still true? */}
                        <p className="mt-6 text-sm font-semibold text-slate-500">Now onboarding early partner hospitals and clinics.</p>
                    </div>
                    <ScheduleIllustration />
                </div>
            </section>

            {/* 2. What is Pillora */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center" aria-labelledby="what-heading">
                <h2 id="what-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-5">What is Pillora?</h2>
                <div className="space-y-3 text-lg text-slate-600 font-medium leading-relaxed">
                    <p>Pillora is a healthcare technology platform that helps hospitals, clinics and doctors manage appointments digitally.</p>
                    <p>
                        Patients find your doctors and book available slots online on{" "}
                        <a href={PATIENT_SITE} className="text-blue-600 font-bold hover:underline">pillora.in</a>.
                    </p>
                    <p>Your team manages online and walk-in appointments from the hospital dashboard.</p>
                </div>
            </section>

            {/* 3. The problem */}
            <section className="bg-slate-50/70 border-y border-slate-100" aria-labelledby="problem-heading">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 text-center">
                    <h2 id="problem-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-8">Still managing appointments the old way?</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {PROBLEMS.map((p) => (
                            <li key={p.title} className="flex sm:flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm text-left sm:text-center">
                                <span className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">{p.icon}</span>
                                <span className="font-black text-slate-900">{p.title}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-8 text-lg font-bold text-slate-700">Pillora brings your appointments into one place.</p>
                </div>
            </section>

            {/* 4. What you get */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16" aria-labelledby="features-heading">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
                    <h2 id="features-heading" className="text-3xl md:text-4xl font-black tracking-tight">What you get</h2>
                    <Link href="/features" className="text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">
                        See all Pillora features <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.filter((f) => !f.hidden).map((f) => (
                        <li key={f.title} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-blue-200 transition-all">
                            <span className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">{f.icon}</span>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{f.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                        </li>
                    ))}
                </ul>
            </section>

            {/* 5. How it works */}
            <section className="bg-slate-50/70 border-y border-slate-100" aria-labelledby="how-heading">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                    <h2 id="how-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-8">How it works</h2>
                    <ol className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {STEPS.map((s, i) => (
                            <li key={s.text} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                                <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center mb-4" aria-hidden="true">{i + 1}</span>
                                <p className="text-lg font-bold text-slate-800 leading-snug">{s.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* 6. Who it is for */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16" aria-labelledby="audience-heading">
                <h2 id="audience-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-8">Who it is for</h2>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {AUDIENCES.map((a) => (
                        <li key={a.title} className="p-6 md:p-8 bg-slate-50/70 border border-slate-100 rounded-[2rem]">
                            <span className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm">{a.icon}</span>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{a.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{a.desc}</p>
                            {a.href && (
                                <Link href={a.href} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                                    {a.linkText} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* 7. A day at a clinic */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16" aria-labelledby="day-heading">
                <h2 id="day-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-8">A day at a clinic</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CompareList title="Without Pillora" items={WITHOUT} good={false} />
                    <CompareList title="With Pillora" items={WITH} good />
                </div>
            </section>

            {/* 8. Early partner offer
                TODO(confirm-early-partner-offer) [CONFIRM]: taken from the About page; remove if no
                longer true. Wording "priority placement on pillora.in" chosen by the owner (19 Nov 2026)
                and matches the About page; patient booking on pillora.in is already live. */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16" aria-labelledby="early-heading">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-14 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px]" aria-hidden="true" />
                    <div className="relative z-10 md:flex md:items-center md:justify-between gap-8">
                        <div>
                            <h2 id="early-heading" className="text-2xl md:text-3xl font-black">Join as an early partner</h2>
                            <p className="text-slate-300 font-medium text-lg mt-3">We are onboarding early partner hospitals and clinics.</p>
                            <p className="text-slate-300 font-medium text-lg">Partners get priority placement on pillora.in.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPartnerModalOpen(true)}
                            className="mt-6 md:mt-0 w-full md:w-auto shrink-0 px-8 py-4 bg-white text-slate-900 rounded-[2rem] font-black hover:bg-blue-50 transition-all"
                        >
                            Partner with us
                        </button>
                    </div>
                </div>
            </section>

            {/* 9. FAQ (same questions are emitted as FAQPage JSON-LD in page.tsx) */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-3xl md:text-4xl font-black tracking-tight mb-8">Frequently asked questions</h2>
                <div className="divide-y divide-slate-100 border-y border-slate-100">
                    {HOME_FAQS.map((f) => (
                        <details key={f.question} className="group py-4">
                            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-black text-slate-900 text-lg min-h-[44px]">
                                {f.question}
                                <ArrowRight className="w-5 h-5 text-blue-600 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
                            </summary>
                            <p className="text-slate-600 mt-2 leading-relaxed">
                                {f.answer}
                                {f.question === "How much does it cost?" && (
                                    <>
                                        {" "}
                                        <Link href="/get-a-quote" className="text-blue-600 font-bold hover:underline">Get a quote for your hospital or clinic</Link>
                                    </>
                                )}
                            </p>
                        </details>
                    ))}
                </div>
                <Link href="/faq" className="mt-6 text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">
                    Read all questions about Pillora for Hospitals <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
            </section>

            {/* 10. Final call to action, with the demo form (posts to /support/guest; demo_request event) */}
            <section id="request-demo" className="bg-slate-50/70 border-t border-slate-100 scroll-mt-24" aria-labelledby="demo-heading">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
                    <div className="text-center mb-10">
                        <h2 id="demo-heading" className="text-3xl md:text-4xl font-black tracking-tight">Ready to simplify your appointments?</h2>
                        <p className="text-slate-500 font-medium text-lg mt-3">Talk to us and see how Pillora fits your hospital or clinic.</p>
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="#demo-form" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                                Request a demo <ArrowRight className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a href={`tel:${SUPPORT_PHONE.tel}`} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-[2rem] font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                <Phone className="w-5 h-5 text-blue-600" aria-hidden="true" /> Call {SUPPORT_PHONE.display}
                            </a>
                        </div>
                        <p className="mt-5 text-slate-500">
                            Visit <a href={PATIENT_SITE} className="text-blue-600 font-bold hover:underline">www.pillora.in</a> to see the patient booking site.
                        </p>
                    </div>
                    <div id="demo-form" className="scroll-mt-24">
                        <DemoRequestForm intent="demo" source="home" />
                    </div>
                </div>
            </section>

            <PartnerRequestModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} />
        </main>
    );
}

/** UI-style illustration built from the site's own card styles. Not a screenshot; no real data. */
function ScheduleIllustration() {
    const rows = [
        { time: "10:00", who: "Patient A", type: "Online" },
        { time: "10:15", who: "Patient B", type: "Walk-in" },
        { time: "10:30", who: "Patient C", type: "Online" },
    ];
    return (
        <figure className="w-full max-w-md mx-auto" role="img" aria-label="Illustration of a doctor's appointment list with online and walk-in patients. Not a real screenshot.">
            <div className="bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-blue-900/5 p-5 sm:p-6" aria-hidden="true">
                <div className="flex items-center justify-between mb-4">
                    <p className="font-black text-slate-900">Today&apos;s appointments</p>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Doctor 1</span>
                </div>
                <ul className="space-y-3">
                    {rows.map((r) => (
                        <li key={r.time} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                            <span className="flex items-center gap-3 min-w-0">
                                <span className="text-sm font-black text-slate-900 w-12 shrink-0">{r.time}</span>
                                <span className="text-sm font-semibold text-slate-600 truncate">{r.who}</span>
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${r.type === "Online" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{r.type}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <figcaption className="mt-3 text-xs text-slate-400 text-center">Illustration only, not a real screenshot.</figcaption>
        </figure>
    );
}

function CompareList({ title, items, good }: { title: string; items: string[]; good: boolean }) {
    return (
        <div className={`p-6 md:p-8 rounded-[2rem] border ${good ? "bg-blue-50/60 border-blue-100" : "bg-white border-slate-100"}`}>
            <h3 className="text-xl font-black text-slate-900 mb-4">{title}</h3>
            <ul className="space-y-3">
                {items.map((t) => (
                    <li key={t} className="flex items-center gap-3 font-semibold text-slate-700">
                        {good ? <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" /> : <XCircle className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />}
                        {t}
                    </li>
                ))}
            </ul>
        </div>
    );
}
