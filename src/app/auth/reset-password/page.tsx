"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/tokenStorage";
import { Lock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await api.post("/auth/change-password", {
                currentPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });
            
            // On success, redirect to login to start a clean session or just go to home
            alert("Password updated successfully! Please login again.");
            clearAuth();
            router.replace("/login");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 p-10 border border-gray-100"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Secure Your Account</h1>
                    <p className="text-gray-500 font-medium">Please replace your temporary password with a new one to continue.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                            <input
                                required
                                type="password"
                                value={formData.oldPassword}
                                onChange={e => setFormData({...formData, oldPassword: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                placeholder="Enter current password"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                            <input
                                required
                                type="password"
                                value={formData.newPassword}
                                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                placeholder="Min. 8 characters"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
                            <input
                                required
                                type="password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                placeholder="Repeat new password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:translate-y-0"
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                Update Password <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
