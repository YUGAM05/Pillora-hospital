"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, CheckCircle, ArrowLeft, Activity } from "lucide-react";
import api from "@/lib/api";

export default function HospitalForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/auth/forgot-password", {
                email: email.trim(),
                portal: "hospital"
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 blur-[120px] rounded-full opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full opacity-60" />

            <div className="w-full max-w-5xl flex flex-col md:flex-row bg-white border border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden relative z-10">
                
                {/* Left Side: Branding/Info */}
                <div className="hidden md:flex w-1/2 bg-blue-600 p-16 flex-col justify-between text-white relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-lg">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight">Pillora <span className="text-blue-100 opacity-80">Hospital</span></span>
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-black mb-6 leading-tight">Access Recovery Hub</h2>
                        <p className="text-blue-100 font-medium text-lg leading-relaxed opacity-90">
                            Confirm your registered workspace email, and our secure system will send instructions to retrieve your credentials.
                        </p>
                    </div>

                    <div className="relative z-10 text-xs font-bold text-blue-100">
                        © {new Date().getFullYear()} Pillora Hospital Network. All rights reserved.
                    </div>
                </div>

                {/* Right Side: Recover Form */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Recover Password</h1>
                        <p className="text-slate-500 font-medium">Verify your partner credentials to proceed</p>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100">
                            {error}
                        </motion.div>
                    )}

                    {success ? (
                        <div className="space-y-6 text-center md:text-left">
                            <div className="flex justify-center md:justify-start mb-2">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 p-5 rounded-2xl leading-relaxed">
                                If an account exists with this email address, we&apos;ve sent a password reset link.
                            </p>
                            <Link
                                href="/login"
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-900 transition-all"
                                        placeholder="hospital@pillora.in"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                            </button>

                            <div className="text-center mt-6">
                                <Link href="/login" className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
