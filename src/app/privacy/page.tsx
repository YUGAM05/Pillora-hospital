"use client";
import React from 'react';
import { motion } from 'framer-motion';
import {
    Lock,
    Info,
    Database,
    Shield,
    UserCheck,
    Mail,
    RefreshCw
} from 'lucide-react';

const fadeIn = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
};

interface SectionProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    children: React.ReactNode;
}

function PolicySection({ icon, iconBg, title, children }: SectionProps) {
    return (
        <motion.section
            {...fadeIn}
            className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100"
        >
            <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 ${iconBg} rounded-2xl text-white`}>
                    {icon}
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
            </div>
            <div className="text-lg text-slate-600 font-medium leading-relaxed">
                {children}
            </div>
        </motion.section>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-slate-50 py-20 px-6 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <header className="mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] text-white shadow-2xl shadow-blue-200 mb-8"
                    >
                        <Lock className="w-10 h-10" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4"
                    >
                        Privacy <span className="text-blue-600 italic">Policy</span>
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

                    {/* Introduction */}
                    <PolicySection icon={<Info className="w-6 h-6" />} iconBg="bg-blue-600" title="Introduction">
                        Pillora (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting the privacy of hospitals, doctors, and patients who use our platform. This Privacy Policy explains what information we collect, how we use it, and how we protect it.
                    </PolicySection>

                    {/* Information We Collect */}
                    <PolicySection icon={<Database className="w-6 h-6" />} iconBg="bg-slate-700" title="Information We Collect">
                        <p className="mb-5">
                            For hospital and doctor partners, we collect: hospital name, contact number, location, facility photos, doctor names and qualifications, specializations, consultation charges, and service descriptions. This information is provided voluntarily during the onboarding process and is used solely to create and display your public profile on Pillora.
                        </p>
                        <p>
                            For patients and visitors, we may collect basic usage data such as pages visited and search queries made on the platform to improve user experience. We do not collect sensitive personal health information at this stage.
                        </p>
                    </PolicySection>

                    {/* How We Use Your Information */}
                    <PolicySection icon={<Shield className="w-6 h-6" />} iconBg="bg-blue-600" title="How We Use Your Information">
                        Information submitted by hospital partners is displayed publicly on the Pillora platform to help patients discover and contact your facility. We do not use your data for advertising, and we do not sell your data to any third party under any circumstances.
                    </PolicySection>

                    {/* Data Storage and Security */}
                    <motion.section
                        {...fadeIn}
                        className="bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/15 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">Data Storage and Security</h2>
                            </div>
                            <p className="text-lg text-slate-300 font-medium leading-relaxed">
                                All data submitted to Pillora is stored securely using industry-standard encryption. We take reasonable technical measures to prevent unauthorized access, loss, or misuse of your information.
                            </p>
                        </div>
                    </motion.section>

                    {/* Your Rights */}
                    <PolicySection icon={<UserCheck className="w-6 h-6" />} iconBg="bg-blue-600" title="Your Rights">
                        <p>
                            You have the right to request correction or deletion of your data at any time. To make a request, contact us at{" "}
                            <a href="mailto:privacy@pillora.in" className="text-blue-600 font-black hover:underline">privacy@pillora.in</a>
                            {" "}and we will process it within 7 working days.
                        </p>
                    </PolicySection>

                    {/* Changes to This Policy */}
                    <PolicySection icon={<RefreshCw className="w-6 h-6" />} iconBg="bg-slate-600" title="Changes to This Policy">
                        As Pillora grows and launches formally, this Privacy Policy will be updated to reflect new features and compliance requirements. We will notify partners of any significant changes.
                    </PolicySection>

                    {/* Contact */}
                    <motion.section
                        {...fadeIn}
                        className="bg-blue-600 text-white p-8 md:p-12 rounded-[3rem] text-center shadow-2xl shadow-blue-200"
                    >
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                            <Mail className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 tracking-tight">Privacy Enquiries</h2>
                        <p className="text-blue-100 font-medium mb-6">For any questions or data requests, contact our privacy team directly.</p>
                        <a
                            href="mailto:privacy@pillora.in"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-black rounded-2xl hover:bg-slate-100 transition-all shadow-xl text-lg"
                        >
                            privacy@pillora.in
                        </a>
                    </motion.section>

                </div>
            </div>
        </main>
    );
}
