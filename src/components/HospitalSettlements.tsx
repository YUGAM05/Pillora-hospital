"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/tokenStorage";
import { 
    Calendar, 
    DollarSign, 
    TrendingUp, 
    Clock, 
    Loader2, 
    Info, 
    CheckCircle2, 
    AlertCircle, 
    ChevronDown, 
    ChevronUp,
    FileText,
    ArrowUpRight,
    HelpCircle,
    ArrowRight,
    AlertTriangle,
    XCircle,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HospitalSettlementsProps {
    hospitalId: string;
    trialEndDate?: string;
}

export default function HospitalSettlements({ hospitalId, trialEndDate }: HospitalSettlementsProps) {
    // Data States
    const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
    const [expectedPayout, setExpectedPayout] = useState<any>(null);
    const [settlementHistory, setSettlementHistory] = useState<any[]>([]);

    // Loading & UI States
    const [loading, setLoading] = useState(true);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [disputeModalId, setDisputeModalId] = useState<string | null>(null);
    const [disputeReason, setDisputeReason] = useState("");
    const [expandedSettlementId, setExpandedSettlementId] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    // 1. Fetch Hospital settlements data
    const fetchHospitalData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const token = getToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch dashboard stats, expected payouts, and history in parallel with resilience
            const [dashRes, expRes, histRes] = await Promise.allSettled([
                api.get("/settlements/hospital/dashboard", { headers }),
                api.get("/settlements/hospital/expected", { headers }),
                api.get("/settlements/hospital/history", { headers })
            ]);

            if (dashRes.status === "fulfilled" && dashRes.value.data?.success) {
                setDashboardMetrics(dashRes.value.data.dashboard);
            } else if (dashRes.status === "rejected") {
                console.warn("[SettlementDashboardWarning]", dashRes.reason);
            }

            if (expRes.status === "fulfilled" && expRes.value.data?.success) {
                setExpectedPayout(expRes.value.data.expected);
            } else if (expRes.status === "rejected") {
                console.warn("[SettlementExpectedWarning]", expRes.reason);
            }

            if (histRes.status === "fulfilled" && histRes.value.data?.success) {
                setSettlementHistory(histRes.value.data.settlements || []);
            } else if (histRes.status === "rejected") {
                console.warn("[SettlementHistoryWarning]", histRes.reason);
            }
        } catch (err: any) {
            console.error("[FetchHospitalDataError]", err);
            setError(err.response?.data?.message || "Failed to load financial dashboards.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHospitalData();
    }, [fetchHospitalData]);

    // 2. Confirm receipt ("Yes, Payment Received")
    const handleConfirmReceipt = async (settlementId: string) => {
        if (!window.confirm("Are you sure you want to confirm receipt of this payout?")) {
            return;
        }

        setActionSubmitting(true);
        try {
            const token = getToken();
            const res = await api.post(`/settlements/hospital/confirm/${settlementId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert("Thank you! Payout status updated to 'Settlement Completed'.");
                fetchHospitalData();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to confirm receipt.");
        } finally {
            setActionSubmitting(false);
        }
    };

    // 3. Dispute receipt ("Report an Issue")
    const handleDisputeReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disputeModalId || !disputeReason.trim()) {
            alert("Please provide a valid reason.");
            return;
        }

        setActionSubmitting(true);
        try {
            const token = getToken();
            const res = await api.post(`/settlements/hospital/dispute/${disputeModalId}`, {
                reason: disputeReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert("Issue reported. The Pillora administrator team has been notified, and status is now 'Under Review'.");
                setDisputeModalId(null);
                setDisputeReason("");
                fetchHospitalData();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to file dispute.");
        } finally {
            setActionSubmitting(false);
        }
    };

    // 4. Generate printable invoice/receipt overlay
    const handlePrintInvoice = (s: any) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const dateStr = new Date(s.transferDate || s.createdAt).toLocaleDateString('en-IN');
        const confirmDateStr = s.confirmationDate ? new Date(s.confirmationDate).toLocaleDateString('en-IN') : 'Pending';

        const html = `
            <html>
                <head>
                    <title>Settlement Receipt - ${s.settlementId}</title>
                    <style>
                        body { font-family: system-ui, sans-serif; color: #1e293b; padding: 40px; }
                        .header { display: flex; justify-between; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; }
                        .id { color: #2563eb; font-family: monospace; font-size: 16px; margin-top: 5px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
                        .label { font-size: 11px; font-weight: bold; color: #64748b; uppercase; letter-spacing: 0.05em; }
                        .value { font-size: 14px; font-weight: 600; margin-top: 5px; }
                        .table { w-full border-collapse; margin-bottom: 40px; }
                        .table th, .table td { border-bottom: 1px solid #f1f5f9; padding: 12px 16px; text-align: left; }
                        .table th { background: #f8fafc; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
                        .table td { font-size: 13px; font-weight: 500; }
                        .total-row td { border-top: 2px solid #e2e8f0; font-weight: bold; font-size: 14px; }
                        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 50px; border-t: 1px dashed #e2e8f0; padding-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="title">PILLORA HEALTHCARE</div>
                            <div class="id">Settlement Receipt: ${s.settlementId}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 14px; font-weight: bold;">Settlement Cutoff</div>
                            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Date: ${dateStr}</div>
                        </div>
                    </div>
                    <div class="grid">
                        <div>
                            <div class="label">TRANSFERRED TO</div>
                            <div class="value">Hospital ID: ${s.hospitalId}</div>
                            <div class="value">Transfer Method: ${s.transferMethod}</div>
                            <div class="value">UTR Number: ${s.utrNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <div class="label">PAYOUT METRICS</div>
                            <div class="value">Status: ${s.status}</div>
                            <div class="value">Transfer Date: ${dateStr}</div>
                            <div class="value">Confirmation Date: ${confirmDateStr}</div>
                        </div>
                    </div>
                    <table class="table" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Gross Advance</th>
                                <th style="text-align: right;">Razorpay Charges (2%)</th>
                                <th style="text-align: right;">GST on Charges (18%)</th>
                                <th style="text-align: right;">Net Payout</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Consolidated Online Bookings advances</td>
                                <td style="text-align: right;">${formatCurrency(s.grossCollection)}</td>
                                <td style="text-align: right;">${formatCurrency(s.razorpayCharges)}</td>
                                <td style="text-align: right;">${formatCurrency(s.gstCharges)}</td>
                                <td style="text-align: right;">${formatCurrency(s.netAmount)}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="4">Net Transferred Amount</td>
                                <td style="text-align: right; color: #2563eb;">${formatCurrency(s.netAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="footer">
                        This is a computer-generated transaction receipt from Pillora Systems. No physical signature required.<br>
                        For dispute resolutions or queries, contact support@pillora.in
                    </div>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const getTimelineIcon = (status: string) => {
        switch (status) {
            case 'Settlement Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'Awaiting Hospital Confirmation': return <Clock className="w-5 h-5 text-amber-500" />;
            case 'Under Review': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'Failed': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-blue-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Settlement Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Ready for Settlement': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Awaiting Hospital Confirmation': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Under Review': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Failed': return 'bg-red-50 text-red-700 border-red-100';
            case 'On Hold': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="ui-card py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Retrieving settlements log…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ui-card py-16 px-6 text-center">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-7 h-7 text-rose-500" />
                </div>
                <p className="text-rose-600 font-semibold mb-4">{error}</p>
                <button onClick={fetchHospitalData} className="ui-btn-primary">Try Again</button>
            </div>
        );
    }

    // Pending payout confirmations (Awaiting confirmation status)
    const pendingConfirmations = settlementHistory.filter(s => s.status === 'Awaiting Hospital Confirmation');

    return (
        <div className="space-y-6 font-sans pb-10">
            {/* Business Model Explanation Card */}
            <div className="p-4 sm:p-5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3 sm:gap-4">
                <span className="flex h-10 w-10 items-center justify-center bg-blue-600 text-white rounded-xl shrink-0">
                    <Info className="w-5 h-5" />
                </span>
                <div>
                    <h4 className="font-semibold text-slate-900">Zero-Commission Settlement Model</h4>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                        Pillora charges a fixed monthly plan fee (Clinic ₹2,999, Hospital ₹7,999 or Enterprise ₹14,999, plus GST). We charge ₹0 commission on appointment bookings.
                        Hospitals receive 100% of patient online advance payments (20% of fee), less standard payment gateway charges (2% Razorpay Fee + 18% GST on the fee).
                    </p>
                </div>
            </div>

            {/* ACTIONABLE NOTIFICATION PROMPTS */}
            <AnimatePresence>
                {pendingConfirmations.map((s) => (
                    <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-4"
                    >
                        <div className="flex items-start gap-3">
                            <span className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5" />
                            </span>
                            <div className="space-y-1 min-w-0">
                                <p className="text-xs font-semibold text-amber-800">
                                    Action Required • Settlement Confirmation
                                </p>
                                <h5 className="font-semibold text-slate-900">
                                    Settlement Payout Received: {formatCurrency(s.netAmount)}
                                </h5>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Pillora Admin transferred <strong className="font-semibold text-slate-900">{formatCurrency(s.netAmount)}</strong> via <strong className="font-semibold">{s.transferMethod}</strong> (UTR: <code className="font-mono bg-white px-1.5 py-0.5 rounded text-xs text-slate-900 font-semibold">{s.utrNumber}</code>)
                                    {s.startDate && s.endDate && (
                                        <span> for the period <strong className="font-semibold">{new Date(s.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} to {new Date(s.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong> ({s.advanceCount || s.paymentIds?.length || 0} online advances)</span>
                                    )}.
                                    Please confirm whether you have received the funds in your hospital bank account.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:pl-[52px]">
                            <button
                                onClick={() => handleConfirmReceipt(s._id)}
                                disabled={actionSubmitting}
                                className="ui-btn-success whitespace-normal text-left h-auto py-2.5"
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Confirm Received (Yes, I have received the money from Pillora)</span>
                            </button>
                            <button
                                onClick={() => setDisputeModalId(s._id)}
                                disabled={actionSubmitting}
                                className="ui-btn border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                            >
                                Report an Issue
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* DASHBOARD CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="ui-card p-5">
                    <p className="text-[13px] font-medium text-slate-500">Today&apos;s Online Advance</p>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1.5">
                        {formatCurrency(dashboardMetrics?.todayOnlineCollection)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">From {dashboardMetrics?.todayBookings} booking advances collected</p>
                </div>

                <div className="ui-card p-5">
                    <p className="text-[13px] font-medium text-slate-500">Pending Payout (Razorpay Clearances)</p>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-700 mt-1.5">
                        {formatCurrency(dashboardMetrics?.pendingSettlementAmount)}
                    </h3>
                    <p className="text-xs text-indigo-600 mt-1">Next Expected Cycle: {dashboardMetrics?.nextExpectedSettlementDate}</p>
                </div>

                <div className="ui-card p-5">
                    <p className="text-[13px] font-medium text-slate-500">Last Settled Payout</p>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 mt-1.5">
                        {formatCurrency(dashboardMetrics?.lastSettlementAmount)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Received on: {dashboardMetrics?.lastSettlementDate}</p>
                </div>
            </div>

            {/* EXPECTED SETTLEMENT SUMMARY */}
            <div className="ui-card p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                    <div>
                        <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">
                            Upcoming Payout
                        </span>
                        <h3 className="ui-title mt-2">Expected Settlement Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Gross Collection</p>
                            <p className="text-lg font-semibold text-slate-900 mt-0.5">{formatCurrency(expectedPayout?.grossCollection)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-500">Est. Settlement Net</p>
                            <p className="text-lg font-semibold text-indigo-600 mt-0.5">{formatCurrency(expectedPayout?.expectedSettlementAmount)}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Eligible Payout Date</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{expectedPayout?.estimatedSettlementDate}</p>
                    </div>
                </div>

                {/* Progress bar represent T+2 settlement timeline */}
                <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-medium text-slate-600">
                        <span>Razorpay Settlement Cycle</span>
                        <span className="text-indigo-600">{expectedPayout?.currentStatus}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                            style={{
                                width: expectedPayout?.currentStatus === 'Ready for Settlement' ? '100%' : '50%'
                            }}
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Razorpay settles patient advance collections into Pillora&apos;s account in T+2 working days, which are then manually transferred to your bank.
                    </p>
                </div>
            </div>

            {/* PERMANENT LEDGER / HISTORY */}
            <div className="ui-card">
                <div className="p-5 sm:p-6 border-b border-slate-100">
                    <h3 className="ui-title">Payout Ledger History</h3>
                    <p className="ui-subtitle">Permanent record of payouts and transaction breakdowns</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="ui-th pl-6">Settlement ID</th>
                                <th className="ui-th">Period Range</th>
                                <th className="ui-th text-center">Payout Date</th>
                                <th className="ui-th text-right">Gross Advances</th>
                                <th className="ui-th text-right">Gateway Deductions (2.36%)</th>
                                <th className="ui-th text-right">Net Payout</th>
                                <th className="ui-th text-center">Method</th>
                                <th className="ui-th">UTR Code</th>
                                <th className="ui-th text-center">Receipt</th>
                                <th className="ui-th pr-6 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {settlementHistory.map((s) => (
                                <tr key={s._id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="ui-td pl-6 font-mono text-xs text-blue-600 font-semibold whitespace-nowrap">{s.settlementId}</td>
                                    <td className="ui-td whitespace-nowrap">
                                        {s.startDate && s.endDate ? (
                                            <div>
                                                <span>{new Date(s.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(s.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                <div className="text-xs text-slate-500">{s.advanceCount || s.paymentIds?.length || 0} advances</div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">Consolidated</span>
                                        )}
                                    </td>
                                    <td className="ui-td text-center text-slate-500 whitespace-nowrap">
                                        {new Date(s.transferDate || s.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                    </td>
                                    <td className="ui-td text-right font-medium text-slate-800 whitespace-nowrap">{formatCurrency(s.grossCollection)}</td>
                                    <td className="ui-td text-right text-rose-500 font-medium whitespace-nowrap">- {formatCurrency(s.razorpayCharges + s.gstCharges)}</td>
                                    <td className="ui-td text-right font-semibold text-indigo-600 whitespace-nowrap">{formatCurrency(s.netAmount)}</td>
                                    <td className="ui-td text-center text-slate-600">{s.transferMethod}</td>
                                    <td className="ui-td font-mono text-xs text-slate-500 select-all">{s.utrNumber || '—'}</td>
                                    <td className="ui-td text-center">
                                        <button
                                            onClick={() => handlePrintInvoice(s)}
                                            className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                                            title="Print/Download PDF Receipt"
                                            aria-label="Print or download PDF receipt"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                    <td className="ui-td pr-6 text-center">
                                        <span className={`ui-badge ${getStatusColor(s.status)}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {settlementHistory.length === 0 && (
                        <div className="py-12 text-center text-sm text-slate-500">
                            No payouts recorded.
                        </div>
                    )}
                </div>
            </div>

            {/* DISPUTE COMPLAINT DIALOG MODAL */}
            <AnimatePresence>
                {disputeModalId && (
                    <div className="ui-overlay">
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Report Payout Issue"
                            className="ui-dialog sm:max-w-md"
                        >
                            <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                    <AlertTriangle className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 leading-tight">Report Payout Issue</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Describe the issue in detail. This immediately changes status to &apos;Under Review&apos;.</p>
                                </div>
                            </div>

                            <form onSubmit={handleDisputeReceipt} className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-4">
                                <label className="block">
                                    <span className="ui-label">Reason for dispute</span>
                                    <textarea
                                        required
                                        placeholder="e.g. Received incorrect net payout in bank; UTR reference code is invalid..."
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        className="ui-input h-28 resize-none"
                                    />
                                </label>

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setDisputeModalId(null)}
                                        className="ui-btn-secondary flex-1 min-h-[44px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionSubmitting}
                                        className="ui-btn-danger flex-1 min-h-[44px]"
                                    >
                                        {actionSubmitting ? "Submitting Dispute..." : "Submit Complaint"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
