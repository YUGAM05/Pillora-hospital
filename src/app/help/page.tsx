"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    HelpCircle,
    Building2,
    Users,
    Bug,
    Clock,
    Mail,
    ArrowRight,
    Zap
} from 'lucide-react';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true }
};

interface SupportCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    body: string;
    email: string;
}

function SupportCard({ icon, iconBg, title, body, email }: SupportCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-full hover:border-blue-100 hover:shadow-2xl transition-all duration-500"
        >
            <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg`}>
                {icon}
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{title}</h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-1">{body}</p>
            <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 text-blue-600 font-black text-sm hover:gap-3 transition-all"
            >
                {email} <ArrowRight className="w-4 h-4" />
            </a>
        </motion.div>
    );
}

export default function HelpPage() {
    return (
        <main className="min-h-screen bg-slate-50 font-sans pb-24">

            {/* Hero */}
            <section className="relative pt-24 pb-20 px-6 overflow-hidden bg-slate-900 text-white">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -ml-24 -mb-24" />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/20"
                    >
                        <HelpCircle className="w-10 h-10" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight"
                    >
                        We&apos;re Here to <span className="text-blue-400 italic">Help</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed"
                    >
                        Pillora is currently in its prototype phase and our full documentation and self-serve help portal is being built alongside the product. In the meantime, our team personally handles every query.
                    </motion.p>
                </div>
            </section>

            {/* Support Cards */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <SupportCard
                            icon={<Building2 className="w-7 h-7" />}
                            iconBg="bg-blue-600"
                            title="For Hospitals & Partners"
                            body="If you're onboarding your hospital, facing issues with your profile, or have questions about how listings work — email us and we'll get back to you within 24 hours."
                            email="support@pillora.com"
                        />
                        <SupportCard
                            icon={<Users className="w-7 h-7" />}
                            iconBg="bg-slate-700"
                            title="For Patients"
                            body="If you're having trouble finding a hospital, booking an appointment, or accessing the platform — reach out with a brief description of your issue and we'll resolve it promptly."
                            email="support@pillora.com"
                        />
                        <SupportCard
                            icon={<Bug className="w-7 h-7" />}
                            iconBg="bg-rose-600"
                            title="For Technical Issues"
                            body="If you encounter a bug or something on the platform isn't working as expected, email us with a screenshot and a description of the issue. Your report directly helps us improve."
                            email="tech@pillora.com"
                        />
                    </div>
                </div>
            </section>

            {/* Response Times */}
            <section className="px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        {...fadeIn}
                        className="bg-white rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-xl shadow-slate-200/50"
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 flex-shrink-0">
                                <Clock className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-slate-900 mb-3">Response Times</h2>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                    We are a small team and we take every message seriously. Expect a response within{" "}
                                    <span className="text-slate-900 font-black">24 hours on weekdays.</span>
                                </p>
                            </div>
                            <div className="flex-shrink-0 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-200">
                                <Zap className="w-4 h-4 fill-current" /> Within 24 Hours
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 pt-16">
                <motion.div
                    {...fadeIn}
                    className="max-w-5xl mx-auto bg-blue-600 rounded-[3rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-200"
                >
                    <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -ml-40 -mt-40" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">Still Need Help?</h2>
                        <p className="text-xl text-blue-100 mb-10 font-medium max-w-xl mx-auto">
                            Can&apos;t find what you&apos;re looking for? Reach out — our team personally reads and responds to every message.
                        </p>
                        <a
                            href="mailto:support@pillora.com"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-black rounded-[2rem] hover:bg-slate-100 transition-all shadow-xl text-lg"
                        >
                            support@pillora.com <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>
            </section>

        </main>
    );
}
