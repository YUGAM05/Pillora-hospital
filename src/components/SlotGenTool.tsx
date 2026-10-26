"use client";

import { useState } from "react";
import api from "@/lib/api";
import { XCircle, Calendar, Clock, Activity, ShieldAlert, Phone, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface SlotGenToolProps {
    doctor: any;
    hospitalId?: string; // Optional, if provided, uses admin route
    subscriptionStatus?: string; // Subscription status: Active, Pending Payment, Expired, etc.
    onClose: () => void;
}

export default function SlotGenTool({ doctor, hospitalId, subscriptionStatus, onClose }: SlotGenToolProps) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        duration: "15"
    });

    const isSubscriptionBlocked = subscriptionStatus === 'Pending Payment' || subscriptionStatus === 'Expired';
    const restrictionMessage = "Your Pillora subscription has expired or your payment is pending. Please contact the Pillora Admin to renew your subscription before generating new appointment slots.";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (isSubscriptionBlocked) {
            setErrorMessage(restrictionMessage);
            return;
        }

        setLoading(true);
        try {
            // If hospitalId is provided, we use the admin route
            const endpoint = hospitalId ? "/admin/slots/generate" : "/hospital/dashboard/slots/generate";
            const payload = {
                doctorId: doctor._id,
                hospitalId: hospitalId || doctor.hospital,
                ...formData
            };

            await api.post(endpoint, payload);
            alert("Slots generated successfully!");
            onClose();
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || "Failed to generate slots";
            setErrorMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar pr-2">

            {/* Subscription Blocked or Error Banner */}
            {(isSubscriptionBlocked || errorMessage) && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold space-y-2">
                    <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-black text-rose-900">Slot Generation Restricted</p>
                            <p className="leading-relaxed font-semibold">
                                {errorMessage || restrictionMessage}
                            </p>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                            Status: {subscriptionStatus || 'Subscription Required'}
                        </span>
                        <a
                            href="tel:+919876543210"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-rose-700 transition-all"
                        >
                            <Phone className="w-3 h-3" /> Contact Admin
                        </a>
                    </div>
                </div>
            )}

            <div className="bg-blue-50/50 p-4 rounded-2xl flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Generating for</p>
                    <p className="font-bold text-slate-900 leading-tight">{doctor.isSpecialtyGroup ? "" : "Dr. "}{doctor.name}</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Select Date
                </label>
                <input 
                    required 
                    type="date" 
                    value={formData.date} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Start
                    </label>
                    <input 
                        required 
                        type="time" 
                        value={formData.startTime} 
                        onChange={e => setFormData({...formData, startTime: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" /> End
                    </label>
                    <input 
                        required 
                        type="time" 
                        value={formData.endTime} 
                        onChange={e => setFormData({...formData, endTime: e.target.value})} 
                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 outline-none transition-all" 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Duration</label>
                <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                            key={mins}
                            type="button"
                            onClick={() => setFormData({...formData, duration: mins.toString()})}
                            className={`py-3.5 sm:py-3 rounded-xl text-xs font-black transition-all border min-h-[44px] flex items-center justify-center ${
                                formData.duration === mins.toString()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-600'
                            }`}
                        >
                            {mins} Min
                        </button>
                    ))}
                </div>
            </div>
            </div>

            <div className="pt-4 mt-auto border-t border-slate-100 sticky bottom-0 bg-white z-10 shrink-0">
                <button 
                    type="submit"
                    disabled={loading || isSubscriptionBlocked} 
                    className={`w-full py-5 font-black rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-3 ${
                        isSubscriptionBlocked 
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                            : 'bg-slate-900 text-white shadow-slate-200 hover:-translate-y-1 active:scale-95 disabled:opacity-50'
                    }`}
                >
                    {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                    ) : isSubscriptionBlocked ? (
                        <>Subscription Inactive — Slot Generation Locked</>
                    ) : (
                        <>Deploy Smart Slots</>
                    )}
                </button>
            </div>
        </form>
    );
}
