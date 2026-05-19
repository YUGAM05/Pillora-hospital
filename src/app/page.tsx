"use client";
import React, { useState } from "react";
import Link from "next/link";
import { 
    LayoutDashboard, 
    Calendar, 
    Users, 
    ShieldCheck, 
    Activity, 
    ArrowRight, 
    Building2, 
    Clock, 
    Lock,
    Zap
} from "lucide-react";
import { motion } from "framer-motion";
import PartnerRequestModal from "@/components/PartnerRequestModal";

export default function HospitalPortalHome() {
    const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

    return (
        <main className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
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
                        className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight"
                    >
                        Management <span className="text-blue-600">Simplified.</span><br />
                        Patient Care <span className="text-blue-600">Amplified.</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        Pillora Hospital Portal provides medical institutions with state-of-the-art tools to manage appointments, doctor schedules, and real-time patient booking with zero friction.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                            Hospital Login <ArrowRight className="w-6 h-6" />
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
            <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<Calendar className="w-8 h-8 text-blue-600" />}
                        title="Smart Appointment Engine"
                        desc="Generate real-time consultation slots with customizable durations. Prevent double-bookings with atomic slot locking."
                    />
                    <FeatureCard 
                        icon={<Users className="w-8 h-8 text-blue-600" />}
                        title="Doctor Directory"
                        desc="Manage your hospital&apos;s specialist profiles, availability timings, and consultation fees from a single dashboard."
                    />
                    <FeatureCard 
                        icon={<Zap className="w-8 h-8 text-blue-600" />}
                        title="Real-time Sync"
                        desc="Immediate synchronization between your management panel and the public Pillora.in patient booking portal."
                    />
                </div>
            </section>

            {/* Security Section */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="bg-slate-900 rounded-[3rem] p-10 md:p-20 text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-0" />
                    
                    <div className="relative z-10 max-w-xl">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-600/20">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Secure, Compliant & Reliable.</h2>
                        <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed">
                            Your hospital data is protected with enterprise-grade encryption. We ensure strict multi-tenancy so your records remain private and accessible only to your authorized personnel.
                        </p>
                        <div className="flex items-center gap-8">
                            <div>
                                <p className="text-3xl font-black text-white">99.9%</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-white">ISO</p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Certified</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-2 gap-4 shrink-0">
                        <div className="w-40 h-40 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                            <Building2 className="w-10 h-10 text-blue-400 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-blue-400">Trusted by</p>
                            <p className="text-sm font-bold">500+ Hospitals</p>
                        </div>
                        <div className="w-40 h-40 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col items-center justify-center p-6 text-center mt-8">
                            <Clock className="w-10 h-10 text-emerald-400 mb-3" />
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">24/7</p>
                            <p className="text-sm font-bold">Live Support</p>
                        </div>
                    </div>
                </div>
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

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:border-blue-200 transition-all group hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-blue-900/5">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}
