"use client";
import React from "react";
import { motion } from "framer-motion";
import {
    Sparkles,
    Users,
    Target,
    Eye,
    Building2,
    LayoutDashboard,
    MapPin,
    Rocket
} from "lucide-react";

const fadeIn = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 font-sans">

            {/* Hero */}
            <section className="relative py-20 md:py-28 px-6 overflow-hidden bg-slate-50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-100/60 rounded-full blur-[120px] -z-10 -mt-32" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-xs font-black tracking-[0.2em] text-blue-700 uppercase bg-blue-600/10 border border-blue-600/20 rounded-full"
                    >
                        <Sparkles className="w-4 h-4" />
                        About Pillora Hospital Portal
                    </motion.div>
                    <motion.h1
                        {...fadeIn}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight tracking-tighter"
                    >
                        Bridging Hospitals <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800">
                            & Patients
                        </span>
                    </motion.h1>
                    <motion.p
                        {...fadeIn}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed"
                    >
                        A next-generation hospital management platform designed to make finding the right hospital, booking an appointment, and managing healthcare as simple as a few taps.
                    </motion.p>
                </div>
            </section>

            {/* Who We Are */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Who We Are</h2>
                            </div>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-6">
                                Pillora is a next-generation hospital management platform designed to bridge the gap between medical institutions and patients. We believe that finding the right hospital, booking an appointment, and managing healthcare should be as simple as a few taps on your phone.
                            </p>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed">
                                We are currently in our <span className="text-blue-600 font-bold">prototype phase</span>, fine-tuning every detail before our official launch. Our mission is simple — eliminate the administrative chaos that hospitals face daily and give patients a seamless, trustworthy experience when they need care the most.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/50">
                                    <Target className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black mb-4">Our Mission</h3>
                                <p className="text-slate-300 leading-relaxed font-medium text-lg italic border-l-4 border-blue-500 pl-6">
                                    &quot;Eliminate the administrative chaos that hospitals face daily and give patients a seamless, trustworthy experience when they need care the most.&quot;
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Our Vision */}
            <section className="py-24 px-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-4 mb-10"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Eye className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Our Vision</h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-xl shadow-slate-200/50"
                    >
                        <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-0">
                            A India where every hospital —{" "}
                            <span className="text-blue-600">whether a large multi-specialty institution or a small local clinic</span>{" "}
                            — has access to powerful, affordable tools to manage their operations, grow their patient base, and deliver better care.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* What We're Building */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-4 mb-10"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">What We&apos;re Building</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-10 rounded-[2.5rem] bg-blue-600 text-white relative overflow-hidden"
                        >
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-xl" />
                            <div className="relative z-10">
                                <Building2 className="w-10 h-10 mb-6 opacity-80" />
                                <h3 className="text-xl font-black mb-4 uppercase tracking-widest text-[13px] text-blue-200">For Hospitals</h3>
                                <p className="text-blue-100 font-medium leading-relaxed text-lg">
                                    Manage doctor schedules, track appointments, handle patient inquiries, and build their digital presence — all from one dashboard.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative overflow-hidden"
                        >
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-blue-100/50 rounded-full blur-xl" />
                            <div className="relative z-10">
                                <Users className="w-10 h-10 mb-6 text-blue-600" />
                                <h3 className="text-xl font-black mb-4 uppercase tracking-widest text-[13px] text-slate-500">For Patients</h3>
                                <p className="text-slate-600 font-medium leading-relaxed text-lg">
                                    A reliable, transparent way to discover hospitals, check doctor availability, read service details, and book with zero friction.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8 text-center text-xl font-bold text-slate-500 italic"
                    >
                        Pillora is not just a listing platform — we are building a{" "}
                        <span className="text-slate-900 not-italic">full ecosystem.</span>
                    </motion.p>
                </div>
            </section>

            {/* Where We Are Today */}
            <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-xs font-black tracking-[0.3em] text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 rounded-full"
                    >
                        <MapPin className="w-4 h-4" />
                        Where We Are Today
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black mb-10 leading-tight"
                    >
                        Pre-Launch. <br />
                        <span className="text-blue-400">Onboarding Early Partners.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-xl text-slate-400 leading-relaxed font-medium max-w-3xl mx-auto mb-12"
                    >
                        We are pre-launch, onboarding early hospital partners who believe in what we&apos;re building. Every hospital that joins us now becomes a foundational partner — shaping the product, getting priority placement, and growing with us from day one.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        {[
                            { label: "Shape the Product", desc: "Your feedback directly influences what we build" },
                            { label: "Priority Placement", desc: "Be at the top when we go live to patients" },
                            { label: "Grow Together", desc: "Partner from day one and scale with us" }
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] text-left backdrop-blur-sm">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                                    <Rocket className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="font-black text-white mb-2">{item.label}</h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Office Location / Contact Info */}
            <section className="py-24 px-6 bg-white relative overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-xs font-black tracking-[0.3em] text-blue-700 uppercase bg-blue-600/10 border border-blue-600/20 rounded-full"
                        >
                            <MapPin className="w-4 h-4" />
                            Our Office
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                            Registered Business Address
                        </h2>
                        <div className="h-1.5 w-20 bg-blue-600 mx-auto rounded-full" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto bg-slate-50 border border-slate-200/60 p-8 md:p-12 rounded-[2.5rem] shadow-lg relative overflow-hidden text-center group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-xl" />
                        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <p className="text-xl text-slate-700 leading-relaxed font-semibold max-w-xl mx-auto">
                            4 Pansheel Society, Jintan Road,<br />
                            Infront of Ultra Vision School,<br />
                            Surendranagar - 363002, Gujarat, India
                        </p>
                    </motion.div>
                </div>
            </section>

        </main>
    );
}