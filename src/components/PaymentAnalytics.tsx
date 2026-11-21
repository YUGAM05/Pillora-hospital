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
    X, 
    ChevronLeft, 
    ChevronRight, 
    FileText, 
    Eye, 
    Check, 
    Info,
    Pencil,
    Lock,
    History,
    AlertTriangle,
    ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doctorLabel } from "@/lib/doctorName";

interface OverviewCards {
    totalConsultationFees: number;
    grossOnlineAdvances: number;
    payableFromPillora: {
        title?: string;
        netPayable: number;
        outstandingPayable?: number;
        pendingSettlement: number;
        processing: number;
        alreadySettled: number;
    };
    cashAtClinic: number;
    onlineAtClinic: number;
}

interface AdditionalIndicators {
    pendingPatientCollection: number;
    pilloraSettlementPending: number;
    totalSuccessfullySettled: number;
    totalGatewayCharges: number;
    patientOverCollection?: number;
}

interface OverviewData {
    period: string;
    dateRange: { start: string; end: string };
    cards: OverviewCards;
    additionalIndicators: AdditionalIndicators;
}

interface PaymentRecord {
    appointmentId: string;
    tokenNumber?: string | number | null;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    doctorId?: string;
    doctorName: string;
    consultationFee: number;
    advanceRequired: number;
    advancePaid: number;
    gatewayCharges: number;
    netAdvancePayable: number;
    balanceDue: number;
    balancePaid: number;
    totalCollected?: number;
    overCollectionAmount?: number;
    clinicCashCollection: number;
    clinicOnlineCollection: number;
    paymentStatus: string;
    settlementStatus: string;
    appointmentDate: string;
    transactionDate?: string;
    transactions?: Array<{
        transactionId: string;
        paymentId?: string;
        amount: number;
        type: string;
        source: string;
        method: string;
        status: string;
        date: string;
        notes?: string;
    }>;
}

