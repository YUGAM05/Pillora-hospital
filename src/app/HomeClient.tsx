"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/tokenStorage";
import {
    Calendar,

    Users,
    ArrowRight,
    Building2,
    ClipboardList,
    Globe,
    LayoutDashboard,
    Lock,
    Phone,
    Sparkles,
    Stethoscope,
    UserRound,
    Wallet,
} from "lucide-react";
import { motion } from "framer-motion";
import PartnerRequestModal from "@/components/PartnerRequestModal";
import DemoRequestForm from "@/components/marketing/DemoRequestForm";
import { PATIENT_SITE } from "@/content/marketing";

/**
 * Homepage copy rules (owner brief, 19 Nov 2026):
 *  - Only capabilities confirmed in code. No statistics, uptime, "24/7",
 *    "compliant", "encryption", "atomic slot locking", "real-time" or anything
 *    from src/content/claims.ts.
 *  - Anything the owner has not confirmed carries a TODO(...) marker here and
 *    is listed in docs/seo/REPORT.md.
 */

const SUPPORT_PHONE_DISPLAY = "+91 94291 67856";
const SUPPORT_PHONE_TEL = "+919429167856";

const WHAT_YOU_GET: { icon: React.ReactNode; title: string; desc: string; href: string; todo?: string }[] = [
    {
        icon: <Globe className="w-8 h-8 text-blue-600" />,
        title: "Online appointment booking",
        desc: "Patients book available appointments with your doctors online.",
        href: "/features#online-booking",
    },
    {
        icon: <ClipboardList className="w-8 h-8 text-blue-600" />,
        title: "Walk-in and offline appointments",
        desc: "Manage walk-in and offline appointments alongside online ones.",
        href: "/features#walk-in",
    },
    {
        icon: <Calendar className="w-8 h-8 text-blue-600" />,
        title: "Doctor slot management",
        // Code: slots are set per doctor with a start, end and slot length, from the
        // hospital dashboard (hospital staff, including staff with the doctor role).
        desc: "Doctors or your team set each doctor's available slots and consultation duration.",
        href: "/features#scheduling",
    },
    {
        icon: <Users className="w-8 h-8 text-blue-600" />,
        title: "Doctor directory",
        desc: "Specialist profiles, availability timings and consultation fees in one place.",
        href: "/features#doctor-directory",
    },
    {
        icon: <Wallet className="w-8 h-8 text-blue-600" />,
        title: "Advance online payments",
        desc: "Patients can pay consultation fees in advance online.",
        href: "/features#advance-payment",
        // TODO(confirm-advance-payments): confirm with the owner. Do not promote this
        // (ads, schema, meta) until the paid-slot double-booking bug is fixed
        // (Pillora-backend paymentController.verifyPayment; REPORT §8).
        todo: "confirm-advance-payments",
    },
    {
        icon: <LayoutDashboard className="w-8 h-8 text-blue-600" />,
        title: "One dashboard",
        desc: "Manage appointments, doctors and bookings in a single place.",
        href: "/features#synced",
    },
];

const AUDIENCES: { icon: React.ReactNode; title: string; desc: string; href?: string; cta?: string }[] = [
    {
        icon: <Building2 className="w-7 h-7 text-blue-600" />,
        title: "Hospitals",
        desc: "Manage OPD appointments for many doctors and specialty groups, with online and walk-in patients in one schedule.",
        href: "/for-hospitals",
        cta: "OPD appointment management for hospitals",
    },
    {
        icon: <Stethoscope className="w-7 h-7 text-blue-600" />,
        title: "Clinics",
        desc: "Move from a paper register to online booking: set your doctors' slots and fees, and take walk-ins in the same schedule.",
        href: "/for-clinics",
        cta: "Appointment software for clinics",
    },
    {
        icon: <UserRound className="w-7 h-7 text-blue-600" />,
        title: "Individual doctors",
        // Code: a practice is set up as a clinic with one doctor (no separate doctor account type).
        desc: "Set up your practice as a single-doctor clinic and manage your own slots, fees and bookings.",
    },
];

