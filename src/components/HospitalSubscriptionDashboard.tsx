"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    CreditCard, 
    Calendar, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Receipt, 
    Phone, 
    Mail, 
    ShieldAlert, 
    ShieldCheck, 
    IndianRupee, 
    RotateCcw, 
    ExternalLink, 
    Lock, 
    Info, 
    Loader2,
    CalendarCheck,
    CalendarX,
    FileText
} from "lucide-react";

interface IHospitalSubData {
    hospital: {
        _id: string;
        name: string;
        email?: string;
        contactNumber?: string;
        joiningDate?: string;
        subscriptionDurationDays: number;
        paymentStatus: 'Pending' | 'Paid';
        subscriptionStatus: 'Active' | 'Pending Payment' | 'Expiring Soon' | 'Expired';
        subscriptionStartDate?: string;
        subscriptionExpiryDate?: string;
        daysRemaining: number;
        isExpired: boolean;
        isExpiringSoon: boolean;
        lastPaymentDate?: string;
        nextPaymentDueDate?: string;
        lastPaymentAmount?: number;
        lastPaymentMethod?: string;
        lastPaymentReference?: string;
        adminNotes?: string;
    };
    payments: Array<{
        _id: string;
        paymentDate: string;
        amount: number;
        paymentMethod: string;
        transactionReference?: string;
        newStartDate: string;
        newExpiryDate: string;
        renewalType: string;
        adminNotes?: string;
        createdAt: string;
    }>;
}

