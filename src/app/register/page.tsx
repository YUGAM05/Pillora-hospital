"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { setToken, setUser, getToken, getUser } from "@/lib/tokenStorage";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Loader2, ArrowRight, FileText, KeyRound, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        const user = getUser();
        const token = getToken();
        if (user && token) {
            if (user.role === 'admin') router.push("/admin");
            else if (user.role === 'hospital') router.push("/hospital/dashboard");
            else router.push("/dashboard");
        }
    }, [router]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Admin MFA state
    const [mfaStep, setMfaStep] = useState(false);
    const [mfaSetup, setMfaSetup] = useState(false);
    const [mfaCode, setMfaCode] = useState("");
    const [mfaUserId, setMfaUserId] = useState("");
    const [mfaToken, setMfaToken] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [mfaSecret, setMfaSecret] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/register", {
                name,
                email,
                password,
                role: "customer"
            });

            setToken(res.data.token);
            setUser(JSON.stringify(res.data));
            router.push("/"); // Redirect to dashboard
        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await api.post('/auth/verify-mfa', {
                mfaToken,
                token: mfaCode,
            });

            await completeAdminLogin(res.data.token, res.data);

        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid authenticator code");
            setMfaCode("");
        } finally {
            setLoading(false);
        }
    };

    const completeAdminLogin = async (token: string, userData: any) => {
        setUser(JSON.stringify(userData));
        setToken(token);
        window.dispatchEvent(new Event('storage'));
        router.push("/admin");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
            {/* Decorative background element matching home page feel */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white border border-gray-100 p-8 rounded-3xl shadow-xl relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <Image src="/pillora-logo-v2.svg" alt="Pillora" width={80} height={80} className="object-contain" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {mfaStep ? "Admin Verification" : "Create Account"}
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        {mfaStep ? "Enter code to access Admin Panel" : "Join Pillora Health Network"}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs text-center border border-red-100"
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {mfaStep ? (
                        <motion.form key="mfa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleMfaVerify} className="space-y-6">
                            <div className="flex items-center gap-3 mb-4 justify-center">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <KeyRound className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            {mfaSetup && (
                                <div className="space-y-4 mb-6 text-center">
                                    <p className="text-slate-500 text-sm">Scan QR code with Authenticator:</p>
                                    {qrCode && <Image src={qrCode} alt="MFA QR Code" width={160} height={160} className="mx-auto" unoptimized />}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 text-center">6-Digit Code</label>
                                <input
                                    className="block w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                className="w-full flex items-center justify-center py-4 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold disabled:opacity-70 transition-all"
                                type="submit"
                                disabled={loading || mfaCode.length !== 6}
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Login"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMfaStep(false); setMfaSetup(false); setError(""); setMfaCode(""); }}
                                className="mt-4 w-full text-sm text-slate-400 hover:text-primary transition-colors text-center"
                            >
                                ← Cancel Admin Login
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form key="register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Agree &amp; Continue <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <p className="text-[11px] text-gray-400 text-center mt-4 px-2 italic">
                                By tapping &quot;Agree &amp; Continue&quot;, you confirm that you have read, understood, and agreed to these 
                                <Link href="/terms" className="text-primary hover:underline whitespace-nowrap"> Terms &amp; Conditions</Link> and our 
                                <Link href="/privacy" className="text-primary hover:underline whitespace-nowrap"> Privacy Policy</Link>.
                            </p>
                        </motion.form>
                    )}
                </AnimatePresence>

                {!mfaStep && (
                    <div className="mt-8 text-center border-t border-gray-100 pt-6">
                        <p className="text-gray-500 text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                                Sign in instead
                            </Link>
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
