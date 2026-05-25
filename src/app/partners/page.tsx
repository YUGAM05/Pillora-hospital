"use client";
import React, { useState } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    CheckCircle2,
    ArrowRight,
    X,
    UserCircle,
    Activity,
    Handshake,
    Camera,
    Stethoscope,
    ClipboardList,
    ChevronRight,
    Zap,
    Star,
    Mail
} from 'lucide-react';

export default function PartnersPage() {
    const [showForm, setShowForm] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const requirements = [
        {
            icon: <Building2 className="w-6 h-6" />,
            title: "Hospital Information",
            desc: "Your hospital's name, location, contact number, and a brief description of your services and specializations."
        },
        {
            icon: <Camera className="w-6 h-6" />,
            title: "Visual Profile",
            desc: "Photos of your facility so patients know what to expect before they walk in."
        },
        {
            icon: <Stethoscope className="w-6 h-6" />,
            title: "Doctor Profiles",
            desc: "Names, specializations, qualifications, and availability of your doctors so patients can find the right care."
        },
        {
            icon: <ClipboardList className="w-6 h-6" />,
            title: "Consultation Details",
            desc: "Your charges, available time slots, and any specific booking instructions."
        }
    ];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const formData = new FormData(e.currentTarget);
            const data: any = Object.fromEntries(formData.entries());
            data.type = 'hospital';

            const response = await api.post('/partners/submit', data);
            if (response.data.success) {
                setFormSubmitted(true);
                setTimeout(() => {
                    setShowForm(false);
                    setFormSubmitted(false);
                }, 5000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-white font-sans">

            {/* Hero */}
            <section className="relative pt-24 pb-20 px-6 overflow-hidden bg-slate-50">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-100/60 rounded-full blur-[120px] -z-10 -mt-32" />
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 mb-8 text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 border border-blue-600/20 rounded-full bg-blue-50"
                    >
                        Partner with Pillora
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]"
                    >
                        Grow Your Hospital&apos;s <br />
                        <span className="text-blue-600">Digital Presence</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 font-medium leading-relaxed max-w-3xl mx-auto mb-10"
                    >
                        Pillora gives hospitals a powerful digital storefront — helping you reach more patients, manage your profile, and stay organized without the complexity of building your own system.
                    </motion.p>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => { setShowForm(true); setFormSubmitted(false); setError(""); }}
                        className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all hover:-translate-y-1"
                    >
                        Apply to Partner <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </section>

            {/* Who Should Partner */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                            Who Should Partner With Us
                        </h2>
                        <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
                            Whether you&apos;re a large multi-specialty hospital, a mid-size clinic, or a specialized care center — if you want to be discoverable by patients online and streamline your appointment process, Pillora is built for you.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Multi-Specialty Hospitals", desc: "Full-suite listings with all departments, doctors, and facilities organized in one place." },
                            { title: "Mid-Size Clinics", desc: "A professional digital profile that helps you compete with larger institutions online." },
                            { title: "Specialized Care Centers", desc: "Targeted visibility for patients actively searching for your specific area of expertise." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:bg-white transition-all duration-500"
                            >
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What We Need From You */}
            <section className="py-24 px-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                            What We Need From You
                        </h2>
                        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            Getting listed on Pillora is straightforward. We ask for:
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {requirements.map((req, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-6 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    {req.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 mb-2">{req.title}</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">{req.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-blue-600 text-white rounded-[2rem] p-8 text-center"
                    >
                        <p className="text-lg font-bold leading-relaxed">
                            That&apos;s it. Once submitted, our team reviews your profile and gets you live on the platform.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Why Partner Early */}
            <section className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-[11px] font-black uppercase tracking-[0.3em] text-blue-400 border border-blue-400/20 rounded-full bg-blue-500/10">
                            <Star className="w-4 h-4" />
                            Founding Partners
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                            Why Partner Early
                        </h2>
                        <p className="text-xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                            Early partners get priority placement on the platform, direct access to our team for feedback and support, and the opportunity to shape features that matter most to your hospital. You&apos;re not just a listing — you&apos;re a <span className="text-white font-black">founding partner.</span>
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {[
                            { icon: <Zap className="w-5 h-5" />, title: "Priority Placement", desc: "Be first in patient search results when we launch." },
                            { icon: <Activity className="w-5 h-5" />, title: "Direct Access", desc: "Talk to our team directly. Your feedback shapes the product." },
                            { icon: <Star className="w-5 h-5" />, title: "Founding Partner Status", desc: "A permanent recognition for hospitals that believed in us first." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all"
                            >
                                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="font-black text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-4"
                    >
                        <p className="text-slate-400 font-medium">Apply through the Partner Registration form or email us directly.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => { setShowForm(true); setFormSubmitted(false); setError(""); }}
                                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3"
                            >
                                Partner Registration <ArrowRight className="w-5 h-5" />
                            </button>
                            <a
                                href="mailto:partners@pillora.in"
                                className="w-full sm:w-auto px-10 py-5 bg-white/10 border border-white/20 text-white rounded-[2rem] font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-3"
                            >
                                <Mail className="w-5 h-5" /> partners@pillora.in
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Partner Application Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 overflow-y-auto bg-slate-900/70 backdrop-blur-sm pt-16 pb-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                                        <Handshake className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Partner Registration</h3>
                                        <p className="text-sm text-slate-400 font-medium">Hospital & Clinic application</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-900">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 md:p-10">
                                {formSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-16 text-center"
                                    >
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-3">Application Submitted!</h2>
                                        <p className="text-slate-500 font-medium">Our team will contact you shortly to discuss next steps.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {error && (
                                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center text-sm font-bold border border-red-100">{error}</div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Hospital Name</label>
                                                <input required name="organizationName" type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium" placeholder="e.g. Apollo Hospital" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">City</label>
                                                <input required name="city" type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium" placeholder="e.g. Ahmedabad" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Contact Name</label>
                                                <input required name="contactPersonName" type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium" placeholder="Your name" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Phone Number</label>
                                                <input required name="phoneNumber" type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium" placeholder="10-digit number" />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Email Address</label>
                                                <input required name="email" type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium" placeholder="email@hospital.com" />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Brief Description of Services</label>
                                                <textarea required name="description" rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white transition-all font-medium resize-none" placeholder="Tell us about your hospital and specializations..." />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {submitting ? "Submitting..." : <>Submit Application <ArrowRight className="w-4 h-4" /></>}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
