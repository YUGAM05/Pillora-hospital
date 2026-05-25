"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    CheckCircle2,
    AlertCircle,
    Shield,
    UserCheck,
    Lock,
    Scale,
    Ban,
    MapPin,
    Mail
} from 'lucide-react';

const fadeIn = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
};

interface TermsSectionProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    children: React.ReactNode;
}

function TermsSection({ icon, iconBg, title, children }: TermsSectionProps) {
    return (
        <motion.section
            {...fadeIn}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 ${iconBg} rounded-2xl text-white`}>
                    {icon}
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
            </div>
            <div className="text-lg text-slate-600 font-medium leading-relaxed">
                {children}
            </div>
        </motion.section>
    );
}

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 rounded-[2rem] text-white shadow-2xl shadow-slate-300 mb-8"
                    >
                        <FileText className="w-10 h-10" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4"
                    >
                        Terms & <span className="text-blue-600 italic">Conditions</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[11px]"
                    >
                        Last Updated: May 2026
                    </motion.p>
                </header>

                <div className="space-y-8 pb-16">

                    {/* Acceptance */}
                    <TermsSection icon={<CheckCircle2 className="w-6 h-6" />} iconBg="bg-blue-600" title="Acceptance of Terms">
                        By accessing Pillora or registering as a hospital partner, you agree to these Terms and Conditions. If you do not agree, please do not use the platform.
                    </TermsSection>

                    {/* Platform Status */}
                    <TermsSection icon={<AlertCircle className="w-6 h-6" />} iconBg="bg-amber-500" title="Platform Status">
                        Pillora is currently in <span className="text-slate-900 font-black">prototype phase</span>. Features, pricing, and policies are subject to change before and after the official launch. We are not liable for any decisions made based on information available during the prototype period.
                    </TermsSection>

                    {/* Hospital Partner Responsibilities */}
                    <TermsSection icon={<UserCheck className="w-6 h-6" />} iconBg="bg-blue-600" title="Hospital Partner Responsibilities">
                        By submitting your hospital profile, you confirm that all information provided — including hospital name, doctor details, consultation charges, photos, and descriptions — is accurate, current, and not misleading. Pillora reserves the right to reject or remove any listing that contains false, incomplete, or inappropriate information without prior notice.
                    </TermsSection>

                    {/* Prohibited Use */}
                    <motion.section
                        {...fadeIn}
                        className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-rose-600 rounded-2xl text-white">
                                    <Ban className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">Prohibited Use</h2>
                            </div>
                            <p className="text-lg text-slate-300 font-medium leading-relaxed">
                                You may not use Pillora to impersonate a medical institution, submit fraudulent information, or engage in any activity that could harm patients, other partners, or the platform. Violation of this will result in <span className="text-rose-400 font-black">immediate removal from the platform.</span>
                            </p>
                        </div>
                    </motion.section>

                    {/* Intellectual Property */}
                    <TermsSection icon={<Lock className="w-6 h-6" />} iconBg="bg-slate-700" title="Intellectual Property">
                        All design, code, branding, and content on the Pillora platform is the intellectual property of Pillora. You may not copy, reproduce, or distribute any part of the platform without written permission.
                    </TermsSection>

                    {/* Limitation of Liability */}
                    <TermsSection icon={<Shield className="w-6 h-6" />} iconBg="bg-blue-600" title="Limitation of Liability">
                        Pillora is a platform that connects hospitals and patients. We do not provide medical advice and are not responsible for the quality of care delivered by listed hospitals. Patients should independently verify hospital credentials before making healthcare decisions.
                    </TermsSection>

                    {/* Governing Law */}
                    <TermsSection icon={<MapPin className="w-6 h-6" />} iconBg="bg-slate-600" title="Governing Law">
                        These Terms are governed by the laws of India. Any disputes arising from the use of this platform shall be subject to the jurisdiction of courts in <span className="text-slate-900 font-black">Gujarat, India.</span>
                    </TermsSection>

                    {/* Contact */}
                    <motion.section
                        {...fadeIn}
                        className="bg-blue-600 text-white p-8 md:p-12 rounded-[3rem] text-center shadow-2xl shadow-blue-200"
                    >
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <Mail className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight">Legal Enquiries</h2>
                        <p className="text-blue-100 font-medium mb-6">For any queries regarding these Terms, contact our legal team directly.</p>
                        <a
                            href="mailto:legal@pillora.in"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-slate-100 transition-all shadow-xl text-lg"
                        >
                            legal@pillora.in
                        </a>
                    </motion.section>

                    <motion.div
                        {...fadeIn}
                        className="text-center pt-4"
                    >
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                            By using Pillora, you confirm that you have read and agreed to these Terms & Conditions and our{" "}
                            <a href="/privacy" className="text-blue-600 hover:underline normal-case tracking-normal font-black">Privacy Policy</a>.
                        </p>
                    </motion.div>
                </div>

            </div>
        </main>
    );
}
