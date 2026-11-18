"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/tokenStorage";
import {
    Calendar,
    Users,
    ShieldCheck,
    ArrowRight,
    Building2,
    Clock,
    Lock,
    RefreshCw,
    Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";
import PartnerRequestModal from "@/components/PartnerRequestModal";
import DemoRequestForm from "@/components/marketing/DemoRequestForm";
import { UNVERIFIED_CLAIMS } from "@/content/claims";
import { FAQS } from "@/content/marketing";

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
            {/* Hero Section */}
            <section className="relative pt-20 pb-28 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -z-10 opacity-50" />

                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-blue-100"
                    >
                        <ShieldCheck className="w-4 h-4" /> Official Hospital Partner Portal
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight max-w-5xl mx-auto"
                    >
                        Appointment and doctor schedule software for{" "}
                        <span className="text-blue-600">hospitals and clinics</span>
                    </motion.h1>

                    {/* The previous headline, kept as the subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-2xl md:text-3xl font-black text-slate-700 mb-6 tracking-tight"
                    >
                        Management <span className="text-blue-600">Simplified.</span> Patient Care <span className="text-blue-600">Amplified.</span>
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        Pillora Hospital Portal gives hospitals and clinics one place to manage online and walk-in appointments, doctor schedules and slots, and advance consultation fees, synced with the Pillora.in patient booking portal.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <a href="#request-demo" className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            Request a demo <ArrowRight className="w-6 h-6" />
                        </a>
                        <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            Hospital Login
                        </Link>
                        <button
                            onClick={() => setIsPartnerModalOpen(true)}
                            className="w-full sm:w-auto px-10 py-5 bg-white text-slate-600 border border-slate-200 rounded-[2rem] font-bold text-lg hover:bg-slate-50 transition-all"
                        >
                            Partner with us
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-50" aria-labelledby="features-heading">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                    <h2 id="features-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                        Everything your front desk and doctors need
                    </h2>
                    <Link href="/features" className="text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">
                        See all features <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Calendar className="w-8 h-8 text-blue-600" />}
                        title="Smart Appointment Engine"
                        desc="Create consultation slots with durations set by each doctor, and manage online and walk-in appointments in one schedule."
                        href="/features#scheduling"
                    />
                    <FeatureCard
                        icon={<Users className="w-8 h-8 text-blue-600" />}
                        title="Doctor Directory"
                        desc="Manage your hospital&apos;s specialist profiles, availability timings, and consultation fees from a single dashboard."
                        href="/features#doctor-directory"
                    />
                    <FeatureCard
                        icon={<RefreshCw className="w-8 h-8 text-blue-600" />}
                        title="Synced with Pillora.in"
                        desc="The doctors, schedules and fees you manage in your dashboard are shared with the Pillora.in patient booking portal."
                        href="/features#synced"
                    />
                </div>
            </section>

            {/* Who it's for */}
            <section className="max-w-7xl mx-auto px-6 pb-20" aria-labelledby="audience-heading">
                <h2 id="audience-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-10">Built for clinics and hospitals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AudienceCard
                        icon={<Stethoscope className="w-7 h-7 text-blue-600" />}
                        title="For clinics"
                        desc="Move from a paper register to online booking: set your slots, take walk-ins and let patients pay part of the fee in advance."
                        href="/for-clinics"
                        cta="Appointment software for clinics"
                    />
                    <AudienceCard
                        icon={<Building2 className="w-7 h-7 text-blue-600" />}
                        title="For hospitals"
                        desc="Manage OPD appointments across many doctors and specialty groups, with online and walk-in patients in one schedule."
                        href="/for-hospitals"
                        cta="OPD appointment management for hospitals"
                    />
                </div>
            </section>

            {/* Security Section (claims are defined in src/content/claims.ts) */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="bg-slate-900 rounded-[3rem] p-8 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-0" />

                    <div className="relative z-10 max-w-xl">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{UNVERIFIED_CLAIMS.securityHeading}</h2>
                        <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed">
                            {UNVERIFIED_CLAIMS.securityCopy}
                        </p>
                        <div className="flex items-center gap-8">
                            <div>
                                <p className="text-3xl font-black text-white">{UNVERIFIED_CLAIMS.uptime.value}</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{UNVERIFIED_CLAIMS.uptime.label}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex gap-4 shrink-0 w-full md:w-auto">
                        <div className="flex-1 min-w-0 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 text-center aspect-square">
                            <Building2 className="w-8 h-8 md:w-10 md:h-10 text-blue-400 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-blue-400">{UNVERIFIED_CLAIMS.trustedByHospitals.kicker}</p>
                            <p className="text-sm font-bold">{UNVERIFIED_CLAIMS.trustedByHospitals.value}</p>
                        </div>
                        <div className="flex-1 min-w-0 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 text-center aspect-square md:mt-8">
                            <Clock className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">{UNVERIFIED_CLAIMS.liveSupport.kicker}</p>
                            <p className="text-sm font-bold">{UNVERIFIED_CLAIMS.liveSupport.value}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ teaser */}
            <section className="max-w-4xl mx-auto px-6 py-16" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-8">Common questions</h2>
                <div className="space-y-6">
                    {FAQS.slice(1, 4).map((f) => (
                        <div key={f.question}>
                            <h3 className="text-lg font-black text-slate-900">{f.question}</h3>
                            <p className="text-slate-600 mt-2 leading-relaxed">{f.answer}</p>
                        </div>
                    ))}
                </div>
                <Link href="/faq" className="mt-8 text-blue-600 font-bold inline-flex items-center gap-1 hover:underline">
                    Read all questions about Pillora for Hospitals <ArrowRight className="w-4 h-4" />
                </Link>
            </section>

            {/* Request a demo */}
            <section id="request-demo" className="max-w-5xl mx-auto px-6 py-16 scroll-mt-24" aria-labelledby="demo-heading">
                <h2 id="demo-heading" className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Request a demo</h2>
                <p className="text-slate-500 font-medium text-lg mt-3 mb-8">
                    Tell us about your hospital or clinic. We&apos;ll walk you through appointments, doctor slots and advance payments with your own setup.
                </p>
                <DemoRequestForm intent="demo" source="home" />
            </section>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-20 text-center border-t border-slate-50">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">© 2026 Pillora Health • Hospital Partner Division</p>
            </footer>

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
                Learn more about {title.toLowerCase()} <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
}

function AudienceCard({ icon, title, desc, href, cta }: { icon: React.ReactNode; title: string; desc: string; href: string; cta: string }) {
    return (
        <Link href={href} className="block p-10 bg-slate-50/70 border border-slate-100 rounded-[2.5rem] hover:border-blue-200 hover:bg-white transition-all group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">{icon}</div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:underline">
                {cta} <ArrowRight className="w-4 h-4" />
            </span>
        </Link>
    );
}
