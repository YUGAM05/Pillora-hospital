"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { SUPPORT_PHONE } from "@/content/marketing";
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

/** Inbox for renewal and payment emails (same address as the Contact page). */
const RENEWAL_EMAIL = "team@pillora.in";

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
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return "—";
            return d.toLocaleDateString("en-IN", {
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
            <div className="ui-card p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading subscription &amp; billing…</p>
            </div>
        );
    }

    if (error || !subData) {
        return (
            <div className="ui-card p-6 sm:p-8 space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium flex items-center gap-2">
                    <XCircle className="w-5 h-5 shrink-0" /> {error || "Unable to retrieve subscription data"}
                </div>
                <button
                    onClick={fetchSubscription}
                    className="ui-btn-dark"
                >
                    <RotateCcw className="w-4 h-4" /> Try Again
                </button>
            </div>
        );
    }

    const { hospital, payments } = subData;
    const status = hospital.subscriptionStatus;
    const canGenerate = status === 'Active' || status === 'Expiring Soon';

    const metric = (label: string, value: React.ReactNode, sub: React.ReactNode, valueClass = "text-slate-900") => (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-base font-semibold ${valueClass}`}>{value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Top Alert Banners */}
            {hospital.isExpired && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-3">
                        <span className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </span>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-rose-900">Subscription Expired — Slot Generation Locked</h4>
                            <p className="text-sm text-rose-800 max-w-2xl leading-relaxed">
                                Your Pillora subscription has expired or your payment is pending. Please contact the Pillora Admin to renew your subscription before generating new appointment slots. Existing confirmed appointments remain safe.
                            </p>
                        </div>
                    </div>
                    <a
                        href={`tel:${SUPPORT_PHONE.tel}`}
                        className="ui-btn-danger shrink-0 w-full md:w-auto"
                    >
                        Contact Admin to Renew
                    </a>
                </motion.div>
            )}

            {!hospital.isExpired && status === 'Pending Payment' && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-3">
                        <span className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                        </span>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-amber-900">Subscription Pending Payment</h4>
                            <p className="text-sm text-amber-800 max-w-2xl leading-relaxed">
                                Your facility account is registered, but the initial 30-day subscription payment is pending confirmation. Once the Pillora Admin verifies your payment, slot generation will be instantly activated.
                            </p>
                        </div>
                    </div>
                    <a
                        href={`mailto:${RENEWAL_EMAIL}?subject=Payment Confirmation for Hospital Subscription`}
                        className="ui-btn bg-amber-600 text-white shadow-sm hover:bg-amber-700 shrink-0 w-full md:w-auto"
                    >
                        Notify Admin of Payment
                    </a>
                </motion.div>
            )}

            {hospital.isExpiringSoon && !hospital.isExpired && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-start gap-3">
                        <span className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </span>
                        <div className="space-y-1">
                            <h4 className="font-semibold text-orange-900">
                                Subscription Expiring Soon — {hospital.daysRemaining} {hospital.daysRemaining === 1 ? 'Day' : 'Days'} Remaining
                            </h4>
                            <p className="text-sm text-orange-800 max-w-2xl leading-relaxed">
                                Your 30-day subscription cycle will expire on <strong className="font-semibold">{formatDate(hospital.subscriptionExpiryDate)}</strong>. Renew today to extend without service interruption. Any remaining days will be preserved.
                            </p>
                        </div>
                    </div>
                    <a
                        href={`tel:${SUPPORT_PHONE.tel}`}
                        className="ui-btn bg-orange-600 text-white shadow-sm hover:bg-orange-700 shrink-0 w-full md:w-auto"
                    >
                        Request Renewal
                    </a>
                </motion.div>
            )}

            {/* Overview Status Card */}
            <div className="ui-card p-5 sm:p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="ui-title">
                                Subscription &amp; Billing Status
                            </h3>
                            {/* Status Badge */}
                            {status === 'Active' && (
                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Active (30 Days)
                                </span>
                            )}
                            {status === 'Expiring Soon' && (
                                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Expiring Soon
                                </span>
                            )}
                            {status === 'Expired' && (
                                <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">
                                    <CalendarX className="w-3.5 h-3.5" /> Expired
                                </span>
                            )}
                            {status === 'Pending Payment' && (
                                <span className="ui-badge border-slate-200 bg-slate-100 text-slate-700">
                                    <Clock className="w-3.5 h-3.5" /> Pending Payment
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Pillora automated 30-day billing cycle. All slot creation and deployment permissions are tied to an active subscription.
                        </p>
                    </div>

                    <button
                        onClick={fetchSubscription}
                        className="ui-btn-secondary ui-btn-sm min-h-[36px] self-start shrink-0"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Refresh Status
                    </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {metric(
                        "Days remaining",
                        status === 'Pending Payment' ? '—' : `${hospital.daysRemaining} Days`,
                        status === 'Active' ? 'In current billing cycle' : status === 'Pending Payment' ? 'Awaiting payment' : 'Cycle ended',
                        hospital.daysRemaining > 5 ? 'text-emerald-600 text-xl' : hospital.daysRemaining > 0 ? 'text-amber-600 text-xl' : 'text-rose-600 text-xl'
                    )}
                    {metric("Start date", formatDate(hospital.subscriptionStartDate), "Cycle start date")}
                    {metric("Expiry date", formatDate(hospital.subscriptionExpiryDate), "Cycle conclusion", hospital.isExpired ? 'text-rose-600' : 'text-slate-900')}
                    {metric(
                        "Last payment",
                        formatDate(hospital.lastPaymentDate),
                        <span className="font-medium text-emerald-600">
                            {hospital.lastPaymentAmount ? `₹${(Number(hospital.lastPaymentAmount) || 0).toLocaleString('en-IN')}` : 'No payment yet'}
                        </span>
                    )}
                    {metric("Next payment due", formatDate(hospital.nextPaymentDueDate || hospital.subscriptionExpiryDate), "Next 30-day renewal")}
                    {metric("Hospital joining date", formatDate(hospital.joiningDate), "Initial onboard date")}
                </div>

                {/* Slot Generation Permission Status Box */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    canGenerate
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                }`}>
                    <div className="flex items-start gap-3">
                        {canGenerate ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <div className="text-sm font-semibold">
                                {canGenerate
                                    ? 'Slot Generation Enabled: Your subscription is currently valid.'
                                    : 'Slot Generation Blocked: Active subscription required.'}
                            </div>
                            <div className="text-sm text-slate-600 mt-0.5">
                                {canGenerate
                                    ? 'You can freely add individual doctor slots or bulk-deploy smart slots for upcoming dates.'
                                    : 'New appointment slots cannot be generated, edited, or published until payment is recorded by Pillora Admin.'}
                            </div>
                        </div>
                    </div>
                    <span className={`ui-badge self-start sm:self-auto border-transparent ${
                        canGenerate
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                    }`}>
                        {canGenerate ? 'Access Granted' : 'Locked'}
                    </span>
                </div>
            </div>

            {/* Renewal Instructions & Contact Admin Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Renewal Instructions Card */}
                <div className="ui-card p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5" />
                        </span>
                        <div>
                            <h4 className="font-semibold text-slate-900">Payment &amp; Renewal Instructions</h4>
                            <p className="text-sm text-slate-500">Simple 3-step cycle renewal workflow</p>
                        </div>
                    </div>

                    <ol className="space-y-4 text-sm">
                        {[
                            { title: "Transfer Subscription Amount", text: "Send payment via UPI, NEFT/RTGS, or corporate cheque to Pillora Health Tech official account. Keep your UTR or transaction ID handy." },
                            { title: "Notify Pillora Administration", text: "Share your transaction reference with your Pillora account manager via email or phone call." },
                            { title: "Instant 30-Day Automated Extension", text: "Once verified by the Admin, your subscription is extended by 30 days from your expiry date, preserving all current days, and slot generation is instantly active!" },
                        ].map((step, i) => (
                            <li key={step.title} className="flex items-start gap-3">
                                <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-semibold shrink-0 text-xs">{i + 1}</span>
                                <div>
                                    <p className="font-medium text-slate-800">{step.title}</p>
                                    <p className="text-slate-500 mt-0.5 leading-relaxed">{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Security note: For platform integrity, only authorized Pillora Admins can activate or renew subscriptions.</span>
                    </div>
                </div>

                {/* Contact Admin Card */}
                <div className="ui-card p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5" />
                        </span>
                        <div>
                            <h4 className="font-semibold text-slate-900">Contact Pillora Admin</h4>
                            <p className="text-sm text-slate-500">Reach our dedicated hospital partnership desk</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                            <span className="text-xs font-medium text-slate-500">Hospital Support Desk</span>
                            <div className="font-semibold text-slate-900 text-sm flex items-start gap-2">
                                <Phone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" /> {SUPPORT_PHONE.display}
                            </div>
                            <p className="text-xs text-slate-500">Available Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                            <span className="text-xs font-medium text-slate-500">Direct Email Address</span>
                            <div className="font-semibold text-slate-900 text-sm flex items-start gap-2 break-all">
                                <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> {RENEWAL_EMAIL}
                            </div>
                            <p className="text-xs text-slate-500">Include your hospital name and transaction receipt</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <a
                                href={`tel:${SUPPORT_PHONE.tel}`}
                                className="ui-btn-dark"
                            >
                                <Phone className="w-4 h-4" /> Call Admin
                            </a>
                            <a
                                href={`mailto:${RENEWAL_EMAIL}?subject=Subscription Renewal - ${hospital.name}&body=Hello Pillora Admin,%0D%0A%0D%0AWe would like to renew our 30-day subscription for ${hospital.name}.%0D%0A%0D%0AThank you!`}
                                className="ui-btn-primary"
                            >
                                <Mail className="w-4 h-4" /> Email Admin
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History Audit Table */}
            <div className="ui-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Receipt className="w-5 h-5" />
                        </span>
                        <div>
                            <h4 className="font-semibold text-slate-900">Payment Transaction History</h4>
                            <p className="text-sm text-slate-500">Complete record of all confirmed renewals and cycles</p>
                        </div>
                    </div>
                    <span className="ui-badge self-start sm:self-auto border-slate-200 bg-slate-50 text-slate-600">
                        {payments.length} {payments.length === 1 ? 'Transaction' : 'Transactions'}
                    </span>
                </div>

                {payments.length === 0 ? (
                    <div className="m-5 sm:m-6 py-10 px-4 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                        <Receipt className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700">No Payment History Recorded Yet</p>
                        <p className="text-sm text-slate-500 mt-1">
                            When your payment is confirmed by the Pillora Admin, the receipt and 30-day period granted will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="ui-th pl-6">Payment Date</th>
                                    <th className="ui-th">Amount</th>
                                    <th className="ui-th">Payment Method</th>
                                    <th className="ui-th">Transaction Ref</th>
                                    <th className="ui-th">Cycle Granted (30 Days)</th>
                                    <th className="ui-th">Type</th>
                                    <th className="ui-th pr-6">Admin Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payments.map((p) => (
                                    <tr key={p._id} className="hover:bg-slate-50/60">
                                        <td className="ui-td pl-6 whitespace-nowrap font-medium text-slate-900">
                                            {formatDate(p.paymentDate)}
                                        </td>
                                        <td className="ui-td whitespace-nowrap font-semibold text-emerald-600">
                                            ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td className="ui-td whitespace-nowrap">
                                            {p.paymentMethod}
                                        </td>
                                        <td className="ui-td whitespace-nowrap font-mono text-xs text-slate-500">
                                            {p.transactionReference || "—"}
                                        </td>
                                        <td className="ui-td whitespace-nowrap">
                                            <div className="font-medium text-slate-800">
                                                {formatDate(p.newStartDate)} – {formatDate(p.newExpiryDate)}
                                            </div>
                                            <div className="text-xs text-slate-500">30 Calendar Days</div>
                                        </td>
                                        <td className="ui-td whitespace-nowrap">
                                            <span className={`ui-badge ${
                                                p.renewalType === 'EXTENSION'
                                                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            }`}>
                                                {p.renewalType}
                                            </span>
                                        </td>
                                        <td className="ui-td pr-6 text-slate-500 max-w-[200px] truncate" title={p.adminNotes}>
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
