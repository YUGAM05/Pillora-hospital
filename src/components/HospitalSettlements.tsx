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
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch dashboard stats
            const dashRes = await api.get("/settlements/hospital/dashboard", { headers });
            if (dashRes.data.success) {
                setDashboardMetrics(dashRes.data.dashboard);
            }

            // Fetch expected payouts
            const expRes = await api.get("/settlements/hospital/expected", { headers });
            if (expRes.data.success) {
                setExpectedPayout(expRes.data.expected);
            }

            // Fetch history
            const histRes = await api.get("/settlements/hospital/history", { headers });
            if (histRes.data.success) {
                setSettlementHistory(histRes.data.settlements || []);
            }
        } catch (err: any) {
            console.error("[FetchHospitalDataError]", err);
            setError(err.response?.data?.message || "Failed to load financial dashboards.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (hospitalId) {
            fetchHospitalData();
        }
    }, [hospitalId, fetchHospitalData]);

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
            case 'Awaiting Hospital Confirmation': return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
            case 'Under Review': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'Failed': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-blue-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Settlement Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Ready for Settlement': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Awaiting Hospital Confirmation': return 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse';
            case 'Under Review': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Failed': return 'bg-red-50 text-red-700 border-red-100';
            case 'On Hold': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
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
                <button onClick={fetchHospitalData} className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 shadow-md">Try Again</button>
            </div>
        );
    }

    // Pending payout confirmations (Awaiting confirmation status)
    const pendingConfirmations = settlementHistory.filter(s => s.status === 'Awaiting Hospital Confirmation');

    return (
        <div className="space-y-8 font-sans pb-20">
            {/* Business Model Explanation Card */}
            <div className="p-6 bg-gradient-to-r from-blue-50/40 to-indigo-50/20 border border-blue-100/60 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 shrink-0">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-extrabold text-slate-900 text-lg leading-tight">Zero-Commission Settlement Model</h4>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                            Pillora charges a fixed flat ₹2,000 monthly subscription. We charge ₹0 commission on appointment bookings. 
                            Hospitals receive 100% of patient online advance payments (20% of fee), less standard payment gateway charges (2% Razorpay Fee + 18% GST on the fee).
                        </p>
                    </div>
                </div>
            </div>

            {/* ACTIONABLE NOTIFICATION PROMPTS */}
            <AnimatePresence>
                {pendingConfirmations.map((s) => (
                    <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideDown shadow-xl shadow-amber-900/5"
                    >
                        <div className="flex items-start gap-3">
                            <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <h5 className="font-extrabold text-slate-900 text-sm">Payout Confirmation Required</h5>
                                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                                    Pillora Admin sent a payout of <span className="font-bold text-slate-900">{formatCurrency(s.netAmount)}</span> via {s.transferMethod} (UTR: {s.utrNumber}). Please confirm receipt.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleConfirmReceipt(s._id)}
                                disabled={actionSubmitting}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                            >
                                Yes, Payment Received
                            </button>
                            <button
                                onClick={() => setDisputeModalId(s._id)}
                                disabled={actionSubmitting}
                                className="px-5 py-2.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
                            >
                                Report an Issue
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* DASHBOARD CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today&apos;s Online Advance</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-2">
                        {formatCurrency(dashboardMetrics?.todayOnlineCollection)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">From {dashboardMetrics?.todayBookings} booking advances collected</p>
                </div>

                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Payout (Razorpay Clearances)</p>
                    <h3 className="text-3xl font-black text-indigo-700 mt-2">
                        {formatCurrency(dashboardMetrics?.pendingSettlementAmount)}
                    </h3>
                    <p className="text-[10px] text-indigo-500 font-semibold mt-1">Next Expected Cycle: {dashboardMetrics?.nextExpectedSettlementDate}</p>
                </div>

                <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-900/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Settled Payout</p>
                    <h3 className="text-3xl font-black text-emerald-600 mt-2">
                        {formatCurrency(dashboardMetrics?.lastSettlementAmount)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Received on: {dashboardMetrics?.lastSettlementDate}</p>
                </div>
            </div>

            {/* EXPECTED SETTLEMENT SUMMARY */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-900/5 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                    <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border bg-blue-50 text-blue-700 border-blue-100">
                            Upcoming Payout
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-950 mt-2">Expected Settlement Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Gross Collection</p>
                            <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(expectedPayout?.grossCollection)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Est. Settlement Net</p>
                            <p className="text-lg font-bold text-indigo-600 mt-1">{formatCurrency(expectedPayout?.expectedSettlementAmount)}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Eligible Payout Date</p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{expectedPayout?.estimatedSettlementDate}</p>
                    </div>
                </div>

                {/* Progress bar represent T+2 settlement timeline */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Razorpay Settlement Cycle</span>
                        <span className="text-indigo-600">{expectedPayout?.currentStatus}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div 
                            style={{ 
                                width: expectedPayout?.currentStatus === 'Ready for Settlement' ? '100%' : '50%' 
                            }} 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500 shadow-md shadow-indigo-500/10"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">
                        Razorpay settles patient advance collections into Pillora&apos;s account in T+2 working days, which are then manually transferred to your bank.
                    </p>
                </div>
            </div>

            {/* PERMANENT LEDGER / HISTORY */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-900/5 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-950">Payout Ledger History</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Permanent record of payouts and transaction breakdowns</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="py-4 px-6">Settlement ID</th>
                                <th className="py-4 px-6 text-center">Payout Date</th>
                                <th className="py-4 px-6 text-right">Gross Advances</th>
                                <th className="py-4 px-6 text-right">Gateway Overheads</th>
                                <th className="py-4 px-6 text-right">Net Payout</th>
                                <th className="py-4 px-6 text-center">Method</th>
                                <th className="py-4 px-6">UTR Code</th>
                                <th className="py-4 px-6 text-center">Receipt</th>
                                <th className="py-4 px-6 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settlementHistory.map((s) => (
                                <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all font-semibold text-slate-800 text-xs">
                                    <td className="py-5 px-6 font-mono text-blue-600 font-bold">{s.settlementId}</td>
                                    <td className="py-5 px-6 text-center text-slate-400 font-medium">
                                        {new Date(s.transferDate || s.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-5 px-6 text-right font-bold text-slate-700">{formatCurrency(s.grossCollection)}</td>
                                    <td className="py-5 px-6 text-right text-rose-500">{formatCurrency(s.razorpayCharges + s.gstCharges)}</td>
                                    <td className="py-5 px-6 text-right font-black text-indigo-600">{formatCurrency(s.netAmount)}</td>
                                    <td className="py-5 px-6 text-center font-bold text-slate-500">{s.transferMethod}</td>
                                    <td className="py-5 px-6 font-mono text-slate-500 font-medium select-all">{s.utrNumber || '—'}</td>
                                    <td className="py-5 px-6 text-center">
                                        <button 
                                            onClick={() => handlePrintInvoice(s)}
                                            className="p-2 border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-all"
                                            title="Print/Download PDF Receipt"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                    <td className="py-5 px-6 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(s.status)}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {settlementHistory.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-slate-400 font-bold italic">
                                        No payouts recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DISPUTE COMPLAINT DIALOG MODAL */}
            <AnimatePresence>
                {disputeModalId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col relative"
                        >
                            <div className="flex gap-3 mb-2 items-center text-rose-600">
                                <AlertTriangle className="w-6 h-6 shrink-0" />
                                <h3 className="text-xl font-bold text-slate-900">Report Payout Issue</h3>
                            </div>
                            <p className="text-xs text-slate-400 font-semibold mb-6">Describe the issue in detail. This immediately changes status to &apos;Under Review&apos;.</p>

                            <form onSubmit={handleDisputeReceipt} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for dispute</label>
                                    <textarea
                                        required
                                        placeholder="e.g. Received incorrect net payout in bank; UTR reference code is invalid..."
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none text-xs h-28 resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setDisputeModalId(null)}
                                        className="flex-1 py-3.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionSubmitting}
                                        className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-700 shadow-lg shadow-rose-500/10 disabled:opacity-50"
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
