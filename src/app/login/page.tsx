"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken, setUser as setStoredUser, getToken, getUser } from "@/lib/tokenStorage";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Lock, Mail, Building2, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

export default function HospitalLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const user = getUser();
        const token = getToken();
        if (user && token && user.role === 'hospital') {
            window.location.replace("/hospital/dashboard");
        }
    }, [router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/login", { email: email.trim(), password });
            const data = res.data;

            if (data.role !== 'hospital' && data.role !== 'admin') {
                setError("This portal is only for Hospital Partners. Please use the User App.");
                return;
            }

            if (!data.token) {
                setError("Login failed: no token received.");
                return;
            }

            setToken(data.token);
            setStoredUser(JSON.stringify({
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status
            }));

            window.dispatchEvent(new Event('storage'));

            if (data.isPasswordResetRequired) {
                window.location.replace("/auth/change-password");
                return;
            }

            window.location.replace("/hospital/dashboard");

        } catch (err: any) {
            if (!err.response) {
                // Network error — backend is unreachable (ECONNREFUSED, timeout, etc.)
                setError("Unable to connect to the server. Please check your internet connection or try again later.");
            } else {
                setError(err.response?.data?.message || "Invalid email or password");
            }
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
                    
                    <Link href="/" className="flex items-center gap-3 relative z-10 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tight">Pillora <span className="text-blue-100 opacity-80">Hospital</span></span>
                    </Link>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-black mb-6 leading-tight">Partner with the future of Healthcare.</h2>
                        <p className="text-blue-100 font-medium text-lg leading-relaxed opacity-90">
                            Access your hospital command center to manage doctor slots, track patient appointments, and monitor your facility&apos;s digital footprint.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-blue-50">Enterprise-Grade Security Protocol Active</p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Hospital Login</h1>
                        <p className="text-slate-500 font-medium">Please enter your partner credentials</p>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-6">
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

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-900 tracking-widest transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <div className="mt-12 text-center pt-8 border-t border-slate-50">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Need Assistance?</p>
                        <div className="flex items-center justify-center gap-4">
                            <Link href="mailto:support@pillora.in" className="text-blue-600 text-sm font-bold hover:underline">Contact Support</Link>
                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                            <Link href="/" className="text-slate-500 text-sm font-bold hover:underline">Back to Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
