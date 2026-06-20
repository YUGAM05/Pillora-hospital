"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
    CreditCard,
    XCircle,
    ShieldAlert,
    Activity,
    RefreshCw,
    Calendar,
    AlertCircle,
    Clock,
    Mail,
    ArrowRight,
    CheckCircle2,
    Lock
} from 'lucide-react';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function RefundPolicyPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const policies = [
        {
            num: "1",
            title: "Advance Payment",
            desc: "Booking an appointment requires an advance payment of 20% of the doctor's consultation fee, collected at the time of booking to confirm the slot.",
            icon: CreditCard,
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            num: "2",
            title: "User-Initiated Cancellation",
            desc: "If you cancel the appointment, the advance payment is non-refundable, regardless of the reason for cancellation.",
            icon: XCircle,
            color: "text-red-600 bg-red-50 border-red-100"
        },
        {
            num: "3",
            title: "No-Show",
            desc: "If you fail to show up for the appointment without prior cancellation, the advance payment will be forfeited.",
            icon: ShieldAlert,
            color: "text-amber-600 bg-amber-50 border-amber-100"
        },
        {
            num: "4",
            title: "Partial or Incomplete Consultation",
            desc: "Once a consultation has commenced, the advance payment is non-refundable, irrespective of the consultation's duration.",
            icon: Activity,
            color: "text-purple-600 bg-purple-50 border-purple-100"
        },
        {
            num: "5",
            title: "Doctor/Hospital Cancellation",
            desc: "If the appointment is cancelled by the doctor or hospital — including in cases where no replacement doctor is available — the full advance payment will be refunded to the original payment method within 42 hours of cancellation.",
            icon: RefreshCw,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
            num: "6",
            title: "Rescheduling",
            desc: "If the doctor reschedules the appointment, you may accept the new slot or cancel for a full refund within 42 hours.",
            icon: Calendar,
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            num: "7",
            title: "Payment Gateway Failure",
            desc: "If payment is deducted but the booking is not confirmed due to a technical or gateway failure, the amount will be auto-refunded to the original payment method.",
            icon: AlertCircle,
            color: "text-yellow-600 bg-yellow-50 border-yellow-100"
        },
        {
            num: "8",
            title: "Refund Mode and Timeline",
            desc: "All refunds are processed to the original source of payment within 42 hours of approval. Additional processing time may apply depending on your bank or payment provider.",
            icon: Clock,
            color: "text-indigo-600 bg-indigo-50 border-indigo-100"
        },
        {
            num: "9",
            title: "Support Desk",
            desc: "For payment-related queries, refund delays, or disputes, contact us at team@pillora.in.",
            icon: Mail,
            color: "text-slate-600 bg-slate-50 border-slate-100"
        }
    ];

    return (
        <main className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900 font-sans">
            {/* Hero Section */}
            <section className="relative py-24 px-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent border-b border-gray-100">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -mr-48 -mt-48 opacity-75" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial="initial"
                        animate="animate"
                        variants={fadeIn}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-5 py-2 mb-6 text-xs font-black tracking-[0.2em] text-blue-700 uppercase bg-blue-600/10 border border-blue-600/20 rounded-full backdrop-blur-md">
                            <Lock className="w-4 h-4" />
                            Billing & Protection
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
                            Refund & <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-700">Cancellation Policy</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
                            Clear, transparent, and fair guidelines for appointment payments and cancellations.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {policies.map((item) => (
                            <motion.div
                                key={item.num}
                                variants={fadeIn}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-slate-300 font-black text-3xl">0{item.num}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600 text-sm font-semibold leading-relaxed">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="mt-20 text-center"
                    >
                        <p className="text-slate-500 font-medium mb-6">Have questions or disputes regarding a refund?</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-10 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 hover:scale-105 transition-all shadow-xl text-sm uppercase tracking-widest"
                        >
                            Submit Support Ticket <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            </section>
            <SupportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </main>
    );
}

function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [subject, setSubject] = React.useState('Refund Request / Inquiry');
    const [message, setMessage] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [success, setSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/support', {
                subject,
                message,
                type: 'Refund Inquiry'
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setMessage('');
            }, 2000);
        } catch (error) {
            console.error('Support submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 md:p-12">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Contact Billing Support</h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            {success ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-900 mb-2">Ticket Submitted!</h4>
                                    <p className="text-gray-500 font-medium">Our billing desk will review your inquiry shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subject</label>
                                        <input
                                            type="text"
                                            value={subject}
                                            readOnly
                                            className="w-full bg-slate-50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 font-bold focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Please describe your query</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Detail the issue, appointment ID, or refund timeline delay..."
                                            className="w-full bg-slate-50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none"
                                        />
                                    </div>
                                    <button
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Submitting Ticket...' : 'Submit Refund Ticket'} <ArrowRight className="w-5 h-5" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
