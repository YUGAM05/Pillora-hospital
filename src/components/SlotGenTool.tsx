"use client";

import { useState } from "react";
import api from "@/lib/api";
import { SUPPORT_PHONE } from "@/content/marketing";
import { Calendar, Clock, Activity, ShieldAlert, Phone } from "lucide-react";
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
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="space-y-5 pb-5">

            {/* Subscription Blocked or Error Banner */}
            {(isSubscriptionBlocked || errorMessage) && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm space-y-3">
                    <div className="flex items-start gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-semibold text-rose-900">Slot Generation Restricted</p>
                            <p className="leading-relaxed">
                                {errorMessage || restrictionMessage}
                            </p>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-rose-200/70 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-rose-700">
                            Status: {subscriptionStatus || 'Subscription Required'}
                        </span>
                        <a
                            href={`tel:${SUPPORT_PHONE.tel}`}
                            className="ui-btn-danger ui-btn-sm"
                        >
                            <Phone className="w-3.5 h-3.5" /> Contact Admin
                        </a>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Activity className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-blue-700">Generating for</p>
                    <p className="font-semibold text-slate-900 leading-tight truncate">{doctor.isSpecialtyGroup ? "" : "Dr. "}{doctor.name}</p>
                </div>
            </div>

            <label className="block">
                <span className="ui-label flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Select date
                </span>
                <input
                    required
                    type="date"
                    value={formData.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="ui-input"
                />
            </label>

            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="ui-label flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Start
                    </span>
                    <input
                        required
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        className="ui-input"
                    />
                </label>
                <label className="block">
                    <span className="ui-label flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> End
                    </span>
                    <input
                        required
                        type="time"
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        className="ui-input"
                    />
                </label>
            </div>

            <div>
                <span className="ui-label">Consultation duration</span>
                <div className="grid grid-cols-4 gap-2" role="group" aria-label="Consultation duration">
                    {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                            key={mins}
                            type="button"
                            onClick={() => setFormData({...formData, duration: mins.toString()})}
                            aria-pressed={formData.duration === mins.toString()}
                            className={`min-h-[44px] rounded-xl border text-sm font-semibold transition-colors flex items-center justify-center ${
                                formData.duration === mins.toString()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700'
                            }`}
                        >
                            {mins} min
                        </button>
                    ))}
                </div>
            </div>
            </div>

            <div className="sticky bottom-0 z-10 bg-white pt-4 pb-5 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={loading || isSubscriptionBlocked}
                    className={`w-full min-h-[48px] ${
                        isSubscriptionBlocked
                            ? 'ui-btn bg-slate-200 text-slate-500 whitespace-normal'
                            : 'ui-btn-dark'
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
