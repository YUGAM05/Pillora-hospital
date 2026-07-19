"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Lock, Eye, EyeOff, Check, X, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import api from "@/lib/api";

function HospitalResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenMessage, setTokenMessage] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);

    // Verify token on load
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setTokenMessage("Reset token is missing.");
            setVerifying(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await api.get(`/auth/verify-reset-token?token=${token}`);
                if (res.data.valid) {
                    setTokenValid(true);
                } else {
                    setTokenValid(false);
                    setTokenMessage(res.data.message || "Reset link is invalid or has expired.");
                }
            } catch (err: any) {
                setTokenValid(false);
                setTokenMessage("Unable to verify reset link at this time.");
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    // Validation checks
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`\-]/.test(password);
    const passwordsMatch = password && password === confirmPassword;

    const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) {
            setSubmitError("Please meet all password security requirements.");
            return;
        }
        if (!passwordsMatch) {
            setSubmitError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            await api.post("/auth/reset-password", {
                token,
                password
            });
            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setSubmitError(err.response?.data?.message || "Failed to reset password. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-bold text-sm">Verifying reset token...</p>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="text-center py-4 space-y-6">
                <div className="flex justify-center">
                    <AlertCircle className="w-16 h-16 text-rose-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Invalid Reset Link</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                    {tokenMessage || "Reset link is invalid or has expired."}
                </p>
                <div className="pt-4">
                    <Link
                        href="/forgot-password"
                        className="inline-block py-4 px-8 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
                    >
                        Request New Link
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center py-6 space-y-6">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Password Updated</h3>
                <p className="text-slate-500 font-bold text-sm">
                    Your password has been reset successfully. Redirecting you to the login page...
                </p>
                <div className="flex justify-center">
                    <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center border border-red-100">
                    {submitError}
                </div>
            )}

            {/* Password input */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-900 transition-all"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Confirm Password input */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none font-bold text-slate-900 transition-all"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {/* Dynamic Checklist */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password Requirements</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        {hasMinLength ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}
                        <span className={hasMinLength ? "text-green-600" : "text-slate-500"}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasUppercase ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}
                        <span className={hasUppercase ? "text-green-600" : "text-slate-500"}>One uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasLowercase ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}
                        <span className={hasLowercase ? "text-green-600" : "text-slate-500"}>One lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasNumber ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}
                        <span className={hasNumber ? "text-green-600" : "text-slate-500"}>One number</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                        {hasSpecial ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-slate-400" />}
                        <span className={hasSpecial ? "text-green-600" : "text-slate-500"}>One special character (!@#$%^&*)</span>
                    </div>
                    {password && confirmPassword && (
                        <div className="flex items-center gap-2 md:col-span-2 border-t border-slate-200/60 pt-2 mt-1">
                            {passwordsMatch ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-rose-500" />}
                            <span className={passwordsMatch ? "text-green-600" : "text-rose-500"}>Passwords match</span>
                        </div>
                    )}
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting || !isPasswordValid || !passwordsMatch}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center"
            >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
            </button>
        </form>
    );
}

export default function HospitalResetPasswordPage() {
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
                        <h2 className="text-4xl font-black mb-6 leading-tight">Create Secure Password</h2>
                        <p className="text-blue-100 font-medium text-lg leading-relaxed opacity-90">
                            Create a strong password using at least 8 characters, numbers, symbols, and casing variations to safeguard your command center.
                        </p>
                    </div>

                    <div className="relative z-10 text-xs font-bold text-blue-100">
                        © {new Date().getFullYear()} Pillora Hospital Network. All rights reserved.
                    </div>
                </div>

                {/* Right Side: Reset Form */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-900 mb-2">Reset Password</h1>
                        <p className="text-slate-500 font-medium">Create a strong new password for your account</p>
                    </div>

                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-bold text-sm">Loading...</p>
                        </div>
                    }>
                        <HospitalResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
