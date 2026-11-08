"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { 
    IndianRupee, 
    CreditCard, 
    Calendar, 
    Search, 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Banknote, 
    Wallet, 
    ArrowUpRight, 
    Layers, 
    Filter, 
    X, 
    ChevronLeft, 
    ChevronRight, 
    FileText, 
    Eye, 
    Check, 
    Info 
} from "lucide-react";

interface OverviewData {
    period: string;
    dateRange: { start: string; end: string };
    cards: {
        totalConsultationFees: number;
        grossOnlineAdvances: number;
        payableFromPillora: {
            netPayable: number;
            pendingSettlement: number;
            processing: number;
            alreadySettled: number;
        };
        cashAtClinic: number;
        onlineAtClinic: number;
    };
    additionalIndicators: {
        pendingPatientCollection: number;
        pilloraSettlementPending: number;
        totalSuccessfullySettled: number;
        totalGatewayCharges: number;
    };
    reconciliation?: any;
    dailyTrend?: any[];
}

interface PaymentRecord {
    appointmentId: string;
    tokenNumber?: string | number | null;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    doctorName: string;
    consultationFee: number;
    advanceRequired: number;
    advancePaid: number;
    gatewayCharges: number;
    netAdvancePayable: number;
    balanceDue: number;
    balancePaid: number;
    clinicCashCollection: number;
    clinicOnlineCollection: number;
    paymentStatus: string;
    settlementStatus: string;
    appointmentDate: string;
    transactionDate?: string;
    transactions?: Array<{
        transactionId: string;
        amount: number;
        type: string;
        source: string;
        method: string;
        status: string;
        date: string;
    }>;
}

