"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, User, Phone, Mail, Calendar, CreditCard,
    Upload, FileText, Download, Activity, FileCheck, X,
    Loader2, ChevronDown, Hash, IndianRupee
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NameSuggestion {
    id: string;
    name: string;
    email: string;
    phone: string;
}

interface BookingIdSuggestion {
    id: string;
    bookingId: string;
    patientName: string;
    date: string;
}

// ─── Highlight Helper ─────────────────────────────────────────────────────────
// Wraps matching substring in a styled <mark> element

function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-transparent text-[#e63946] font-black not-italic">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientSearchAdmin() {
    const [searchType, setSearchType] = useState<"bookingId" | "name">("bookingId");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState("");

    // Autocomplete state
    const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
    const [bookingIdSuggestions, setBookingIdSuggestions] = useState<BookingIdSuggestion[]>([]);
    const [acLoading, setAcLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [highlightedIdx, setHighlightedIdx] = useState(-1);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // View Modal state
    const [fetchingPrescription, setFetchingPrescription] = useState(false);

    // Payment Modal states
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [paymentMode, setPaymentMode] = useState<"online" | "offline">("online");
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    // ─── Close dropdown on outside click ────────────────────────────────────

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─── Debounced Autocomplete ──────────────────────────────────────────────

    const fetchSuggestions = useCallback(async (value: string) => {
        if (searchType === "name" && value.length >= 2) {
            setAcLoading(true);
            try {
                const res = await api.get(`/hospital/dashboard/patients/autocomplete?q=${encodeURIComponent(value)}`);
                setNameSuggestions(res.data);
                setDropdownOpen(true);
            } catch {
                setNameSuggestions([]);
            } finally {
                setAcLoading(false);
            }
        } else if (searchType === "bookingId" && value.length >= 4) {
            setAcLoading(true);
            try {
                const res = await api.get(`/hospital/dashboard/bookings/autocomplete?q=${encodeURIComponent(value)}`);
                setBookingIdSuggestions(res.data);
                setDropdownOpen(true);
            } catch {
                setBookingIdSuggestions([]);
            } finally {
                setAcLoading(false);
            }
        } else {
            setNameSuggestions([]);
            setBookingIdSuggestions([]);
            setDropdownOpen(false);
        }
    }, [searchType]);

    const handleInputChange = (value: string) => {
        setSearchQuery(value);
        setHighlightedIdx(-1);

        // Clear old suggestions immediately when input is too short
        const minLength = searchType === "name" ? 2 : 4;
        if (value.length < minLength) {
            setNameSuggestions([]);
            setBookingIdSuggestions([]);
            setDropdownOpen(false);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);
    };

    // When search type switches, clear everything
    const handleSearchTypeChange = (type: "bookingId" | "name") => {
        setSearchType(type);
        setSearchQuery("");
        setNameSuggestions([]);
        setBookingIdSuggestions([]);
        setDropdownOpen(false);
        setHighlightedIdx(-1);
        setResults([]);
        setError("");
    };

    // ─── Keyboard navigation ─────────────────────────────────────────────────

    const suggestions = searchType === "name" ? nameSuggestions : bookingIdSuggestions;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!dropdownOpen || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIdx((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && highlightedIdx >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[highlightedIdx]);
        } else if (e.key === "Escape") {
            setDropdownOpen(false);
            setHighlightedIdx(-1);
        }
    };

    // ─── Selecting a suggestion ───────────────────────────────────────────────

    const handleSelectSuggestion = (suggestion: NameSuggestion | BookingIdSuggestion) => {
        const value = searchType === "name"
            ? (suggestion as NameSuggestion).name
            : (suggestion as BookingIdSuggestion).bookingId;

        setSearchQuery(value);
        setDropdownOpen(false);
        setHighlightedIdx(-1);
        // Auto-trigger the full search
        triggerSearch(value);
    };

    // ─── Full Search ─────────────────────────────────────────────────────────

    const triggerSearch = async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setError("");
        setResults([]);
        try {
            const queryParam = searchType === "bookingId" ? `bookingId=${query}` : `name=${query}`;
            const res = await api.get(`/hospital/dashboard/patients/search?${queryParam}`);
            setResults(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to find patient");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setDropdownOpen(false);
        triggerSearch(searchQuery);
    };

    // ─── Other handlers ───────────────────────────────────────────────────────

    const handleOpenUploadModal = (appointmentId: string) => {
        setSelectedAppointmentId(appointmentId);
        setPrescriptionFile(null);
        setUploadModalOpen(true);
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prescriptionFile || !selectedAppointmentId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("prescription", prescriptionFile);

        try {
            await api.post(`/hospital/dashboard/appointments/${selectedAppointmentId}/prescription`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("Prescription uploaded successfully!");
            setUploadModalOpen(false);

            const queryParam = searchType === "bookingId" ? `bookingId=${searchQuery}` : `name=${searchQuery}`;
            const res = await api.get(`/hospital/dashboard/patients/search?${queryParam}`);
            setResults(res.data);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to upload prescription");
        } finally {
            setUploading(false);
        }
    };

    const handleViewPrescription = async (appointmentId: string) => {
        setFetchingPrescription(true);
        try {
            const res = await api.get(`/hospital/dashboard/appointments/${appointmentId}/prescription`);
            if (res.data.prescriptionUrl) {
                window.open(res.data.prescriptionUrl, "_blank");
            } else {
                alert("No prescription found.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to fetch prescription");
        } finally {
            setFetchingPrescription(false);
        }
    };

    const handleGenerateInvoice = async (appointmentId: string) => {
        try {
            const amountStr = prompt("Enter amount for the invoice (e.g., 500):", "500");
            if (!amountStr) return;
            const amount = parseInt(amountStr, 10);
            if (isNaN(amount)) { alert("Invalid amount"); return; }
            await api.post(`/hospital/dashboard/appointments/${appointmentId}/invoice`, { amount });
            alert("Invoice generated and sent successfully!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to generate invoice");
        }
    };

    const handleOpenPaymentModal = (appointmentId: string) => {
        const appointment = results.flatMap(r => r.bookings).find(b => b._id === appointmentId);
        if (appointment?.paymentStatus === 'paid') {
            if (!confirm("This booking is already marked as paid. Do you want to update the payment?")) return;
        }
        setSelectedAppointmentId(appointmentId);
        setPaymentAmount("");
        setPaymentMode("online");
        setPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAppointmentId || paymentAmount === "" || paymentAmount < 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setPaymentSubmitting(true);
        try {
            await api.post(`/hospital/dashboard/appointments/${selectedAppointmentId}/payment`, {
                amount: paymentAmount,
                mode: paymentMode
            });
            alert("Payment recorded successfully!");
            setPaymentModalOpen(false);

            // refresh search results
            const queryParam = searchType === "bookingId" ? `bookingId=${searchQuery}` : `name=${searchQuery}`;
            const res = await api.get(`/hospital/dashboard/patients/search?${queryParam}`);
            setResults(res.data);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to record payment");
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });

    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Search className="w-6 h-6 text-primary" /> Patient Search & Records
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold mt-1">
                        Search by Booking ID or Name — start typing to see live suggestions.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    {/* Search Type Selector */}
                    <select
                        value={searchType}
                        onChange={(e) => handleSearchTypeChange(e.target.value as "bookingId" | "name")}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 outline-none transition-all w-full md:w-48"
                    >
                        <option value="bookingId">Booking ID</option>
                        <option value="name">Patient Name</option>
                    </select>

                    {/* Search Input with Autocomplete Dropdown */}
                    <div ref={inputWrapperRef} className="flex-1 relative">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                id="patient-search-input"
                                placeholder={searchType === "bookingId" ? "Enter Booking ID (min 4 chars)..." : "Enter Patient Name (min 2 chars)..."}
                                value={searchQuery}
                                onChange={(e) => handleInputChange(e.target.value)}
                                onFocus={() => {
                                    const minLen = searchType === "name" ? 2 : 4;
                                    if (searchQuery.length >= minLen && suggestions.length > 0) setDropdownOpen(true);
                                }}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                                className="w-full p-4 pr-12 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 outline-none transition-all"
                            />
                            {/* Loading spinner / search icon inside input */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                {acLoading ? (
                                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4 text-slate-300" />
                                )}
                            </div>
                        </div>

                        {/* ── Autocomplete Dropdown ── */}
                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden"
                                >
                                    {suggestions.length === 0 ? (
                                        <div className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-400">
                                            <Search className="w-4 h-4 shrink-0" />
                                            No patients found
                                        </div>
                                    ) : (
                                        <>
                                            {/* ── Name Suggestions ── */}
                                            {searchType === "name" &&
                                                (nameSuggestions as NameSuggestion[]).map((s, idx) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                                                        onMouseEnter={() => setHighlightedIdx(idx)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                            highlightedIdx === idx ? "bg-slate-50" : "hover:bg-slate-50/60"
                                                        } ${idx !== 0 ? "border-t border-slate-50" : ""}`}
                                                    >
                                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                            highlightedIdx === idx ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                                                        }`}>
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                <HighlightMatch text={s.name} query={searchQuery} />
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 font-semibold truncate">
                                                                {s.email}{s.phone ? ` · ${s.phone}` : ""}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            }

                                            {/* ── Booking ID Suggestions ── */}
                                            {searchType === "bookingId" &&
                                                (bookingIdSuggestions as BookingIdSuggestion[]).map((s, idx) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                                                        onMouseEnter={() => setHighlightedIdx(idx)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                            highlightedIdx === idx ? "bg-slate-50" : "hover:bg-slate-50/60"
                                                        } ${idx !== 0 ? "border-t border-slate-50" : ""}`}
                                                    >
                                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                            highlightedIdx === idx ? "bg-indigo-50 text-indigo-500" : "bg-slate-100 text-slate-500"
                                                        }`}>
                                                            <Hash className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-bold text-slate-900 font-mono truncate">
                                                                <HighlightMatch text={s.bookingId.slice(-10).toUpperCase()} query={searchQuery.toUpperCase()} />
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 font-semibold truncate">
                                                                {s.patientName}{s.date ? ` · ${s.date}` : ""}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            }

                                            {/* See all results footer hint */}
                                            {suggestions.length >= 8 && (
                                                <div className="border-t border-slate-100 px-4 py-2.5 flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                                    <ChevronDown className="w-3 h-3" />
                                                    More results — press Search to see all
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Search Button */}
                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="w-full md:w-auto px-8 py-4 bg-primary text-white font-black rounded-2xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                        ) : (
                            "Search"
                        )}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-2">
                        <X className="w-4 h-4" /> {error}
                    </div>
                )}
            </div>

            {/* ── Results ── */}
            {results.map((result, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-8">
                    {/* Patient Info Card */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0 border border-blue-100 shadow-inner">
                            <User className="w-10 h-10" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Name</p>
                                <p className="text-lg font-bold text-slate-900">{result.patientInfo.name}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <Phone className="w-3 h-3" /> {result.patientInfo.phone || "N/A"}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <Mail className="w-3 h-3" /> {result.patientInfo.email || "N/A"}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Visits</p>
                                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" /> {result.patientInfo.totalVisits}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">First / Last Visit</p>
                                <p className="text-sm font-bold text-slate-900">{formatDate(result.patientInfo.firstVisit)}</p>
                                <p className="text-xs font-semibold text-slate-500">to {formatDate(result.patientInfo.lastVisit)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Spent</p>
                                <p className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-amber-500" /> ₹{result.patientInfo.totalSpent}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Booking History Table */}
                    <div>
                        <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" /> Booking History
                        </h3>
                        <div className="overflow-x-auto">
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Booking ID</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Prescription</th>
                                            <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.bookings.map((booking: any) => (
                                            <tr key={booking._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4">
                                                    <span className="text-xs font-bold text-slate-900">{booking._id.slice(-6).toUpperCase()}</span>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-xs font-bold text-slate-900">{formatDate(booking.slotTime || booking.bookingDate)}</p>
                                                    <p className="text-[10px] font-semibold text-slate-500">{formatTime(booking.slotTime || booking.bookingDate)}</p>
                                                </td>
                                                <td className="py-4 text-xs font-bold text-slate-700">
                                                    {booking.doctor?.name ? `Dr. ${booking.doctor.name}` : "N/A"}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                        booking.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                                                        booking.status === "cancelled" ? "bg-rose-50 text-rose-600" :
                                                        "bg-amber-50 text-amber-600"
                                                    }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                        booking.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600" :
                                                        "bg-rose-50 text-rose-600"
                                                    }`}>
                                                        {booking.paymentStatus || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    {booking.prescriptionUploadedAt ? (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                            <FileCheck className="w-3 h-3" /> Uploaded
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-400">Pending</span>
                                                    )}
                                                </td>
                                                <td className="py-4 flex items-center justify-end gap-2">
                                                    {!booking.prescriptionUploadedAt ? (
                                                        <button
                                                            onClick={() => handleOpenUploadModal(booking._id)}
                                                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                                                            title="Upload Prescription"
                                                        >
                                                            <Upload className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleViewPrescription(booking._id)}
                                                            disabled={fetchingPrescription}
                                                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-50"
                                                            title="View Prescription"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleGenerateInvoice(booking._id)}
                                                        className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors"
                                                        title="Generate Invoice"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenPaymentModal(booking._id)}
                                                        className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors"
                                                        title="Record Payment"
                                                    >
                                                        <IndianRupee className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="block md:hidden divide-y divide-slate-100">
                                {result.bookings.map((booking: any) => (
                                    <div key={booking._id} className="py-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-[9px] rounded-lg font-black tracking-wider">
                                                    {booking._id.slice(-6).toUpperCase()}
                                                </span>
                                                <div className="mt-2">
                                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date & Time</span>
                                                    <span className="font-extrabold text-slate-700">{formatDate(booking.slotTime || booking.bookingDate)}</span>
                                                    <span className="block text-[9px] text-slate-500 font-black mt-0.5">{formatTime(booking.slotTime || booking.bookingDate)}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                booking.status === "completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                booking.status === "cancelled" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                "bg-amber-50 text-amber-600 border border-amber-100"
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="pt-3 border-t border-slate-50 flex justify-between text-xs font-bold text-slate-600">
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Doctor</span>
                                                <span className="font-extrabold text-slate-700">{booking.doctor?.name ? `Dr. ${booking.doctor.name}` : "N/A"}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Prescription</span>
                                                {booking.prescriptionUploadedAt ? (
                                                    <span className="flex items-center justify-end gap-1 font-bold text-emerald-600">
                                                        <FileCheck className="w-3 h-3" /> Uploaded
                                                    </span>
                                                ) : (
                                                    <span className="font-bold text-slate-400">Pending</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-xs font-bold text-slate-600">
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payment</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest inline-block ${
                                                    booking.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-600" :
                                                    "bg-rose-50 text-rose-600"
                                                }`}>
                                                    {booking.paymentStatus || 'pending'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pt-3 border-t border-slate-50 space-y-2">
                                            <div className="flex flex-col gap-2 w-full">
                                                {!booking.prescriptionUploadedAt ? (
                                                    <button
                                                        onClick={() => handleOpenUploadModal(booking._id)}
                                                        className="w-full min-h-[44px] bg-blue-50 text-blue-600 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 border border-blue-100 active:scale-95 transition-all shadow-sm"
                                                    >
                                                        <Upload className="w-3.5 h-3.5" /> Upload Prescription
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleViewPrescription(booking._id)}
                                                        disabled={fetchingPrescription}
                                                        className="w-full min-h-[44px] bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 border border-indigo-100 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" /> View Prescription
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleGenerateInvoice(booking._id)}
                                                    className="w-full min-h-[44px] bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 border border-emerald-100 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> Generate Invoice
                                                </button>
                                                <button
                                                    onClick={() => handleOpenPaymentModal(booking._id)}
                                                    className="w-full min-h-[44px] bg-amber-50 text-amber-600 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-2 border border-amber-100 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <IndianRupee className="w-3.5 h-3.5" /> Record Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Prescription Upload Modal */}
            <AnimatePresence>
                {uploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setUploadModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-none sm:rounded-[2.5rem] p-5 sm:p-8 max-w-md w-full relative z-10 shadow-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col"
                        >
                            <div className="shrink-0 flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-slate-900">Upload Prescription</h3>
                                <button
                                    onClick={() => setUploadModalOpen(false)}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                                <div>
                                    <p className="text-slate-500 text-sm font-medium mb-8">
                                        Please upload the prescription PDF for this booking. The patient will be notified via email.
                                    </p>
                                    <form id="prescription-upload-form" onSubmit={handleUploadSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                                Prescription Document (PDF)
                                            </label>
                                            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:bg-slate-50 hover:border-blue-300 transition-all text-center">
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                                                    required
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center justify-center pointer-events-none">
                                                    <Upload className="w-8 h-8 text-blue-500 mb-3" />
                                                    {prescriptionFile ? (
                                                        <p className="font-bold text-slate-900 break-all">{prescriptionFile.name}</p>
                                                    ) : (
                                                        <>
                                                            <p className="font-bold text-slate-700 hidden sm:block">Click or drag file to upload</p>
                                                            <p className="font-bold text-slate-700 block sm:hidden">Tap to select file</p>
                                                            <p className="text-xs text-slate-400 font-semibold mt-1">PDF format up to 5MB</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="mt-8">
                                    <button
                                        type="submit"
                                        form="prescription-upload-form"
                                        disabled={uploading || !prescriptionFile}
                                        className="w-full py-4 bg-primary text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                                        ) : (
                                            <>Upload & Notify Patient</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setPaymentModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-none sm:rounded-[2.5rem] p-6 sm:p-10 max-w-md w-full relative z-10 shadow-2xl h-[100dvh] sm:h-auto flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <IndianRupee className="w-6 h-6 text-emerald-500" /> Record Payment
                                </h3>
                                <button
                                    onClick={() => setPaymentModalOpen(false)}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="flex-1 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Payment Mode</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode("online")}
                                                className={`p-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${
                                                    paymentMode === "online" 
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                                                    : "border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                <CreditCard className="w-6 h-6" /> Online
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode("offline")}
                                                className={`p-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${
                                                    paymentMode === "offline" 
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                                                    : "border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                <IndianRupee className="w-6 h-6" /> Offline (Cash)
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Amount (₹)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-slate-400 font-bold text-lg">₹</span>
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : "")}
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <button
                                        type="submit"
                                        disabled={paymentSubmitting || paymentAmount === ""}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        {paymentSubmitting ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            "Save Payment"
                                        )}
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
