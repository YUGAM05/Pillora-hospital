"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
    Mail, 
    Phone, 
    MapPin, 
    ArrowRight, 
    CheckCircle2, 
    Sparkles, 
    Building2,
    MessageSquare,
    Hospital
} from 'lucide-react';

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
};

export default function ContactPage() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [subject, setSubject] = React.useState('Appointment Issue');
    const [message, setMessage] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const response = await fetch('http://localhost:5000/api/support/guest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    subject,
                    message
                })
            });

            if (response.ok) {
                setSuccess(true);
                setName('');
                setEmail('');
                setPhone('');
                setSubject('Appointment Issue');
                setMessage('');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to submit form');
            }
        } catch (err) {
            console.error('Contact form submission error:', err);
            setError('Connection failed. Please check your internet connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                            <Sparkles className="w-4 h-4" />
                            Get In Touch
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
                            Contact <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-700">Pillora Support</span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
                            Have a question, facing an issue, or need help with your appointment or payment? We&apos;re here to help.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Left Column: Direct Info */}
                    <div className="lg:col-span-5 space-y-10">
                        {/* Email Card */}
                        <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-xl" />
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6 text-blue-600">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Email Support</h3>
                            <p className="text-slate-600 font-semibold text-sm leading-relaxed mb-6">
                                For all queries — bookings, payments, refunds, prescriptions, or general feedback — write to us directly. We aim to respond within 24–48 hours.
                            </p>
                            <a href="mailto:team@pillora.in" className="text-blue-600 font-black text-base hover:underline flex items-center gap-2">
                                team@pillora.in <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Hospital Partner Info Card */}
                        <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-xl" />
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6 text-blue-600">
                                <Hospital className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">For Hospitals & Clinics</h3>
                            <p className="text-slate-600 font-semibold text-sm leading-relaxed mb-4">
                                Interested in partnering with Pillora? Select &quot;Partnership Inquiry&quot; in the form or email us directly. Our team will reach out within 1–2 business days.
                            </p>
                            <a href="mailto:team@pillora.in" className="text-blue-600 font-black text-base hover:underline flex items-center gap-2">
                                team@pillora.in <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Office Address Card */}
                        <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-xl" />
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center mb-6 text-blue-600">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">Office Address</h3>
                            <p className="text-slate-700 font-bold leading-relaxed text-sm">
                                4 Pansheel Society, Jintan Road,<br />
                                Infront of Ultra Vision School,<br />
                                Surendranagar, Gujarat, 363002, India
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Contact Form */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -mr-24 -mt-24 blur-2xl" />
                        <h3 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                            Contact Form
                        </h3>
                        <p className="text-slate-500 font-semibold mb-8 text-sm">
                            Prefer not to email? Fill out the form below and our team will get back to you.
                        </p>

                        {success ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-100">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 mb-2">Message Sent!</h4>
                                <p className="text-slate-500 font-bold max-w-sm mx-auto">
                                    Thank you for reaching out. We have logged your request and our support desk will respond shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-xs font-bold uppercase tracking-wider">
                                        {error}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-950 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="john@example.com"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-950 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-950 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Subject</label>
                                        <select
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-950 font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all appearance-none"
                                        >
                                            <option value="Appointment Issue">Appointment Issue</option>
                                            <option value="Payment & Refund">Payment & Refund</option>
                                            <option value="Prescription">Prescription</option>
                                            <option value="Account">Account</option>
                                            <option value="Partnership Inquiry">Partnership Inquiry</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Please detail your query or issue..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-slate-950 font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
                                >
                                    {isSubmitting ? 'Sending Message...' : 'Send Message'} <ArrowRight className="w-5 h-5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