export default function PaymentsAndCollections({ doctors = [] }: { doctors?: any[] }) {
    // Date filter state
    const [period, setPeriod] = useState<string>("this_month");
    const [customStartDate, setCustomStartDate] = useState<string>("");
    const [customEndDate, setCustomEndDate] = useState<string>("");

    // Table filter states
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterDoctorId, setFilterDoctorId] = useState<string>("all");
    const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
    const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
    const [filterSettlementStatus, setFilterSettlementStatus] = useState<string>("all");

    // Pagination
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });

    // Data states
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [records, setRecords] = useState<PaymentRecord[]>([]);
    const [loadingOverview, setLoadingOverview] = useState<boolean>(true);
    const [loadingRecords, setLoadingRecords] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [exporting, setExporting] = useState<boolean>(false);

    // Modals
    const [balanceModalRecord, setBalanceModalRecord] = useState<PaymentRecord | null>(null);
    const [balanceCollectAmount, setBalanceCollectAmount] = useState<number>(0);
    const [balanceCollectMethod, setBalanceCollectMethod] = useState<"cash" | "upi" | "card" | "other_online">("cash");
    const [balanceCollectNotes, setBalanceCollectNotes] = useState<string>("");
    const [balanceSubmitting, setBalanceSubmitting] = useState<boolean>(false);

    const [detailsModalRecord, setDetailsModalRecord] = useState<PaymentRecord | null>(null);

    // Toast feedback
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Build query params string
    const getFilterParams = useCallback((isExport: boolean = false) => {
        const params = new URLSearchParams();
        params.append("period", period);
        if (period === "custom") {
            if (customStartDate) params.append("startDate", customStartDate);
            if (customEndDate) params.append("endDate", customEndDate);
        }
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (filterDoctorId !== "all") params.append("doctorId", filterDoctorId);
        if (filterPaymentMethod !== "all") params.append("paymentMethod", filterPaymentMethod);
        if (filterPaymentStatus !== "all") params.append("paymentStatus", filterPaymentStatus);
        if (filterSettlementStatus !== "all") params.append("settlementStatus", filterSettlementStatus);

        if (isExport) {
            params.append("export", "csv");
        } else {
            params.append("page", page.toString());
            params.append("limit", limit.toString());
        }
        return params.toString();
    }, [period, customStartDate, customEndDate, searchQuery, filterDoctorId, filterPaymentMethod, filterPaymentStatus, filterSettlementStatus, page, limit]);

    // Fetch Overview Metrics
    const fetchOverview = useCallback(async () => {
        setLoadingOverview(true);
        try {
            const params = new URLSearchParams();
            params.append("period", period);
            if (period === "custom") {
                if (customStartDate) params.append("startDate", customStartDate);
                if (customEndDate) params.append("endDate", customEndDate);
            }
            const res = await api.get(`/hospital/dashboard/financial/overview?${params.toString()}`);
            if (res.data?.success) {
                setOverview(res.data);
            }
        } catch (err: any) {
            console.error("Error fetching financial overview:", err);
            showToast("Failed to load financial overview", "error");
        } finally {
            setLoadingOverview(false);
        }
    }, [period, customStartDate, customEndDate]);

    // Fetch Table Records
    const fetchRecords = useCallback(async () => {
        setLoadingRecords(true);
        try {
            const query = getFilterParams(false);
            const res = await api.get(`/hospital/dashboard/financial/appointments?${query}`);
            if (res.data?.success) {
                setRecords(res.data.records || []);
                if (res.data.pagination) {
                    setPagination({
                        totalPages: res.data.pagination.totalPages || 1,
                        totalRecords: res.data.pagination.totalRecords || 0
                    });
                }
            }
        } catch (err: any) {
            console.error("Error fetching appointment payment records:", err);
            showToast("Failed to load payment records", "error");
        } finally {
            setLoadingRecords(false);
        }
    }, [getFilterParams]);

    // Refresh all data
    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchOverview(), fetchRecords()]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    // Handle CSV Export
    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const query = getFilterParams(true);
            const res = await api.get(`/hospital/dashboard/financial/appointments?${query}`, {
                responseType: "blob"
            });
            const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `hospital-payment-records-${new Date().toISOString().split("T")[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast("Export downloaded successfully!", "success");
        } catch (err) {
            console.error("CSV Export error:", err);
            showToast("Failed to download CSV export", "error");
        } finally {
            setExporting(false);
        }
    };

    // Open Balance Collection Modal
    const openBalanceModal = (record: PaymentRecord) => {
        setBalanceModalRecord(record);
        setBalanceCollectAmount(record.balanceDue > 0 ? record.balanceDue : 0);
        setBalanceCollectMethod("cash");
        setBalanceCollectNotes("");
    };

    // Submit Balance Collection
    const handleCollectBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!balanceModalRecord) return;

        if (balanceCollectAmount <= 0) {
            showToast("Please enter an amount greater than 0", "error");
            return;
        }

        if (balanceCollectAmount > balanceModalRecord.balanceDue) {
            if (!confirm(`The amount (₹${balanceCollectAmount}) exceeds remaining balance due (₹${balanceModalRecord.balanceDue}). Do you wish to proceed?`)) {
                return;
            }
        }

        setBalanceSubmitting(true);
        try {
            const res = await api.post(`/hospital/dashboard/appointments/${balanceModalRecord.appointmentId}/collect-balance`, {
                amount: balanceCollectAmount,
                paymentMethod: balanceCollectMethod,
                notes: balanceCollectNotes.trim() || undefined
            });

            if (res.data?.success) {
                showToast(`Collected ₹${balanceCollectAmount} successfully via ${balanceCollectMethod.toUpperCase()}!`, "success");
                setBalanceModalRecord(null);
                // Refresh both cards and table
                fetchOverview();
                fetchRecords();
            } else {
                showToast(res.data?.message || "Failed to record collection", "error");
            }
        } catch (err: any) {
            console.error("Balance collection error:", err);
            showToast(err.response?.data?.message || "Error submitting balance collection", "error");
        } finally {
            setBalanceSubmitting(false);
        }
    };

    // Helpers
    const formatCurrency = (val: number | undefined | null) => {
        const num = Number(val) || 0;
        return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string | undefined | null) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return "N/A";
        }
    };

    const formatDateTime = (dateStr: string | undefined | null) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
        } catch {
            return "N/A";
        }
    };

    // Payment Status Badge Style
    const getPaymentBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-3 h-3" /> Fully Paid</span>;
            case "partial":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> Advance Paid (20%)</span>;
            case "unpaid":
            case "pending":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3 h-3" /> Payment Pending</span>;
            case "refunded":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Refunded</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status || "Pending"}</span>;
        }
    };

    // Settlement Status Badge Style
    const getSettlementBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "settled":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Settled</span>;
            case "processing":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Processing</span>;
            case "pending":
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>;
            case "not_applicable":
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Not Applicable</span>;
            case "failed":
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Failed</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{status || "Pending"}</span>;
        }
    };

    return (
        <div className="space-y-8">
            {/* Toast Alert */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold transition-all transform animate-bounce ${
                    toast.type === "success" 
                        ? "bg-emerald-900 text-emerald-100 border-emerald-700" 
                        : "bg-rose-900 text-rose-100 border-rose-700"
                }`}>
                    {toast.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header with Title & Date Filters */}
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                            <IndianRupee className="w-3.5 h-3.5" /> Financial Dashboard
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payments & Collections</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                            Real-time tracking of patient advance payments, clinic cash & online collections, and Pillora settlement dues.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={refreshAll}
                            disabled={isRefreshing}
                            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </button>

                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            title="Export appointment payment records to CSV"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
                        </button>
                    </div>
                </div>

                {/* Date Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Period:
                    </span>
                    {[
                        { label: "Today", value: "today" },
                        { label: "Yesterday", value: "yesterday" },
                        { label: "This Week", value: "this_week" },
                        { label: "This Month", value: "this_month" },
                        { label: "Last Month", value: "last_month" },
                        { label: "Custom Range", value: "custom" }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => {
                                setPeriod(tab.value);
                                setPage(1);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                period === tab.value
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}

                    {period === "custom" && (
                        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto mt-2 sm:mt-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                placeholder="From"
                            />
                            <span className="text-xs text-slate-400 font-bold">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                placeholder="To"
                            />
                            <button
                                onClick={() => {
                                    setPage(1);
                                    fetchOverview();
                                    fetchRecords();
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 5 Primary Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                {/* Card 1: Total Consultation Fees */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Card 1</span>
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500">Total Consultation Fees</h4>
                        <div className="text-2xl font-black text-slate-900 mt-1">
                            {loadingOverview ? (
                                <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
                            ) : (
                                formatCurrency(overview?.cards?.totalConsultationFees)
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">All appointments in selected period</p>
                    </div>
                </div>

                {/* Card 2: Online Advance via Pillora */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Card 2 • 20% Online</span>
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500">Online Advance via Pillora</h4>
                        <div className="text-2xl font-black text-blue-600 mt-1">
                            {loadingOverview ? (
                                <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
                            ) : (
                                formatCurrency(overview?.cards?.grossOnlineAdvances)
                            )}
                        </div>
                        <p className="text-[11px] text-blue-600/80 mt-2 font-medium">Gross advance collected via Pillora.in</p>
                    </div>
                </div>

                {/* Card 3: Payable from Pillora (Distinguished Breakdown) */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-900/20 relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Card 3 • Net Settlement</span>
                            <div className="w-8 h-8 rounded-xl bg-white/10 text-indigo-200 flex items-center justify-center">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </div>
                        <h4 className="text-xs font-semibold text-indigo-200">Payable from Pillora</h4>
                        <div className="text-2xl font-black text-white mt-1">
                            {loadingOverview ? (
                                <div className="h-8 w-28 bg-white/20 rounded-lg animate-pulse" />
                            ) : (
                                formatCurrency(overview?.cards?.payableFromPillora?.netPayable)
                            )}
                        </div>
                        <p className="text-[10px] text-indigo-300 mt-1">Advances minus 2.36% gateway fees</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-amber-300">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pending Settlement:</span>
                            <span className="font-bold">{formatCurrency(overview?.cards?.payableFromPillora?.pendingSettlement)}</span>
                        </div>
                        <div className="flex justify-between items-center text-blue-200">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Processing:</span>
                            <span className="font-bold">{formatCurrency(overview?.cards?.payableFromPillora?.processing)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-300">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Already Settled:</span>
                            <span className="font-bold">{formatCurrency(overview?.cards?.payableFromPillora?.alreadySettled)}</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: Collected at Clinic – Cash */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Card 4 • Physical</span>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <Banknote className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500">Collected at Clinic – Cash</h4>
                        <div className="text-2xl font-black text-emerald-600 mt-1">
                            {loadingOverview ? (
                                <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
                            ) : (
                                formatCurrency(overview?.cards?.cashAtClinic)
                            )}
                        </div>
                        <p className="text-[11px] text-emerald-600/80 mt-2 font-medium">Recorded direct hospital cash</p>
                    </div>
                </div>

                {/* Card 5: Collected at Clinic – Online */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">Card 5 • UPI / Card</span>
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500">Collected at Clinic – Online</h4>
                        <div className="text-2xl font-black text-teal-600 mt-1">
                            {loadingOverview ? (
                                <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
                            ) : (
                                formatCurrency(overview?.cards?.onlineAtClinic)
                            )}
                        </div>
                        <p className="text-[11px] text-teal-600/80 mt-2 font-medium">Direct UPI / Card collected at clinic</p>
                    </div>
                </div>
            </div>

            {/* 4 Additional Financial Indicators */}
            <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Summary Indicators & Balances
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                        <p className="text-[11px] font-bold text-slate-500">Pending Patient Collection</p>
                        <p className="text-base sm:text-lg font-black text-rose-600 mt-0.5">
                            {loadingOverview ? "..." : formatCurrency(overview?.additionalIndicators?.pendingPatientCollection)}
                        </p>
                        <span className="text-[10px] text-slate-400">Total fees – total collections</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                        <p className="text-[11px] font-bold text-slate-500">Pillora Settlement Pending</p>
                        <p className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
                            {loadingOverview ? "..." : formatCurrency(overview?.additionalIndicators?.pilloraSettlementPending)}
                        </p>
                        <span className="text-[10px] text-slate-400">Net advances pending payout</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                        <p className="text-[11px] font-bold text-slate-500">Total Successfully Settled</p>
                        <p className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
                            {loadingOverview ? "..." : formatCurrency(overview?.additionalIndicators?.totalSuccessfullySettled)}
                        </p>
                        <span className="text-[10px] text-slate-400">Net advances paid out</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                        <p className="text-[11px] font-bold text-slate-500">Total Gateway Charges</p>
                        <p className="text-base sm:text-lg font-black text-slate-700 mt-0.5">
                            {loadingOverview ? "..." : formatCurrency(overview?.additionalIndicators?.totalGatewayCharges)}
                        </p>
                        <span className="text-[10px] text-slate-400">2% fee + 18% GST (2.36%)</span>
                    </div>
                </div>
            </div>

            {/* Detailed Appointment Payment Records Table Section */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden space-y-4">
                {/* Table Header & Filters */}
                <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Appointment Payment Records</h3>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                Individual appointment breakdown showing advance paid, balance due, clinic collections, and settlement status.
                            </p>
                        </div>
                        <div className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
                            Showing {records.length} of {pagination.totalRecords} records
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search patient, phone, ID..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                            />
                        </div>

                        {/* Doctor Filter */}
                        <div>
                            <select
                                value={filterDoctorId}
                                onChange={(e) => {
                                    setFilterDoctorId(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                            >
                                <option value="all">All Doctors</option>
                                {doctors.map((doc: any) => (
                                    <option key={doc._id} value={doc._id}>
                                        Dr. {doc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Method Filter */}
                        <div>
                            <select
                                value={filterPaymentMethod}
                                onChange={(e) => {
                                    setFilterPaymentMethod(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                            >
                                <option value="all">All Payment Methods</option>
                                <option value="razorpay">Online Advance (Pillora)</option>
                                <option value="cash">Cash at Clinic</option>
                                <option value="online">Online / UPI at Clinic</option>
                            </select>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <select
                                value={filterPaymentStatus}
                                onChange={(e) => {
                                    setFilterPaymentStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                            >
                                <option value="all">All Payment Statuses</option>
                                <option value="partial">Advance Paid (20%)</option>
                                <option value="paid">Fully Paid</option>
                                <option value="unpaid">Payment Pending</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>

                        {/* Settlement Status Filter */}
                        <div>
                            <select
                                value={filterSettlementStatus}
                                onChange={(e) => {
                                    setFilterSettlementStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
                            >
                                <option value="all">All Settlement Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Settled">Settled</option>
                                <option value="not_applicable">Not Applicable</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50/75 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="py-3.5 px-4">Token / ID</th>
                                <th className="py-3.5 px-4">Patient Info</th>
                                <th className="py-3.5 px-4">Doctor</th>
                                <th className="py-3.5 px-4 text-right">Fee</th>
                                <th className="py-3.5 px-4 text-right">Advance (20%)</th>
                                <th className="py-3.5 px-4 text-right">Gateway</th>
                                <th className="py-3.5 px-4 text-right">Net Advance</th>
                                <th className="py-3.5 px-4 text-right">Balance Due</th>
                                <th className="py-3.5 px-4 text-right">Clinic Paid</th>
                                <th className="py-3.5 px-4">Payment Status</th>
                                <th className="py-3.5 px-4">Settlement</th>
                                <th className="py-3.5 px-4">Date</th>
                                <th className="py-3.5 px-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {loadingRecords ? (
                                <tr>
                                    <td colSpan={13} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                            <span>Loading appointment payment records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <FileText className="w-8 h-8 text-slate-300" />
                                            <p className="font-bold text-slate-600">No payment records found</p>
                                            <p className="text-[11px] text-slate-400">Try adjusting your filters or date range</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => {
                                    const hasBalanceDue = record.balanceDue > 0;
                                    const clinicCollectionTotal = record.clinicCashCollection + record.clinicOnlineCollection;

                                    return (
                                        <tr key={record.appointmentId} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                                {record.tokenNumber ? (
                                                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px]">
                                                        #{record.tokenNumber}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-500">
                                                        {record.appointmentId.slice(-6).toUpperCase()}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{record.patientName}</div>
                                                <div className="text-[11px] text-slate-400">{record.patientPhone}</div>
                                            </td>

                                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                                                {record.doctorName}
                                            </td>

                                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                                                ₹{record.consultationFee}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                {record.advancePaid > 0 ? (
                                                    <span className="font-bold text-blue-600">₹{record.advancePaid}</span>
                                                ) : (
                                                    <span className="text-slate-400">₹0</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right text-slate-500">
                                                {record.gatewayCharges > 0 ? `₹${record.gatewayCharges}` : "—"}
                                            </td>

                                            <td className="py-3.5 px-4 text-right font-semibold text-indigo-700">
                                                {record.netAdvancePayable > 0 ? `₹${record.netAdvancePayable}` : "—"}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                {hasBalanceDue ? (
                                                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                                                        ₹{record.balanceDue}
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-600 font-bold">₹0</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                {clinicCollectionTotal > 0 ? (
                                                    <div>
                                                        <span className="font-bold text-slate-800">₹{clinicCollectionTotal}</span>
                                                        <div className="text-[10px] text-slate-400">
                                                            {record.clinicCashCollection > 0 && `Cash: ₹${record.clinicCashCollection} `}
                                                            {record.clinicOnlineCollection > 0 && `Online: ₹${record.clinicOnlineCollection}`}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {getPaymentBadge(record.paymentStatus)}
                                            </td>

                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {getSettlementBadge(record.settlementStatus)}
                                            </td>

                                            <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                                                {formatDate(record.appointmentDate)}
                                            </td>

                                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {hasBalanceDue && (
                                                        <button
                                                            onClick={() => openBalanceModal(record)}
                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all active:scale-95"
                                                            title="Collect remaining balance at clinic"
                                                        >
                                                            <Banknote className="w-3 h-3" />
                                                            <span>Collect</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setDetailsModalRecord(record)}
                                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span>
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal: Collect Balance at Clinic (Scenario C) */}
            {balanceModalRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Collect Balance Payment</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Record clinic collection for appointment</p>
                            </div>
                            <button
                                onClick={() => setBalanceModalRecord(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Summary of Fees */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                            <div className="flex justify-between font-bold text-slate-700">
                                <span>Patient:</span>
                                <span className="text-slate-900">{balanceModalRecord.patientName} ({balanceModalRecord.patientPhone})</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-700">
                                <span>Doctor:</span>
                                <span className="text-slate-900">{balanceModalRecord.doctorName}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between">
                                <span className="text-slate-500 font-semibold">Total Consultation Fee:</span>
                                <span className="font-bold text-slate-900">₹{balanceModalRecord.consultationFee}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-700">
                                <span className="font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Advance Paid (Pillora.in):
                                </span>
                                <span className="font-black bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                                    ₹{balanceModalRecord.advancePaid}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-rose-700 pt-1 font-bold">
                                <span>Remaining Balance Due:</span>
                                <span className="text-sm font-black text-rose-600">
                                    ₹{balanceModalRecord.balanceDue}
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCollectBalanceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: "Cash", value: "cash" },
                                        { label: "UPI", value: "upi" },
                                        { label: "Card", value: "card" },
                                        { label: "Other", value: "other_online" }
                                    ].map((m) => (
                                        <button
                                            type="button"
                                            key={m.value}
                                            onClick={() => setBalanceCollectMethod(m.value as any)}
                                            className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                                                balanceCollectMethod === m.value
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Amount Received (₹)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={balanceModalRecord.balanceDue * 2}
                                    step="0.01"
                                    required
                                    value={balanceCollectAmount}
                                    onChange={(e) => setBalanceCollectAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Default is remaining balance ₹{balanceModalRecord.balanceDue}. Partial collection is permitted.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                                    Reference / Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={balanceCollectNotes}
                                    onChange={(e) => setBalanceCollectNotes(e.target.value)}
                                    placeholder="e.g. UPI Ref #12345678, Cash counter 2"
                                    className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setBalanceModalRecord(null)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={balanceSubmitting}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {balanceSubmitting ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Confirm Collection</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View Details */}
            {detailsModalRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Appointment Financial Details</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    ID: {detailsModalRecord.appointmentId} {detailsModalRecord.tokenNumber ? `• Token #${detailsModalRecord.tokenNumber}` : ""}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailsModalRecord(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Top Cards in Modal */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Consultation Fee</span>
                                <p className="text-base font-black text-slate-900 mt-0.5">₹{detailsModalRecord.consultationFee}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-500 uppercase">Advance Paid</span>
                                <p className="text-base font-black text-blue-700 mt-0.5">₹{detailsModalRecord.advancePaid}</p>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase">Net Advance</span>
                                <p className="text-base font-black text-indigo-700 mt-0.5">₹{detailsModalRecord.netAdvancePayable}</p>
                                <span className="text-[9px] text-indigo-400">Fee deduction: ₹{detailsModalRecord.gatewayCharges}</span>
                            </div>
                            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                                <span className="text-[10px] font-bold text-rose-500 uppercase">Balance Due</span>
                                <p className="text-base font-black text-rose-700 mt-0.5">₹{detailsModalRecord.balanceDue}</p>
                            </div>
                        </div>

                        {/* Patient & Doctor Details */}
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Patient</span>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{detailsModalRecord.patientName}</p>
                                <p className="text-slate-500">{detailsModalRecord.patientPhone}</p>
                                {detailsModalRecord.patientEmail && <p className="text-slate-400 text-[11px]">{detailsModalRecord.patientEmail}</p>}
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Doctor</span>
                                <p className="font-bold text-slate-800 text-sm mt-0.5">{detailsModalRecord.doctorName}</p>
                                <p className="text-slate-500">Date: {formatDate(detailsModalRecord.appointmentDate)}</p>
                            </div>
                        </div>

                        {/* Transaction Ledger */}
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                                Transaction Ledger ({detailsModalRecord.transactions?.length || 0} Records)
                            </h4>
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-3">Txn ID</th>
                                            <th className="py-2.5 px-3">Type</th>
                                            <th className="py-2.5 px-3">Method</th>
                                            <th className="py-2.5 px-3 text-right">Amount</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
                                        {!detailsModalRecord.transactions || detailsModalRecord.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-4 text-center text-slate-400">
                                                    No transaction records attached to this appointment.
                                                </td>
                                            </tr>
                                        ) : (
                                            detailsModalRecord.transactions.map((tx) => (
                                                <tr key={tx.transactionId} className="hover:bg-slate-50">
                                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tx.transactionId}</td>
                                                    <td className="py-2.5 px-3 capitalize">{tx.type}</td>
                                                    <td className="py-2.5 px-3 capitalize">{tx.method}</td>
                                                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{tx.amount}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-400">{formatDateTime(tx.date)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setDetailsModalRecord(null)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