const STEPS: { title: string; desc: string; todo?: string }[] = [
    { title: "Request a demo", desc: "Tell us about your hospital or clinic using the form below." },
    {
        title: "We set up your hospital and doctors",
        desc: "The Pillora team sets up your hospital account, your doctors and their slots.",
        // TODO(onboarding): confirm the real onboarding steps, what the hospital must
        // provide and a typical timeline before adding any detail here.
        todo: "onboarding",
    },
    { title: "Patients start booking", desc: "Patients book your available slots on pillora.in, and your team manages them in the dashboard." },
];

const HOME_FAQS: { question: string; answer: React.ReactNode; todo?: string }[] = [
    {
        question: "What is Pillora?",
        answer: "A healthcare technology platform that helps hospitals, clinics and doctors manage appointments digitally. Patients book on pillora.in and your team manages bookings from the hospital dashboard.",
    },
    {
        question: "Who is it for?",
        answer: "Hospitals, clinics and individual doctors in India who want online booking alongside walk-in appointments.",
    },
    {
        question: "How do I get started?",
        answer: "Request a demo. The Pillora team then sets up your hospital and doctors, and patients can start booking.",
        // TODO(onboarding): same as the "How to get started" steps.
        todo: "onboarding",
    },
    {
        question: "How much does it cost?",
        answer: (
            <>
                Pricing depends on your hospital or clinic.{" "}
                <Link href="/get-a-quote" className="text-blue-600 font-bold hover:underline">Request a quote</Link> and we will send you one.
            </>
        ),
        // TODO(pricing): publish plans or price ranges only once the owner confirms them.
        todo: "pricing",
    },
];

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
        <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* 1. Hero */}
            <section className="relative pt-20 pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -z-10 opacity-50" />

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-blue-100"
                    >
                        <Stethoscope className="w-4 h-4" aria-hidden="true" /> For hospitals, clinics and doctors in India
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight max-w-5xl mx-auto"
                    >
                        Appointment and doctor schedule software for{" "}
                        <span className="text-blue-600">hospitals and clinics</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-10 leading-relaxed"
                    >
                        Pillora lets patients book appointments online, and helps your team manage online and walk-in appointments, doctor slots and consultation fees from one dashboard.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <a href="#request-demo" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            Request a demo <ArrowRight className="w-6 h-6" aria-hidden="true" />
                        </a>
                        <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-700 border border-slate-200 rounded-[2rem] font-black text-lg hover:bg-slate-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            Partner login
                        </Link>
                    </motion.div>

                    {/* TODO(confirm-onboarding-status): confirm "now onboarding early partners" is still true. */}
                    <p className="mt-8 text-sm font-semibold text-slate-500">
                        Now onboarding early partner hospitals and clinics.
                    </p>
                </div>
            </section>

            {/* 2. What is Pillora */}
            <section className="max-w-4xl mx-auto px-6 py-16 text-center border-t border-slate-50" aria-labelledby="what-heading">
                <h2 id="what-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">What is Pillora?</h2>
                <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
                    Pillora is a healthcare technology platform that helps hospitals, clinics and doctors manage appointments digitally. Patients find your doctors and book available slots on{" "}
                    <a href={PATIENT_SITE} className="text-blue-600 font-bold hover:underline">pillora.in</a>, and your team manages everything from the hospital dashboard.
                </p>
            </section>

            {/* 3. What you get */}
            <section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="features-heading">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                    <h2 id="features-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        What you get
                    </h2>
                    <Link href="/features" className="text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">
                        See all features <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {WHAT_YOU_GET.map((f) => (
                        <FeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} href={f.href} />
                    ))}
                </div>
                {/* Replaces the old security section. Confirmed in code: every hospital dashboard
                    API is scoped to the signed-in hospital's own record (attachHospital middleware
                    and per-record hospital checks in Pillora-backend). No other security claims. */}
                <p className="mt-10 flex items-start gap-3 text-slate-500 font-medium max-w-3xl">
                    <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                    Each hospital&apos;s dashboard shows only its own doctors, slots, appointments and payments.
                </p>
            </section>

            {/* 4. Who it is for */}
            <section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="audience-heading">
                <h2 id="audience-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-10">Who it is for</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {AUDIENCES.map((a) => (
                        <AudienceCard key={a.title} {...a} />
                    ))}
                </div>
            </section>

            {/* 5. How to get started */}
            <section className="bg-slate-50/70 border-y border-slate-100" aria-labelledby="start-heading">
                <div className="max-w-7xl mx-auto px-6 py-20">
                    <h2 id="start-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-10">How to get started</h2>
                    <ol className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STEPS.map((s, i) => (
                            <li key={s.title} className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                                <p className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center mb-5">{i + 1}</p>
                                <h3 className="text-xl font-black text-slate-900 mb-2">{s.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{s.desc}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* 6. Early partner benefits */}
            <section className="max-w-7xl mx-auto px-6 py-16" aria-labelledby="early-heading">
                <div className="bg-slate-900 rounded-[3rem] p-8 md:p-14 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" aria-hidden="true" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-7 h-7" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 id="early-heading" className="text-2xl md:text-3xl font-black">Early partner benefits</h2>
                            {/* TODO(confirm-early-partner-offer): confirm this offer (it comes from the About page).
                                Patient booking on pillora.in is already live, so the offer is worded as placement
                                on pillora.in rather than "when patient booking goes live". */}
                            <p className="text-slate-300 font-medium text-lg mt-2">Priority placement on pillora.in for early partner hospitals and clinics.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. FAQ teaser */}
            <section className="max-w-4xl mx-auto px-6 py-16" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-8">Common questions</h2>
                <div className="space-y-6">
                    {HOME_FAQS.map((f) => (
                        <div key={f.question}>
                            <h3 className="text-lg font-black text-slate-900">{f.question}</h3>
                            <p className="text-slate-600 mt-2 leading-relaxed">{f.answer}</p>
                        </div>
                    ))}
                </div>
                <Link href="/faq" className="mt-8 text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">
                    Read all questions about Pillora for Hospitals <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
            </section>

            {/* 8. Final call to action, with the demo form */}
            <section id="request-demo" className="max-w-5xl mx-auto px-6 py-16 scroll-mt-24" aria-labelledby="demo-heading">
                <h2 id="demo-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Request a demo</h2>
                <p className="text-slate-500 font-medium text-lg mt-3 mb-6">
                    Tell us about your hospital or clinic, and we&apos;ll show you how appointments and doctor slots work with your own setup.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-8 mb-8 text-slate-700 font-bold">
                    <a href={`tel:${SUPPORT_PHONE_TEL}`} className="inline-flex items-center gap-2 hover:text-blue-600">
                        <Phone className="w-5 h-5 text-blue-600" aria-hidden="true" /> Call {SUPPORT_PHONE_DISPLAY}
                    </a>
                    <a href={PATIENT_SITE} className="inline-flex items-center gap-2 hover:text-blue-600">
                        <Globe className="w-5 h-5 text-blue-600" aria-hidden="true" /> www.pillora.in
                    </a>
                </div>
                <DemoRequestForm intent="demo" source="home" />
                <p className="mt-6 text-sm text-slate-500">
                    Interested in a partnership instead?{" "}
                    <button type="button" onClick={() => setIsPartnerModalOpen(true)} className="font-bold text-blue-600 hover:underline">
                        Partner with us
                    </button>
                </p>
            </section>

            <PartnerRequestModal
                isOpen={isPartnerModalOpen}
                onClose={() => setIsPartnerModalOpen(false)}
            />
        </main>
    );
}

function FeatureCard({ icon, title, desc, href }: { icon: React.ReactNode, title: string, desc: string, href: string }) {
    return (
        <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:border-blue-200 transition-all group hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-blue-900/5">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
            <Link href={href} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                Learn more about {title.toLowerCase()} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
        </div>
    );
}

function AudienceCard({ icon, title, desc, href, cta }: { icon: React.ReactNode; title: string; desc: string; href?: string; cta?: string }) {
    const body = (
        <>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">{icon}</div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
            {href && cta && (
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:underline">
                    {cta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </span>
            )}
        </>
    );
    const cls = "block p-10 bg-slate-50/70 border border-slate-100 rounded-[2.5rem] transition-all group";
    return href ? (
        <Link href={href} className={`${cls} hover:border-blue-200 hover:bg-white`}>{body}</Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}