export default function PaymentAnalytics({ doctors = [] }: { doctors?: any[] }) {
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
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [loadingAuditHistory, setLoadingAuditHistory] = useState<boolean>(false);

    // Edit Payment & Collection States
    const [editModalRecord, setEditModalRecord] = useState<PaymentRecord | null>(null);
    const [editFormData, setEditFormData] = useState({
        patientName: "",
        doctorId: "",
        consultationFee: 0,
        paymentId: "",
        paymentAmount: 0,
        paymentMethod: "cash" as "cash" | "upi" | "card" | "qr" | "other_online",
        paymentDate: "",
        transactionReference: "",
        notes: ""
    });
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [confirmReason, setConfirmReason] = useState<string>("");
    const [editSubmitting, setEditSubmitting] = useState<boolean>(false);

    // Toast feedback
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Query parameters builder
    const getFilterParams = useCallback((isExport: boolean = false) => {
        const params = new URLSearchParams();
        params.append("period", period);
        params.append("dateFilter", period);
        if (period === "custom") {
            if (customStartDate) {
                params.append("startDate", customStartDate);
                params.append("customStart", customStartDate);
            }
            if (customEndDate) {
                params.append("endDate", customEndDate);
                params.append("customEnd", customEndDate);
            }
        }
        if (searchQuery.trim()) params.append("search", searchQuery.trim());
        if (filterDoctorId !== "all") params.append("doctorId", filterDoctorId);
        if (filterPaymentMethod !== "all") params.append("paymentMethod", filterPaymentMethod);
        if (filterPaymentStatus !== "all") params.append("paymentStatus", filterPaymentStatus);
        if (filterSettlementStatus !== "all") params.append("settlementStatus", filterSettlementStatus);

        if (isExport) {
            // Backend (financialController) reads `exportFormat`; `export` kept for older builds.
            params.append("exportFormat", "csv");
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
            params.append("dateFilter", period);
            if (period === "custom") {
                if (customStartDate) {
                    params.append("startDate", customStartDate);
                    params.append("customStart", customStartDate);
                }
                if (customEndDate) {
                    params.append("endDate", customEndDate);
                    params.append("customEnd", customEndDate);
                }
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

    // Fetch Appointment Payment Records
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
            console.error("Error fetching payment records:", err);
            showToast("Failed to load payment records", "error");
        } finally {
            setLoadingRecords(false);
        }
    }, [getFilterParams]);

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

    // CSV Export
    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const query = getFilterParams(true);
            const res = await api.get(`/hospital/dashboard/financial/appointments?${query}`, {
                responseType: "blob"
            });
            if (res.data?.type && String(res.data.type).includes("json")) {
                throw new Error("Server returned JSON instead of CSV");
            }
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
            if (!confirm(`The amount (₹${balanceCollectAmount}) exceeds the remaining balance due (₹${balanceModalRecord.balanceDue}). Proceed?`)) {
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
                fetchOverview();
                fetchRecords();
            } else {
                showToast(res.data?.message || res.data?.error || "Failed to record collection", "error");
            }
        } catch (err: any) {
            console.error("Balance collection error:", err);
            showToast(err.response?.data?.message || err.response?.data?.error || "Error submitting balance collection", "error");
        } finally {
            setBalanceSubmitting(false);
        }
    };

    // Fetch Audit History when Details Modal Opens
    useEffect(() => {
        if (!detailsModalRecord) {
            setAuditHistory([]);
            return;
        }
        const fetchAudit = async () => {
            setLoadingAuditHistory(true);
            try {
                const res = await api.get(`/hospital/dashboard/appointments/${detailsModalRecord.appointmentId}/payment-history`);
                if (res.data?.success) {
                    setAuditHistory(res.data.history || []);
                }
            } catch (err) {
                console.error("[FetchAuditHistoryError]", err);
            } finally {
                setLoadingAuditHistory(false);
            }
        };
        fetchAudit();
    }, [detailsModalRecord]);

    // Open Edit Payment & Collection Modal
    const openEditModal = (record: PaymentRecord) => {
        const clinicTx = record.transactions?.find(t => 
            t.source === "clinic_collection" || 
            t.method === "cash" || 
            t.method === "upi" || 
            t.method === "card" ||
            t.type === "balance"
        ) || (record.transactions && record.transactions.length > 0 ? record.transactions[record.transactions.length - 1] : null);

        setEditFormData({
            patientName: record.patientName || "",
            doctorId: record.doctorId || "",
            consultationFee: record.consultationFee || 0,
            paymentId: clinicTx?.paymentId || "",
            paymentAmount: record.balancePaid || clinicTx?.amount || 0,
            paymentMethod: (clinicTx?.method as any) || (record.clinicCashCollection > 0 ? "cash" : "upi"),
            paymentDate: clinicTx?.date ? new Date(clinicTx.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            transactionReference: clinicTx?.transactionId || "",
            notes: (clinicTx as any)?.notes || ""
        });
        setEditModalRecord(record);
        setShowConfirmModal(false);
        setConfirmReason("");
    };

    // Calculate Diff for Confirmation Modal
    const getFieldChanges = () => {
        if (!editModalRecord) return [];
        const changes: Array<{ label: string; oldValue: any; newValue: any }> = [];

        if (editFormData.patientName.trim() !== (editModalRecord.patientName || "").trim()) {
            changes.push({
                label: "Patient Name",
                oldValue: editModalRecord.patientName || "N/A",
                newValue: editFormData.patientName.trim()
            });
        }

        if (editFormData.doctorId && editFormData.doctorId !== editModalRecord.doctorId) {
            const docObj = doctors.find((d: any) => d._id === editFormData.doctorId);
            changes.push({
                label: "Assigned Doctor",
                oldValue: editModalRecord.doctorName,
                newValue: docObj ? doctorLabel(docObj) : editFormData.doctorId
            });
        }

        if (Number(editFormData.consultationFee) !== editModalRecord.consultationFee) {
            changes.push({
                label: "Consultation Fee",
                oldValue: `₹${editModalRecord.consultationFee}`,
                newValue: `₹${editFormData.consultationFee}`
            });
        }

        if (Number(editFormData.paymentAmount) !== editModalRecord.balancePaid) {
            changes.push({
                label: "Clinic Collection Amount",
                oldValue: `₹${editModalRecord.balancePaid.toFixed(2)}`,
                newValue: `₹${Number(editFormData.paymentAmount).toFixed(2)}`
            });
        }

        const clinicTx = editModalRecord.transactions?.find(t => 
            t.source === "clinic_collection" || t.method === "cash" || t.method === "upi" || t.method === "card"
        );
        const oldMethod = clinicTx?.method || (editModalRecord.clinicCashCollection > 0 ? "cash" : "upi");
        if (editFormData.paymentMethod !== oldMethod) {
            changes.push({
                label: "Payment Mode",
                oldValue: String(oldMethod).toUpperCase(),
                newValue: String(editFormData.paymentMethod).toUpperCase()
            });
        }

        if (editFormData.transactionReference.trim() !== (clinicTx?.transactionId || "").trim()) {
            changes.push({
                label: "Transaction Reference",
                oldValue: clinicTx?.transactionId || "None",
                newValue: editFormData.transactionReference.trim() || "None"
            });
        }

        if (editFormData.notes.trim() !== ((clinicTx as any)?.notes || "").trim()) {
            changes.push({
                label: "Collection Notes",
                oldValue: (clinicTx as any)?.notes || "None",
                newValue: editFormData.notes.trim() || "None"
            });
        }

        return changes;
    };

    // Submit Edit to Backend
    const handleSaveEditSubmit = async () => {
        if (!editModalRecord) return;
        if (!confirmReason.trim() || confirmReason.trim().length < 3) {
            showToast("Please provide a valid mandatory reason for modification (minimum 3 characters).", "error");
            return;
        }

        setEditSubmitting(true);
        try {
            const payload = {
                reason: confirmReason.trim(),
                patientName: editFormData.patientName.trim(),
                doctorId: editFormData.doctorId || undefined,
                consultationFee: Number(editFormData.consultationFee),
                paymentId: editFormData.paymentId || undefined,
                paymentAmount: Number(editFormData.paymentAmount),
                paymentMethod: editFormData.paymentMethod,
                paymentDate: editFormData.paymentDate ? new Date(editFormData.paymentDate).toISOString() : undefined,
                transactionReference: editFormData.transactionReference.trim(),
                notes: editFormData.notes.trim()
            };

            const res = await api.put(`/hospital/dashboard/appointments/${editModalRecord.appointmentId}/financial-edit`, payload);

            if (res.data?.success) {
                showToast("Payment and collection details updated successfully!", "success");
                setShowConfirmModal(false);
                setEditModalRecord(null);
                setConfirmReason("");
                fetchOverview();
                fetchRecords();
            } else {
                showToast(res.data?.message || res.data?.error || "Failed to update payment record", "error");
            }
        } catch (err: any) {
            console.error("[EditPaymentError]", err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update payment record";
            showToast(errMsg, "error");
        } finally {
            setEditSubmitting(false);
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

    const getPaymentBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700"><Check className="w-3 h-3" /> Fully Paid</span>;
            case "partial":
                return <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700"><Clock className="w-3 h-3" /> Advance Paid (20%)</span>;
            case "unpaid":
            case "pending":
                return <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700"><AlertCircle className="w-3 h-3" /> Payment Pending</span>;
            case "refunded":
                return <span className="ui-badge border-purple-200 bg-purple-50 text-purple-700">Refunded</span>;
            default:
                return <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">{status || "Pending"}</span>;
        }
    };

    const getSettlementBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case "settled":
                return <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Settled</span>;
            case "processing":
                return <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">Processing</span>;
            case "pending":
                return <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Pending</span>;
            case "not_applicable":
                return <span className="ui-badge border-slate-200 bg-slate-50 text-slate-500">Not Applicable</span>;
            case "failed":
                return <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Failed</span>;
            default:
                return <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">{status || "Pending"}</span>;
        }
    };

    // Extract overview cards and indicators defensively (supports both .cards and .primaryCards formats)
    const cards = {
        totalConsultationFees: overview?.cards?.totalConsultationFees ?? (overview as any)?.primaryCards?.totalConsultationFees ?? 0,
        grossOnlineAdvances: overview?.cards?.grossOnlineAdvances ?? (overview as any)?.primaryCards?.onlineAdvanceViaPillora?.grossAmount ?? 0,
        payableFromPillora: {
            title: overview?.cards?.payableFromPillora?.title ?? "Total Net Settlement",
            netPayable: overview?.cards?.payableFromPillora?.netPayable ?? (overview as any)?.primaryCards?.payableFromPillora?.netAmount ?? 0,
            outstandingPayable: overview?.cards?.payableFromPillora?.outstandingPayable ?? (
                (overview?.cards?.payableFromPillora?.pendingSettlement ?? 0) + (overview?.cards?.payableFromPillora?.processing ?? 0)
            ),
            pendingSettlement: overview?.cards?.payableFromPillora?.pendingSettlement ?? (overview as any)?.primaryCards?.payableFromPillora?.breakdown?.pendingSettlement ?? 0,
            processing: overview?.cards?.payableFromPillora?.processing ?? (overview as any)?.primaryCards?.payableFromPillora?.breakdown?.processing ?? 0,
            alreadySettled: overview?.cards?.payableFromPillora?.alreadySettled ?? (overview as any)?.primaryCards?.payableFromPillora?.breakdown?.alreadySettled ?? 0
        },
        cashAtClinic: overview?.cards?.cashAtClinic ?? (overview as any)?.primaryCards?.collectedAtClinicCash?.amount ?? 0,
        onlineAtClinic: overview?.cards?.onlineAtClinic ?? (overview as any)?.primaryCards?.collectedAtClinicOnline?.amount ?? 0
    };

    const indicators = {
        pendingPatientCollection: overview?.additionalIndicators?.pendingPatientCollection ?? 0,
        pilloraSettlementPending: overview?.additionalIndicators?.pilloraSettlementPending ?? 0,
        totalSuccessfullySettled: overview?.additionalIndicators?.totalSuccessfullySettled ?? 0,
        totalGatewayCharges: overview?.additionalIndicators?.totalGatewayCharges ?? 0,
        patientOverCollection: overview?.additionalIndicators?.patientOverCollection ?? 0
    };

    return (
        <div>
            <div className="space-y-6">
                {/* Header with Title & Date Filters */}
                <section className="ui-card p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <IndianRupee className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-blue-600">Financial overview & collections</p>
                                <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Payments & collections</h2>
                                <p className="ui-subtitle">
                                    Live tracking of online patient advances, direct clinic cash & digital collections, and Pillora net settlement dues.
                                </p>
                            </div>
                        </div>

                        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
                            <button
                                onClick={refreshAll}
                                disabled={isRefreshing}
                                className="ui-btn-secondary"
                                title="Refresh data"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>

                            <button
                                onClick={handleExportCSV}
                                disabled={exporting}
                                className="ui-btn-success"
                                title="Export appointment payment records to CSV"
                            >
                                <Download className="h-4 w-4" />
                                <span>{exporting ? "Exporting..." : "Export CSV"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Filter Bar */}
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-slate-500">
                                <Calendar className="h-4 w-4" /> Period:
                            </span>
                            <div className="no-scrollbar -mx-5 min-w-0 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                                <div className="ui-segmented">
                                    {[
                                        { label: "Today", value: "today" },
                                        { label: "Yesterday", value: "yesterday" },
                                        { label: "This week", value: "this_week" },
                                        { label: "This month", value: "this_month" },
                                        { label: "Last month", value: "last_month" },
                                        { label: "Custom range", value: "custom" }
                                    ].map((tab) => (
                                        <button
                                            key={tab.value}
                                            onClick={() => {
                                                setPeriod(tab.value);
                                                setPage(1);
                                            }}
                                            className={`ui-segment shrink-0 whitespace-nowrap ${
                                                period === tab.value ? "ui-segment-active" : ""
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {period === "custom" && (
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:inline-flex sm:flex-nowrap">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="ui-input min-w-0 flex-1 sm:w-44 sm:flex-none"
                                    placeholder="From"
                                />
                                <span className="text-sm text-slate-500">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="ui-input min-w-0 flex-1 sm:w-44 sm:flex-none"
                                    placeholder="To"
                                />
                                <button
                                    onClick={() => {
                                        setPage(1);
                                        fetchOverview();
                                        fetchRecords();
                                    }}
                                    className="ui-btn-primary w-full sm:w-auto"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* FIVE PRIMARY FINANCIAL CARDS */}
                {/* Total Consultation Fees | Online Advance via Pillora | Payable from Pillora | Collected at Clinic (Cash) | Collected at Clinic (Online) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                    {/* CARD 1: TOTAL CONSULTATION FEES */}
                    <div className="ui-card flex flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">All appointments</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <Layers className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-slate-500">Total consultation fees</p>
                        <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {loadingOverview ? (
                                <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-100 sm:h-9" />
                            ) : (
                                formatCurrency(cards.totalConsultationFees)
                            )}
                        </div>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Value of all appointments within selected date range</p>
                    </div>

                    {/* CARD 2: ONLINE ADVANCE VIA PILLORA */}
                    <div className="ui-card flex flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">20% online advance</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CreditCard className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-slate-500">Online advance via Pillora</p>
                        <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {loadingOverview ? (
                                <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-100 sm:h-9" />
                            ) : (
                                formatCurrency(cards.grossOnlineAdvances)
                            )}
                        </div>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Gross advance collected through Pillora.in</p>
                    </div>

                    {/* CARD 3: TOTAL NET SETTLEMENT */}
                    <div className="ui-card flex flex-col p-4 sm:col-span-2 sm:p-5 xl:col-span-1 xl:col-start-3 xl:row-span-2 xl:row-start-1">
                        <div className="flex items-start justify-between gap-3">
                            <span className="ui-badge border-indigo-200 bg-indigo-50 text-indigo-700">Payable by Pillora</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Wallet className="h-5 w-5" />
                            </span>
                        </div>
                        {/* Side by side while this card spans the full row (tablets), stacked otherwise */}
                        <div className="mt-2 grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-1 xl:gap-4">
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium leading-snug text-slate-500">Total net settlement</p>
                                <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                    {loadingOverview ? (
                                        <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-100 sm:h-9" />
                                    ) : (
                                        formatCurrency(cards.payableFromPillora.netPayable)
                                    )}
                                </div>
                                <p className="mt-1 text-xs leading-snug text-slate-500">Advances minus 2.36% gateway charges (Gross – Gateway = Pending + Processing + Settled)</p>
                            </div>

                            <div className="min-w-0">
                                {/* Separate Outstanding Payable figure */}
                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                                        <Clock className="h-3.5 w-3.5 shrink-0" /> Outstanding payable:
                                    </span>
                                    <span className="text-sm font-bold text-amber-900">
                                        {formatCurrency(cards.payableFromPillora.pendingSettlement + cards.payableFromPillora.processing)}
                                    </span>
                                </div>
                                <span className="mt-1.5 block text-[11px] leading-snug text-slate-500">Pending + Processing only • Excludes settled payouts</span>

                                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" /> Pending settlement:</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(cards.payableFromPillora.pendingSettlement)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" /> Processing:</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(cards.payableFromPillora.processing)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" /> Already settled:</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(cards.payableFromPillora.alreadySettled)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 4: COLLECTED AT CLINIC (CASH) */}
                    <div className="ui-card flex flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Physical cash</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Banknote className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-slate-500">Collected at clinic (cash)</p>
                        <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {loadingOverview ? (
                                <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-100 sm:h-9" />
                            ) : (
                                formatCurrency(cards.cashAtClinic)
                            )}
                        </div>
                        <p className="mt-1 text-xs leading-snug text-slate-500">All payments recorded by hospital staff as cash collections</p>
                    </div>

                    {/* CARD 5: COLLECTED AT CLINIC (ONLINE) */}
                    <div className="ui-card flex flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <span className="ui-badge border-teal-200 bg-teal-50 text-teal-700">UPI / Card / QR</span>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                <ArrowUpRight className="h-5 w-5" />
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium leading-snug text-slate-500">Collected at clinic (online)</p>
                        <div className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {loadingOverview ? (
                                <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-100 sm:h-9" />
                            ) : (
                                formatCurrency(cards.onlineAtClinic)
                            )}
                        </div>
                        <p className="mt-1 text-xs leading-snug text-slate-500">Direct UPI, Card, and digital payments collected at the facility</p>
                    </div>
                </div>

                {/* ADDITIONAL FINANCIAL SUMMARY (INDICATORS) */}
                <section className="ui-card space-y-4 p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-800">Additional financial summary</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                            <p className="text-[13px] font-medium leading-snug text-slate-500">Pending patient collection</p>
                            <p className="mt-1 break-words text-lg font-bold tracking-tight text-rose-600 sm:text-xl">
                                {loadingOverview ? "..." : formatCurrency(indicators.pendingPatientCollection)}
                            </p>
                            <span className="mt-0.5 block text-xs leading-snug text-slate-500">Total fees – total collections</span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                            <p className="text-[13px] font-medium leading-snug text-slate-500">Pillora settlement pending</p>
                            <p className="mt-1 break-words text-lg font-bold tracking-tight text-amber-600 sm:text-xl">
                                {loadingOverview ? "..." : formatCurrency(indicators.pilloraSettlementPending)}
                            </p>
                            <span className="mt-0.5 block text-xs leading-snug text-slate-500">Net advances pending payout</span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                            <p className="text-[13px] font-medium leading-snug text-slate-500">Total successfully settled</p>
                            <p className="mt-1 break-words text-lg font-bold tracking-tight text-emerald-600 sm:text-xl">
                                {loadingOverview ? "..." : formatCurrency(indicators.totalSuccessfullySettled)}
                            </p>
                            <span className="mt-0.5 block text-xs leading-snug text-slate-500">Net advances already paid to hospital</span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                            <p className="text-[13px] font-medium leading-snug text-slate-500">Total gateway charges</p>
                            <p className="mt-1 break-words text-lg font-bold tracking-tight text-slate-700 sm:text-xl">
                                {loadingOverview ? "..." : formatCurrency(indicators.totalGatewayCharges)}
                            </p>
                            <span className="mt-0.5 block text-xs leading-snug text-slate-500">2% fee + 18% GST (2.36%)</span>
                        </div>
                    </div>

                    {/* Over-collection Reconciliation Adjustment Category */}
                    {Boolean(indicators.patientOverCollection && indicators.patientOverCollection > 0) && (
                        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                                    <AlertCircle className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="font-semibold text-amber-900">
                                        Patient over-collection • Reconciliation adjustment
                                    </p>
                                    <p className="mt-0.5 text-sm text-amber-800">
                                        Total patient collections (₹{cards.grossOnlineAdvances + cards.cashAtClinic + cards.onlineAtClinic}) exceed consultation fees (₹{cards.totalConsultationFees}). Excess recorded at facility:
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 pl-[52px] sm:pl-0 sm:text-right">
                                <p className="text-xl font-bold tracking-tight text-amber-900">
                                    +{formatCurrency(indicators.patientOverCollection)}
                                </p>
                                <p className="text-xs font-medium text-amber-700">Over-collected from patient</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* DETAILED APPOINTMENT PAYMENT RECORDS TABLE */}
                <section className="ui-card overflow-hidden">
                    {/* Table Header & Filters */}
                    <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                                <h3 className="ui-title">Appointment payment records</h3>
                                <p className="ui-subtitle">
                                    Individual appointment breakdown showing advance paid, balance due, clinic collections, and settlement status.
                                </p>
                            </div>
                            <span className="ui-badge self-start border-slate-200 bg-slate-50 text-slate-600 md:shrink-0">
                                Showing {records.length} of {pagination.totalRecords} records
                            </span>
                        </div>

                        {/* Filter Bar */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {/* Search Input */}
                            <label className="block sm:col-span-2 xl:col-span-4">
                                <span className="ui-label">Search</span>
                                <span className="relative block">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Search patient, phone, ID..."
                                        className="ui-input pl-10"
                                    />
                                </span>
                            </label>

                            {/* Doctor Filter */}
                            <label className="block min-w-0">
                                <span className="ui-label">Doctor</span>
                                <select
                                    value={filterDoctorId}
                                    onChange={(e) => {
                                        setFilterDoctorId(e.target.value);
                                        setPage(1);
                                    }}
                                    className="ui-input"
                                >
                                    <option value="all">All Doctors</option>
                                    {doctors.map((doc: any) => (
                                        <option key={doc._id} value={doc._id}>
                                            {doctorLabel(doc)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Payment Method Filter */}
                            <label className="block min-w-0">
                                <span className="ui-label">Payment method</span>
                                <select
                                    value={filterPaymentMethod}
                                    onChange={(e) => {
                                        setFilterPaymentMethod(e.target.value);
                                        setPage(1);
                                    }}
                                    className="ui-input"
                                >
                                    <option value="all">All Payment Methods</option>
                                    <option value="razorpay">Online Advance (Pillora)</option>
                                    <option value="cash">Cash at Clinic</option>
                                    <option value="online">Online / UPI at Clinic</option>
                                </select>
                            </label>

                            {/* Payment Status Filter */}
                            <label className="block min-w-0">
                                <span className="ui-label">Payment status</span>
                                <select
                                    value={filterPaymentStatus}
                                    onChange={(e) => {
                                        setFilterPaymentStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="ui-input"
                                >
                                    <option value="all">All Payment Statuses</option>
                                    <option value="partial">Advance Paid (20%)</option>
                                    <option value="paid">Fully Paid</option>
                                    <option value="unpaid">Payment Pending</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </label>

                            {/* Settlement Status Filter */}
                            <label className="block min-w-0">
                                <span className="ui-label">Settlement status</span>
                                <select
                                    value={filterSettlementStatus}
                                    onChange={(e) => {
                                        setFilterSettlementStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="ui-input"
                                >
                                    <option value="all">All Settlement Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Settled">Settled</option>
                                    <option value="not_applicable">Not Applicable</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {/* Table (scrolls sideways inside the card; the actions column stays pinned on tablets and computers) */}
                    <div className="overflow-x-auto [container-type:inline-size]">
                        <table className="w-full border-separate border-spacing-0 text-left">
                            <thead>
                                <tr className="bg-slate-50/80 [&>th]:border-b [&>th]:border-slate-100">
                                    <th className="ui-th pl-5 pr-3 sm:pl-6">Token / ID</th>
                                    <th className="ui-th px-3">Patient info</th>
                                    <th className="ui-th px-3">Doctor</th>
                                    <th className="ui-th px-3 text-right">Fee</th>
                                    <th className="ui-th px-3 text-right">Advance (20%)</th>
                                    <th className="ui-th px-3 text-right">Gateway</th>
                                    <th className="ui-th px-3 text-right">Net advance</th>
                                    <th className="ui-th px-3 text-right">Balance due</th>
                                    <th className="ui-th px-3 text-right">Clinic paid</th>
                                    <th className="ui-th px-3">Payment status</th>
                                    <th className="ui-th px-3">Settlement</th>
                                    <th className="ui-th px-3">Date</th>
                                    <th className="ui-th pl-3 pr-5 text-right sm:pr-6 md:sticky md:right-0 md:z-10 md:border-l md:bg-slate-50">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-slate-100 [&>tr:last-child>td]:border-b-0">
                                {loadingRecords ? (
                                    <tr>
                                        <td colSpan={13} className="p-0">
                                            <div className="sticky left-0 flex w-[100cqw] flex-col items-center justify-center gap-2 px-6 py-14 text-center text-sm text-slate-500">
                                                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                                                <span>Loading appointment payment records...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} className="p-0">
                                            <div className="sticky left-0 flex w-[100cqw] flex-col items-center justify-center gap-1.5 px-6 py-14 text-center">
                                                <FileText className="h-8 w-8 text-slate-300" />
                                                <p className="text-sm font-semibold text-slate-700">No payment records found</p>
                                                <p className="text-xs text-slate-500">Try adjusting your filters or date range</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    records.map((record) => {
                                        const hasBalanceDue = record.balanceDue > 0;
                                        const clinicCollectionTotal = record.clinicCashCollection + record.clinicOnlineCollection;

                                        return (
                                            <tr key={record.appointmentId} className="group transition-colors hover:bg-slate-50">
                                                <td className="ui-td whitespace-nowrap pl-5 pr-3 sm:pl-6">
                                                    {record.tokenNumber ? (
                                                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800">
                                                            #{record.tokenNumber}
                                                        </span>
                                                    ) : (
                                                        <span className="font-mono text-xs font-semibold text-slate-500">
                                                            {record.appointmentId.slice(-6).toUpperCase()}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="ui-td min-w-[150px] px-3">
                                                    <div className="font-medium text-slate-900">{record.patientName}</div>
                                                    <div className="mt-0.5 whitespace-nowrap text-xs text-slate-500">{record.patientPhone}</div>
                                                </td>

                                                <td className="ui-td min-w-[130px] px-3 font-medium text-slate-700">
                                                    {record.doctorName}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-right font-semibold text-slate-900">
                                                    ₹{record.consultationFee.toLocaleString("en-IN")}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-right">
                                                    {record.advancePaid > 0 ? (
                                                        <span className="font-semibold text-blue-600">₹{record.advancePaid.toFixed(2)}</span>
                                                    ) : (
                                                        <span className="text-slate-400">₹0.00</span>
                                                    )}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-right text-slate-500">
                                                    {record.gatewayCharges > 0 ? `₹${record.gatewayCharges.toFixed(2)}` : "—"}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-right font-medium text-indigo-700">
                                                    {record.netAdvancePayable > 0 ? `₹${record.netAdvancePayable.toFixed(2)}` : "—"}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-right">
                                                    {hasBalanceDue ? (
                                                        <span className="rounded-md bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
                                                            ₹{record.balanceDue.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="font-semibold text-emerald-600">₹0.00</span>
                                                    )}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-right">
                                                    {clinicCollectionTotal > 0 ? (
                                                        <div>
                                                            <span className="font-semibold text-slate-800">₹{clinicCollectionTotal.toFixed(2)}</span>
                                                            <div className="mt-0.5 text-xs text-slate-500">
                                                                {record.clinicCashCollection > 0 && `Cash: ₹${record.clinicCashCollection.toFixed(2)} `}
                                                                {record.clinicOnlineCollection > 0 && `Online: ₹${record.clinicOnlineCollection.toFixed(2)}`}
                                                            </div>
                                                            {Boolean(record.overCollectionAmount && record.overCollectionAmount > 0) && (
                                                                <span className="ui-badge mt-1 border-amber-200 bg-amber-50 text-amber-700">
                                                                    +₹{Number(record.overCollectionAmount || 0).toFixed(2)} Over-collected
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3">
                                                    {getPaymentBadge(record.paymentStatus)}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3">
                                                    {getSettlementBadge(record.settlementStatus)}
                                                </td>

                                                <td className="ui-td whitespace-nowrap px-3 text-slate-500">
                                                    {formatDate(record.appointmentDate)}
                                                </td>

                                                <td className="ui-td whitespace-nowrap pl-3 pr-5 sm:pr-6 md:sticky md:right-0 md:border-l md:bg-white md:group-hover:bg-slate-50">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {hasBalanceDue && (
                                                            <button
                                                                onClick={() => openBalanceModal(record)}
                                                                className="ui-btn-success ui-btn-sm min-h-[40px] md:min-h-[32px]"
                                                                title="Collect remaining balance at clinic"
                                                            >
                                                                <Banknote className="h-3.5 w-3.5" />
                                                                <span>Collect</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => openEditModal(record)}
                                                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 md:h-8 md:w-8"
                                                            title="Edit Payment & Collection"
                                                            aria-label="Edit Payment & Collection"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => setDetailsModalRecord(record)}
                                                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 md:h-8 md:w-8"
                                                            title="View Details"
                                                            aria-label="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
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
                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <label className="flex items-center gap-2">
                            <span>Rows per page:</span>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="ui-input min-h-[40px] w-auto py-1.5 pl-3 pr-2 font-medium"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </label>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="ui-btn-secondary w-10 px-0"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="font-medium text-slate-700">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page >= pagination.totalPages}
                                className="ui-btn-secondary w-10 px-0"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Toast Alert */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        role="status"
                        className={`fixed bottom-4 left-4 right-4 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:bottom-6 sm:left-auto sm:right-6 ${
                            toast.type === "success"
                                ? "bg-emerald-600 text-white"
                                : "bg-rose-600 text-white"
                        }`}
                    >
                        {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal: Collect Balance at Clinic (Scenario C) */}
            <AnimatePresence>
                {balanceModalRecord && (
                    <Modal
                        title="Collect balance payment"
                        description="Record clinic collection for appointment"
                        icon={<Banknote className="h-5 w-5" />}
                        iconTone="emerald"
                        onClose={() => setBalanceModalRecord(null)}
                    >
                        <div className="space-y-5">
                            {/* Summary of Fees */}
                            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="shrink-0 text-slate-500">Patient:</span>
                                    <span className="text-right font-medium text-slate-900">{balanceModalRecord.patientName} ({balanceModalRecord.patientPhone})</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="shrink-0 text-slate-500">Doctor:</span>
                                    <span className="text-right font-medium text-slate-900">{balanceModalRecord.doctorName}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-slate-200 pt-2.5">
                                    <span className="text-slate-500">Total consultation fee:</span>
                                    <span className="font-semibold text-slate-900">₹{balanceModalRecord.consultationFee}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-blue-700">
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" /> Advance paid (Pillora.in):
                                    </span>
                                    <span className="rounded-md bg-blue-100 px-2 py-0.5 font-semibold text-blue-800">
                                        ₹{balanceModalRecord.advancePaid}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 font-semibold text-rose-700">
                                    <span>Remaining balance due:</span>
                                    <span className="text-base font-bold text-rose-600">
                                        ₹{balanceModalRecord.balanceDue}
                                    </span>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCollectBalanceSubmit} className="space-y-4">
                                <div>
                                    <p className="ui-label">Payment method</p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                                                className={`min-h-[44px] rounded-xl border px-3 text-sm font-semibold transition-colors ${
                                                    balanceCollectMethod === m.value
                                                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block">
                                        <span className="ui-label">Amount received (₹)</span>
                                        <input
                                            type="number"
                                            min={1}
                                            max={balanceModalRecord.balanceDue * 2}
                                            step="0.01"
                                            required
                                            value={balanceCollectAmount}
                                            onChange={(e) => setBalanceCollectAmount(Number(e.target.value))}
                                            className="ui-input font-semibold"
                                        />
                                    </label>
                                    <p className="ui-hint">
                                        Default is remaining balance ₹{balanceModalRecord.balanceDue}. Partial collection is permitted.
                                    </p>
                                </div>

                                <label className="block">
                                    <span className="ui-label">Reference / notes (optional)</span>
                                    <input
                                        type="text"
                                        value={balanceCollectNotes}
                                        onChange={(e) => setBalanceCollectNotes(e.target.value)}
                                        placeholder="e.g. UPI Ref #12345678, Cash counter 2"
                                        className="ui-input"
                                    />
                                </label>

                                <ModalActions>
                                    <button
                                        type="button"
                                        onClick={() => setBalanceModalRecord(null)}
                                        className="ui-btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={balanceSubmitting}
                                        className="ui-btn-success"
                                    >
                                        {balanceSubmitting ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                <span>Confirm collection</span>
                                            </>
                                        )}
                                    </button>
                                </ModalActions>
                            </form>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Modal: View Details */}
            <AnimatePresence>
                {detailsModalRecord && (
                    <Modal
                        title="Appointment financial details"
                        description={<>ID: {detailsModalRecord.appointmentId} {detailsModalRecord.tokenNumber ? `• Token #${detailsModalRecord.tokenNumber}` : ""}</>}
                        icon={<FileText className="h-5 w-5" />}
                        maxWidth="sm:max-w-2xl"
                        onClose={() => setDetailsModalRecord(null)}
                    >
                        <div className="space-y-5">
                            {/* Top Cards in Modal */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs font-medium text-slate-500">Consultation fee</p>
                                    <p className="mt-0.5 text-base font-bold text-slate-900">₹{detailsModalRecord.consultationFee}</p>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                                    <p className="text-xs font-medium text-blue-600">Advance paid</p>
                                    <p className="mt-0.5 text-base font-bold text-blue-700">₹{detailsModalRecord.advancePaid}</p>
                                </div>
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                                    <p className="text-xs font-medium text-indigo-600">Net advance</p>
                                    <p className="mt-0.5 text-base font-bold text-indigo-700">₹{detailsModalRecord.netAdvancePayable}</p>
                                    <p className="mt-0.5 text-[11px] text-indigo-600">Fee deduction: ₹{detailsModalRecord.gatewayCharges}</p>
                                </div>
                                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                                    <p className="text-xs font-medium text-rose-600">Balance due</p>
                                    <p className="mt-0.5 text-base font-bold text-rose-700">₹{detailsModalRecord.balanceDue}</p>
                                </div>
                            </div>

                            {/* Over-collection Alert Banner */}
                            {Boolean(detailsModalRecord.overCollectionAmount && detailsModalRecord.overCollectionAmount > 0) && (
                                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                                        <AlertCircle className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-amber-900">
                                            Patient over-collection: +₹{Number(detailsModalRecord.overCollectionAmount || 0).toFixed(2)}
                                        </p>
                                        <p className="mt-0.5 text-sm leading-relaxed text-amber-800">
                                            Total amount collected from patient (₹{(detailsModalRecord.advancePaid + detailsModalRecord.balancePaid).toFixed(2)}) exceeds consultation fee (₹{detailsModalRecord.consultationFee.toFixed(2)}). An excess of ₹{Number(detailsModalRecord.overCollectionAmount || 0).toFixed(2)} was recorded at the clinic.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Patient & Doctor Details */}
                            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500">Patient</p>
                                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{detailsModalRecord.patientName}</p>
                                    <p className="text-sm text-slate-600">{detailsModalRecord.patientPhone}</p>
                                    {detailsModalRecord.patientEmail && <p className="break-all text-xs text-slate-500">{detailsModalRecord.patientEmail}</p>}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500">Doctor</p>
                                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{detailsModalRecord.doctorName}</p>
                                    <p className="text-sm text-slate-600">Date: {formatDate(detailsModalRecord.appointmentDate)}</p>
                                </div>
                            </div>

                            {/* Transaction Ledger */}
                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                    Transaction ledger ({detailsModalRecord.transactions?.length || 0} records)
                                </h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                                <th className="ui-th px-3 py-2.5">Txn ID</th>
                                                <th className="ui-th px-3 py-2.5">Type</th>
                                                <th className="ui-th px-3 py-2.5">Method</th>
                                                <th className="ui-th px-3 py-2.5 text-right">Amount</th>
                                                <th className="ui-th px-3 py-2.5">Status</th>
                                                <th className="ui-th px-3 py-2.5">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {!detailsModalRecord.transactions || detailsModalRecord.transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                                                        No transaction records attached to this appointment.
                                                    </td>
                                                </tr>
                                            ) : (
                                                detailsModalRecord.transactions.map((tx) => (
                                                    <tr key={tx.transactionId} className="hover:bg-slate-50/60">
                                                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-slate-800">{tx.transactionId}</td>
                                                        <td className="px-3 py-2.5 capitalize text-slate-700">{tx.type}</td>
                                                        <td className="px-3 py-2.5 capitalize text-slate-700">{tx.method}</td>
                                                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">₹{tx.amount}</td>
                                                        <td className="px-3 py-2.5">
                                                            <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                                                {tx.status}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">{formatDateTime(tx.date)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Audit Trail / Modification History */}
                            <div className="border-t border-slate-100 pt-5">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                                        <History className="h-4 w-4 text-blue-600" />
                                        <span>Payment modification history ({auditHistory.length})</span>
                                    </h4>
                                    <span className="ui-badge border-slate-200 bg-slate-50 text-slate-500">Immutable audit trail</span>
                                </div>

                                {loadingAuditHistory ? (
                                    <div className="flex items-center justify-center gap-2 p-4 text-center text-sm text-slate-500">
                                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                                        <span>Loading audit history...</span>
                                    </div>
                                ) : auditHistory.length === 0 ? (
                                    <div className="ui-empty py-5">
                                        No previous modifications recorded. All original payment records are intact.
                                    </div>
                                ) : (
                                    <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
                                        {auditHistory.map((log: any, idx: number) => (
                                            <div key={log._id || idx} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                                                    <span className="font-semibold text-slate-800">
                                                        {log.modifierName || "Staff"} <span className="font-normal text-slate-500">({log.modifierRole || "hospital"})</span>
                                                    </span>
                                                    <span className="text-slate-500">{formatDateTime(log.createdAt)}</span>
                                                </div>
                                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-slate-700">
                                                    <span className="font-semibold text-amber-900">Reason: </span>
                                                    {log.reason}
                                                </div>
                                                {log.changes && log.changes.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        <span className="text-xs font-medium text-slate-500">Changes:</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {log.changes.map((c: any, cIdx: number) => (
                                                                <div key={cIdx} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700">
                                                                    <span className="font-semibold text-slate-900">{c.label}: </span>
                                                                    <span className="text-rose-600 line-through">{String(c.oldValue)}</span>
                                                                    <span className="mx-1 text-slate-400">→</span>
                                                                    <span className="font-semibold text-emerald-700">{String(c.newValue)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <ModalActions>
                                <button
                                    onClick={() => setDetailsModalRecord(null)}
                                    className="ui-btn-dark"
                                >
                                    Close
                                </button>
                            </ModalActions>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Modal: Edit Payment & Collection */}
            <AnimatePresence>
                {editModalRecord && !showConfirmModal && (
                    <Modal
                        title="Edit payment & collection"
                        description={<>Appointment ID: {editModalRecord.appointmentId} {editModalRecord.tokenNumber ? `• Token #${editModalRecord.tokenNumber}` : ""}</>}
                        icon={<Pencil className="h-5 w-5" />}
                        maxWidth="sm:max-w-2xl"
                        onClose={() => setEditModalRecord(null)}
                    >
                        {/* Form */}
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setShowConfirmModal(true);
                        }} className="space-y-6">

                            {/* Section A: Appointment Information */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span>Appointment information</span>
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <label className="block min-w-0">
                                        <span className="ui-label">Patient name</span>
                                        <input
                                            type="text"
                                            value={editFormData.patientName}
                                            onChange={(e) => setEditFormData({ ...editFormData, patientName: e.target.value })}
                                            className="ui-input"
                                            required
                                        />
                                    </label>
                                    <label className="block min-w-0">
                                        <span className="ui-label">Doctor</span>
                                        <select
                                            value={editFormData.doctorId}
                                            onChange={(e) => setEditFormData({ ...editFormData, doctorId: e.target.value })}
                                            className="ui-input"
                                        >
                                            <option value="">{editModalRecord.doctorName || "Select Doctor"}</option>
                                            {doctors.map((doc: any) => (
                                                <option key={doc._id} value={doc._id}>
                                                    {doctorLabel(doc)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="block min-w-0">
                                        <span className="ui-label">Consultation fee (₹)</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step="1"
                                            value={editFormData.consultationFee}
                                            onChange={(e) => setEditFormData({ ...editFormData, consultationFee: Number(e.target.value) })}
                                            className="ui-input font-semibold"
                                            required
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Section B: Online Advance (via Pillora / Razorpay) - Locked / Protected */}
                            {editModalRecord.advancePaid > 0 && (
                                <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4 shrink-0 text-blue-700" />
                                            <span className="text-sm font-semibold text-blue-900">
                                                Pillora online advance (Razorpay)
                                            </span>
                                        </div>
                                        <span className="ui-badge border-blue-200 bg-blue-100 text-blue-800">
                                            <ShieldCheck className="h-3 w-3" />
                                            Protected & settled
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div className="min-w-0">
                                            <span className="block text-xs text-blue-700">Gross advance:</span>
                                            <span className="font-semibold text-blue-950">₹{editModalRecord.advancePaid.toFixed(2)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-xs text-blue-700">2.36% gateway:</span>
                                            <span className="font-semibold text-rose-600">-₹{editModalRecord.gatewayCharges.toFixed(2)}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <span className="block text-xs text-blue-700">Net settlement:</span>
                                            <span className="font-bold text-emerald-700">₹{editModalRecord.netAdvancePayable.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs leading-relaxed text-blue-800/80">
                                        * Razorpay original transaction IDs, gateway deductions, and settled payouts cannot be altered by hospital users.
                                    </p>
                                </div>
                            )}

                            {/* Section C: Clinic Collection Details (Editable) */}
                            <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                    <Banknote className="h-4 w-4 text-emerald-600" />
                                    <span>Clinic collection details</span>
                                </h4>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="min-w-0">
                                        <label className="block">
                                            <span className="ui-label">Clinic collection amount (₹) *</span>
                                            <input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={editFormData.paymentAmount}
                                                onChange={(e) => setEditFormData({ ...editFormData, paymentAmount: Number(e.target.value) })}
                                                className="ui-input font-semibold"
                                                required
                                            />
                                        </label>
                                        <p className="ui-hint">
                                            Enter verified physical cash or clinic payment received.
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="ui-label">Payment mode *</p>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[
                                                { id: "cash", label: "Cash" },
                                                { id: "upi", label: "UPI" },
                                                { id: "card", label: "Card" },
                                                { id: "qr", label: "QR" }
                                            ].map((m) => (
                                                <button
                                                    type="button"
                                                    key={m.id}
                                                    onClick={() => setEditFormData({ ...editFormData, paymentMethod: m.id as any })}
                                                    className={`min-h-[44px] rounded-xl border text-center text-sm font-semibold transition-colors ${
                                                        editFormData.paymentMethod === m.id
                                                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <label className="block min-w-0">
                                        <span className="ui-label">Payment date & time</span>
                                        <input
                                            type="datetime-local"
                                            value={editFormData.paymentDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, paymentDate: e.target.value })}
                                            className="ui-input"
                                        />
                                    </label>

                                    <label className="block min-w-0">
                                        <span className="ui-label">Transaction reference / receipt ID</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. REC-10492 or UPI Ref"
                                            value={editFormData.transactionReference}
                                            onChange={(e) => setEditFormData({ ...editFormData, transactionReference: e.target.value })}
                                            className="ui-input"
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="ui-label">Collection notes</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Verified by front desk receptionist"
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                        className="ui-input"
                                    />
                                </label>
                            </div>

                            {/* Live Financial Calculation Preview */}
                            {(() => {
                                const fee = Number(editFormData.consultationFee || 0);
                                const advance = Number(editModalRecord.advancePaid || 0);
                                const clinic = Number(editFormData.paymentAmount || 0);
                                const totalCollected = advance + clinic;
                                const balanceDue = Math.max(0, fee - totalCollected);
                                const overCollected = Math.max(0, totalCollected - fee);

                                return (
                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-medium text-slate-500">
                                            Live financial recalculation preview
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                            <div className="min-w-0">
                                                <span className="block text-xs text-slate-500">Consultation fee</span>
                                                <span className="font-semibold text-slate-800">₹{fee.toFixed(2)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-xs text-slate-500">Total patient collection</span>
                                                <span className="font-semibold text-slate-900">₹{totalCollected.toFixed(2)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-xs text-slate-500">Remaining due</span>
                                                <span className={`font-semibold ${balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                    ₹{balanceDue.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <span className="block text-xs text-slate-500">Over-collection</span>
                                                <span className={`font-semibold ${overCollected > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {overCollected > 0 ? `+₹${overCollected.toFixed(2)}` : "₹0.00"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Over-Collection Resolution Notice */}
                                        {Boolean(editModalRecord.overCollectionAmount && editModalRecord.overCollectionAmount > 0 && overCollected === 0) && (
                                            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                                <span>
                                                    Reconciled! This correction resolves the ₹{Number(editModalRecord.overCollectionAmount).toFixed(2)} over-collection. Total patient collection will perfectly match consultation fee.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Footer Buttons */}
                            <ModalActions>
                                <button
                                    type="button"
                                    onClick={() => setEditModalRecord(null)}
                                    className="ui-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="ui-btn-primary"
                                >
                                    <span>Review & confirm changes</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </ModalActions>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Modal: Edit Confirmation with Mandatory Reason */}
            <AnimatePresence>
                {editModalRecord && showConfirmModal && (
                    <Modal
                        title="Confirm financial modification"
                        description={<>Appointment #{editModalRecord.appointmentId.slice(-8)} • Patient: {editModalRecord.patientName}</>}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        iconTone="amber"
                    >
                        <div className="space-y-5">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
                                <p className="font-medium">
                                    You are modifying financial records. All modifications are permanently recorded in the immutable audit log with user and device metadata.
                                </p>
                            </div>

                            {/* Changed Fields Diff */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-500">
                                    Summary of modifications
                                </p>
                                {(() => {
                                    const changes = getFieldChanges();
                                    if (changes.length === 0) {
                                        return (
                                            <div className="rounded-xl bg-slate-50 p-3 text-center text-sm text-slate-500">
                                                No field values were changed.
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 text-sm">
                                            <div className="grid grid-cols-3 gap-2 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                                                <span>Field</span>
                                                <span>Previous</span>
                                                <span>New</span>
                                            </div>
                                            {changes.map((c, i) => (
                                                <div key={i} className="grid grid-cols-3 gap-2 px-3 py-2">
                                                    <span className="font-medium text-slate-800">{c.label}</span>
                                                    <span className="break-words text-rose-600 line-through">{String(c.oldValue)}</span>
                                                    <span className="break-words font-semibold text-emerald-700">{String(c.newValue)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Mandatory Reason Field */}
                            <div>
                                <label className="block">
                                    <span className="ui-label">
                                        Reason for modification <span className="text-rose-600">*</span>
                                    </span>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Corrected clinic cash collection typo from ₹100 to ₹80 after physical till reconciliation..."
                                        value={confirmReason}
                                        onChange={(e) => setConfirmReason(e.target.value)}
                                        className="ui-input h-24 resize-none"
                                        required
                                    />
                                </label>
                                <p className="ui-hint">
                                    Mandatory: Provide audit justification for this financial alteration.
                                </p>
                            </div>

                            {/* Confirmation Buttons */}
                            <ModalActions>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={editSubmitting}
                                    className="ui-btn-secondary"
                                >
                                    Back to edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveEditSubmit}
                                    disabled={editSubmitting || !confirmReason.trim() || confirmReason.trim().length < 3}
                                    className="ui-btn-success"
                                >
                                    {editSubmitting ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Saving changes...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            <span>Confirm & save changes</span>
                                        </>
                                    )}
                                </button>
                            </ModalActions>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

const MODAL_ICON_TONES = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
} as const;

/** Dialog shell matching the dashboard dialogs: bottom sheet on phones, centred card on larger screens. */
function Modal({
    title,
    description,
    icon,
    iconTone = "blue",
    maxWidth = "sm:max-w-lg",
    onClose,
    children,
}: {
    title: string;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    iconTone?: keyof typeof MODAL_ICON_TONES;
    maxWidth?: string;
    onClose?: () => void;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ui-overlay"
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`ui-dialog ${maxWidth}`}
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {icon && (
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${MODAL_ICON_TONES[iconTone]}`}>{icon}</span>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-lg font-semibold leading-tight text-slate-900">{title}</h3>
                            {description && <p className="mt-0.5 break-words text-sm text-slate-500">{description}</p>}
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="-mr-2 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            </motion.div>
        </motion.div>
    );
}

/**
 * Keeps a dialog's buttons visible at the bottom while its content scrolls.
 * `-bottom-5` offsets the dialog body's bottom padding, which sticky positioning respects.
 */
function ModalActions({ children }: { children: React.ReactNode }) {
    return (
        <div className="sticky -bottom-5 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
            {children}
        </div>
    );
}
