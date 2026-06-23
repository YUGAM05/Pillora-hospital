"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    Calendar, 
    DollarSign, 
    TrendingUp, 
    Activity, 
    Clock, 
    Loader2, 
    Info, 
    CheckCircle2, 
    AlertCircle, 
    IndianRupee,
    Gift
} from "lucide-react";
import { motion } from "framer-motion";

interface HospitalSettlementsProps {
    hospitalId: string;
    trialEndDate?: string;
}

export default function HospitalSettlements({ hospitalId, trialEndDate }: HospitalSettlementsProps) {
    const [settlements, setSettlements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSettlements = useCallback(async () => {
        if (!hospitalId) return;
        try {
            const token = getToken();
            const res = await api.get(`/hospitals/${hospitalId}/settlements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSettlements(res.data.settlements || []);
            } else {
                setError(res.data.message || "Failed to load settlements ledger.");
            }
        } catch (err: any) {
            console.error("[FetchHospitalSettlementsError]", err);
            setError("Failed to fetch settlements from server.");
        } finally {
            setLoading(false);
        }
    }, [hospitalId]);

    useEffect(() => {
        if (hospitalId) {
            fetchSettlements();
        }
    }, [hospitalId, fetchSettlements]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'settled': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending_settlement': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'refunded': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'retained_by_pillora': return 'bg-gray-50 text-gray-500 border-gray-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'settled': return 'Settled / Payout Completed';
            case 'pending_settlement': return 'Pending Friday Payout';
            case 'refunded': return 'Refunded to Patient';
            case 'retained_by_pillora': return 'Retained by Pillora';
            default: return status;
        }
    };

    // Calculate aggregated metrics
    const totalSettled = settlements
        .filter(s => s.status === 'settled')
        .reduce((sum, s) => sum + s.settledAmount, 0);

    const totalPending = settlements
        .filter(s => s.status === 'pending_settlement')
        .reduce((sum, s) => sum + s.settledAmount, 0);

    const isTrialActive = trialEndDate ? new Date(trialEndDate) > new Date() : false;

    if (!hospitalId) {
        return (
            <div className="py-12 text-center text-slate-400 font-bold">
                Hospital context is not fully loaded. Please wait...
            </div>
        );
    }

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Retrieving Settlements Log...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-24 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <p className="text-rose-600 font-bold text-lg mb-2">{error}</p>
                <button onClick={fetchSettlements} className="mt-2 text-primary font-bold hover:underline transition-all">Try Again</button>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans">
            {/* Trial Status Banner */}
            <div className={`p-6 rounded-[2rem] border transition-all ${
                isTrialActive 
                ? 'bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border-emerald-100/60'
                : 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-blue-100/60'
            } flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl shadow-lg ${
                        isTrialActive ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'
                    }`}>
                        {isTrialActive ? <Gift className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="font-extrabold text-slate-900 text-lg leading-tight">
                            {isTrialActive ? '3-Month Trial Status: Active' : 'Trial Status: Concluded'}
                        </h4>
                        <p className="text-sm text-slate-500 font-semibold leading-relaxed mt-1">
                            {isTrialActive 
                                ? `Your trial runs until ${new Date(trialEndDate!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}. You receive 100% of all 20% advance booking fees.`
                                : 'You are currently on the standard billing tier. Payouts are split 80% (Hospital) / 20% (Pillora Platform Commission).'
                            }
                        </p>
                    </div>
                </div>
                <div className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border ${
                    isTrialActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                    {isTrialActive ? '100% Payout Share' : '80% Payout Share'}
                </div>
            </div>

            {/* Aggregated Payout Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Settled (Received)</span>
                        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">{formatCurrency(totalSettled)}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">All payout cycles processed successfully</p>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Next Payout</span>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">{formatCurrency(totalPending)}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">To be deposited this Friday at 5:00 PM IST</p>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total processed bookings</span>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-950 font-jakarta tracking-tight">{settlements.length}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-2">Includes active, pending, and refunded items</p>
                </div>
            </div>

            {/* Payout Table */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-950 font-jakarta">Settlement Ledger & History</h3>
                    <p className="text-slate-400 text-xs font-semibold mt-1">Listing of weekly deposits from patient advance checkouts</p>
                </div>

                {settlements.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-base font-bold text-slate-800">No payouts recorded</h4>
                        <p className="text-slate-500 text-xs font-medium mt-1">Once patients book appointments with advance fees, cycles will show up here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                                    <th className="py-4 px-6">Appointment Details</th>
                                    <th className="py-4 px-6">Fee Collected</th>
                                    <th className="py-4 px-6">Your Share %</th>
                                    <th className="py-4 px-6">Payout Share</th>
                                    <th className="py-4 px-6">Payout Date (Friday)</th>
                                    <th className="py-4 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {settlements.map((settlement: any) => {
                                    const app = settlement.appointmentId;
                                    const patientName = app?.patient?.name || "Patient";
                                    const doctorName = app?.doctor?.name || "Doctor";
                                    const appDate = app?.slotTime ? new Date(app.slotTime).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    }) : "N/A";

                                    return (
                                        <tr key={settlement._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-semibold text-slate-800 text-sm">
                                            <td className="py-5 px-6">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-slate-900">Dr. {doctorName}</p>
                                                    <p className="text-xs text-slate-400 font-medium">Patient: {patientName} • {appDate}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-slate-500 font-bold">
                                                {formatCurrency(settlement.amount)}
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                                                    settlement.trialActive 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                    {settlement.trialActive ? '100% (Trial)' : '80% (Commission)'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 font-extrabold text-slate-950">
                                                {formatCurrency(settlement.settledAmount)}
                                            </td>
                                            <td className="py-5 px-6 text-slate-500 font-bold">
                                                {new Date(settlement.settledDate).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(settlement.status)}`}>
                                                    {getStatusLabel(settlement.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