export default function HospitalSubscriptionDashboard() {
    const [subData, setSubData] = useState<IHospitalSubData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSubscription = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await api.get("/hospital/dashboard/subscription");
            setSubData(res.data);
        } catch (err: any) {
            console.error("Failed to fetch hospital subscription", err);
            setError(err.response?.data?.message || "Failed to load subscription details");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });
        } catch {
            return "—";
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-16 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Subscription & Billing...</p>
            </div>
        );
    }

    if (error || !subData) {
        return (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> {error || "Unable to retrieve subscription data"}
                </div>
                <button
                    onClick={fetchSubscription}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Try Again
                </button>
            </div>
        );
    }

    const { hospital, payments } = subData;
    const status = hospital.subscriptionStatus;

    return (
        <div className="space-y-8">
            {/* Top Alert Banners */}
            {hospital.isExpired && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 text-white rounded-3xl shadow-xl shadow-rose-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                            <ShieldAlert className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg tracking-tight">Subscription Expired — Slot Generation Locked</h4>
                            <p className="text-xs font-medium text-rose-100 max-w-2xl leading-relaxed">
                                Your Pillora subscription has expired or your payment is pending. Please contact the Pillora Admin to renew your subscription before generating new appointment slots. Existing confirmed appointments remain safe.
                            </p>
                        </div>
                    </div>
                    <a
                        href="tel:+919876543210"
                        className="px-6 py-3 bg-white text-rose-600 hover:bg-rose-50 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shrink-0 text-center"
                    >
                        Contact Admin to Renew
                    </a>
                </motion.div>
            )}

            {!hospital.isExpired && status === 'Pending Payment' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white rounded-3xl shadow-xl shadow-amber-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg tracking-tight">Subscription Pending Payment</h4>
                            <p className="text-xs font-medium text-amber-100 max-w-2xl leading-relaxed">
                                Your facility account is registered, but the initial 30-day subscription payment is pending confirmation. Once the Pillora Admin verifies your payment, slot generation will be instantly activated.
                            </p>
                        </div>
                    </div>
                    <a
                        href="mailto:admin@pillora.in?subject=Payment Confirmation for Hospital Subscription"
                        className="px-6 py-3 bg-white text-amber-700 hover:bg-amber-50 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shrink-0 text-center"
                    >
                        Notify Admin of Payment
                    </a>
                </motion.div>
            )}

            {hospital.isExpiringSoon && !hospital.isExpired && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl shadow-xl shadow-orange-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                            <AlertTriangle className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg tracking-tight">
                                Subscription Expiring Soon — {hospital.daysRemaining} {hospital.daysRemaining === 1 ? 'Day' : 'Days'} Remaining
                            </h4>
                            <p className="text-xs font-medium text-orange-100 max-w-2xl leading-relaxed">
                                Your 30-day subscription cycle will expire on <strong>{formatDate(hospital.subscriptionExpiryDate)}</strong>. Renew today to extend without service interruption. Any remaining days will be preserved.
                            </p>
                        </div>
                    </div>
                    <a
                        href="tel:+919876543210"
                        className="px-6 py-3 bg-white text-orange-600 hover:bg-orange-50 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shrink-0 text-center"
                    >
                        Request Renewal
                    </a>
                </motion.div>
            )}

            {/* Overview Status Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight font-jakarta">
                                Subscription & Billing Status
                            </h3>
                            {/* Status Badge */}
                            {status === 'Active' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active (30 Days)
                                </span>
                            )}
                            {status === 'Expiring Soon' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Expiring Soon
                                </span>
                            )}
                            {status === 'Expired' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black uppercase tracking-wider">
                                    <CalendarX className="w-3.5 h-3.5 text-rose-600" /> Expired
                                </span>
                            )}
                            {status === 'Pending Payment' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Pending Payment
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                            Pillora automated 30-day billing cycle. All slot creation and deployment permissions are tied to an active subscription.
                        </p>
                    </div>

                    <button
                        onClick={fetchSubscription}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-100 self-start md:self-auto"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Refresh Status
                    </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Days Remaining */}
                    <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Days Remaining</div>
                        <p className={`text-2xl font-black ${
                            hospital.daysRemaining > 5 ? 'text-emerald-600' :
                            hospital.daysRemaining > 0 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                            {status === 'Pending Payment' ? '—' : `${hospital.daysRemaining} Days`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {status === 'Active' ? 'In current billing cycle' : status === 'Pending Payment' ? 'Awaiting payment' : 'Cycle ended'}
                        </p>
                    </div>

                    {/* Subscription Start Date */}
                    <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</div>
                        <p className="text-base font-black text-slate-800">
                            {formatDate(hospital.subscriptionStartDate)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Cycle start date</p>
                    </div>

                    {/* Subscription Expiry Date */}
                    <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expiry Date</div>
                        <p className={`text-base font-black ${hospital.isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatDate(hospital.subscriptionExpiryDate)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Cycle conclusion</p>
                    </div>

                    {/* Last Payment Date */}
                    <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Last Payment</div>
                        <p className="text-base font-black text-slate-800">
                            {formatDate(hospital.lastPaymentDate)}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold">
                            {hospital.lastPaymentAmount ? `₹${hospital.lastPaymentAmount.toLocaleString('en-IN')}` : 'No payment yet'}
                        </p>
                    </div>

                    {/* Next Due Date */}
                    <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next Payment Due</div>
                        <p className="text-base font-black text-slate-800">
                            {formatDate(hospital.nextPaymentDueDate || hospital.subscriptionExpiryDate)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Next 30-day renewal</p>
                    </div>

                    {/* Joining Date */}
                    <div className="p-5 bg-slate-50/70 border border-slate-100 rounded-2xl space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hospital Joining Date</div>
                        <p className="text-base font-black text-slate-800">
                            {formatDate(hospital.joiningDate)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Initial onboard date</p>
                    </div>
                </div>

                {/* Slot Generation Permission Status Box */}
                <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                    status === 'Active' || status === 'Expiring Soon'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/60 border-rose-200 text-rose-900'
                }`}>
                    <div className="flex items-center gap-3">
                        {status === 'Active' || status === 'Expiring Soon' ? (
                            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                        ) : (
                            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                        )}
                        <div>
                            <div className="text-sm font-black">
                                {status === 'Active' || status === 'Expiring Soon'
                                    ? 'Slot Generation Enabled: Your subscription is currently valid.'
                                    : 'Slot Generation Blocked: Active subscription required.'}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                                {status === 'Active' || status === 'Expiring Soon'
                                    ? 'You can freely add individual doctor slots or bulk-deploy smart slots for upcoming dates.'
                                    : 'New appointment slots cannot be generated, edited, or published until payment is recorded by Pillora Admin.'}
                            </div>
                        </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap ${
                        status === 'Active' || status === 'Expiring Soon'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                    }`}>
                        {status === 'Active' || status === 'Expiring Soon' ? 'Access Granted' : 'Locked'}
                    </span>
                </div>
            </div>

            {/* Renewal Instructions & Contact Admin Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Renewal Instructions Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-900 font-jakarta">Payment & Renewal Instructions</h4>
                            <p className="text-xs text-slate-400 font-medium">Simple 3-step cycle renewal workflow</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-xs">
                        <div className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-black shrink-0 text-[11px]">1</span>
                            <div>
                                <p className="font-bold text-slate-800">Transfer Subscription Amount</p>
                                <p className="text-slate-500 mt-0.5">
                                    Send payment via UPI, NEFT/RTGS, or corporate cheque to Pillora Health Tech official account. Keep your UTR or transaction ID handy.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-black shrink-0 text-[11px]">2</span>
                            <div>
                                <p className="font-bold text-slate-800">Notify Pillora Administration</p>
                                <p className="text-slate-500 mt-0.5">
                                    Share your transaction reference with your Pillora account manager via email or phone call.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-black shrink-0 text-[11px]">3</span>
                            <div>
                                <p className="font-bold text-slate-800">Instant 30-Day Automated Extension</p>
                                <p className="text-slate-500 mt-0.5">
                                    Once verified by the Admin, your subscription is extended by 30 days from your expiry date, preserving all current days, and slot generation is instantly active!
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Security note: For platform integrity, only authorized Pillora Admins can activate or renew subscriptions.</span>
                    </div>
                </div>

                {/* Contact Admin Card */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-900 font-jakarta">Contact Pillora Admin</h4>
                            <p className="text-xs text-slate-400 font-medium">Reach our dedicated hospital partnership desk</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Hospital Support Desk</span>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-600" /> +91 98765 43210 / +91 91234 56789
                            </div>
                            <p className="text-[11px] text-slate-400">Available Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Direct Email Address</span>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Mail className="w-4 h-4 text-indigo-600" /> admin@pillora.in / billing@pillora.in
                            </div>
                            <p className="text-[11px] text-slate-400">Include your hospital name and transaction receipt</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <a
                                href="tel:+919876543210"
                                className="py-3 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
                            >
                                <Phone className="w-3.5 h-3.5" /> Call Admin
                            </a>
                            <a
                                href={`mailto:admin@pillora.in?subject=Subscription Renewal - ${hospital.name}&body=Hello Pillora Admin,%0D%0A%0D%0AWe would like to renew our 30-day subscription for ${hospital.name}.%0D%0A%0D%0AThank you!`}
                                className="py-3 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95"
                            >
                                <Mail className="w-3.5 h-3.5" /> Email Admin
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History Audit Table */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-900 font-jakarta">Payment Transaction History</h4>
                            <p className="text-xs text-slate-400 font-medium">Complete record of all confirmed renewals and cycles</p>
                        </div>
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {payments.length} {payments.length === 1 ? 'Transaction' : 'Transactions'}
                    </span>
                </div>

                {payments.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50/60 rounded-2xl">
                        <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">No Payment History Recorded Yet</p>
                        <p className="text-xs text-slate-400 mt-1">
                            When your payment is confirmed by the Pillora Admin, the receipt and 30-day period granted will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Payment Date</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Payment Method</th>
                                    <th className="py-3 px-4">Transaction Ref</th>
                                    <th className="py-3 px-4">Cycle Granted (30 Days)</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Admin Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {payments.map((p) => (
                                    <tr key={p._id} className="hover:bg-slate-50/50">
                                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                                            {formatDate(p.paymentDate)}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap font-black text-emerald-600 text-sm">
                                            ₹{p.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                                            {p.paymentMethod}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                            {p.transactionReference || "—"}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-800">
                                                {formatDate(p.newStartDate)} – {formatDate(p.newExpiryDate)}
                                            </div>
                                            <div className="text-[10px] text-slate-400">30 Calendar Days</div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                p.renewalType === 'EXTENSION'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {p.renewalType}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate" title={p.adminNotes}>
                                            {p.adminNotes || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
