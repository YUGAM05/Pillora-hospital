"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, User, Phone, Mail, Calendar, CreditCard,
    FileText, Download, Activity, X,
    Loader2, ChevronDown, Hash, IndianRupee, Bell, AlertCircle
} from "lucide-react";
import FollowUpRemindersAdmin from "./FollowUpRemindersAdmin";
import { doctorLabel } from "@/lib/doctorName";

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
            <mark className="bg-transparent font-semibold not-italic text-blue-600">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/** canPay / canFollowUp: hide actions the staff role can't use (the server enforces them too). */
export default function PatientSearchAdmin({ canPay = true, canFollowUp = true }: { canPay?: boolean; canFollowUp?: boolean } = {}) {
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
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

    // Payment Modal states
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [paymentMode, setPaymentMode] = useState<"online" | "offline">("online");
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    // Follow-up reminder state
    const [followUpBooking, setFollowUpBooking] = useState<any>(null);

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
            const queryParam = searchType === "bookingId" ? `bookingId=${encodeURIComponent(query)}` : `name=${encodeURIComponent(query)}`;
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
            const queryParam = searchType === "bookingId" ? `bookingId=${encodeURIComponent(searchQuery)}` : `name=${encodeURIComponent(searchQuery)}`;
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
        <div>
            <div className="space-y-6">
                <section className="ui-card p-5 sm:p-6">
                    <div className="mb-5 flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                            <Search className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="ui-title">Patient search &amp; records</h2>
                            <p className="ui-subtitle">
                                Search by Booking ID or Name — start typing to see live suggestions.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
                        {/* Search Type Selector */}
                        <select
                            value={searchType}
                            onChange={(e) => handleSearchTypeChange(e.target.value as "bookingId" | "name")}
                            aria-label="Search by"
                            className="ui-input min-h-[48px] md:w-48 md:shrink-0"
                        >
                            <option value="bookingId">Booking ID</option>
                            <option value="name">Patient name</option>
                        </select>

                        {/* Search Input with Autocomplete Dropdown */}
                        <div ref={inputWrapperRef} className="relative min-w-0 flex-1">
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
                                    className="ui-input min-h-[48px] pr-11"
                                />
                                {/* Loading spinner / search icon inside input */}
                                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                                    {acLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    ) : (
                                        <Search className="h-4 w-4 text-slate-400" />
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
                                        className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                                    >
                                        {suggestions.length === 0 ? (
                                            <div className="flex items-center gap-3 px-4 py-3.5 text-sm text-slate-500">
                                                <Search className="h-4 w-4 shrink-0 text-slate-400" />
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
                                                            className={`flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                                highlightedIdx === idx ? "bg-slate-50" : "hover:bg-slate-50/60"
                                                            } ${idx !== 0 ? "border-t border-slate-100" : ""}`}
                                                        >
                                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                                highlightedIdx === idx ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                                                            }`}>
                                                                <User className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-medium text-slate-900">
                                                                    <HighlightMatch text={s.name} query={searchQuery} />
                                                                </span>
                                                                <span className="block truncate text-xs text-slate-500">
                                                                    {s.email}{s.phone ? ` · ${s.phone}` : ""}
                                                                </span>
                                                            </span>
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
                                                            className={`flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                                                highlightedIdx === idx ? "bg-slate-50" : "hover:bg-slate-50/60"
                                                            } ${idx !== 0 ? "border-t border-slate-100" : ""}`}
                                                        >
                                                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                                highlightedIdx === idx ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                                                            }`}>
                                                                <Hash className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate font-mono text-sm font-medium text-slate-900">
                                                                    <HighlightMatch text={s.bookingId.slice(-10).toUpperCase()} query={searchQuery.toUpperCase()} />
                                                                </span>
                                                                <span className="block truncate text-xs text-slate-500">
                                                                    {s.patientName}{s.date ? ` · ${s.date}` : ""}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    ))
                                                }

                                                {/* See all results footer hint */}
                                                {suggestions.length >= 8 && (
                                                    <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs font-medium text-slate-500">
                                                        <ChevronDown className="h-3.5 w-3.5" />
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
                            className="ui-btn min-h-[48px] w-full bg-primary px-6 text-white shadow-sm hover:bg-primary/90 md:w-auto"
                        >
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Searching...</>
                            ) : (
                                "Search"
                            )}
                        </button>
                    </form>

                    {error && (
                        <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </section>

                {/* ── Results ── */}
                {results.map((result, idx) => (
                    <section key={idx} className="ui-card overflow-hidden">
                        {/* Patient Info Card */}
                        <div className="space-y-5 p-5 sm:p-6">
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 sm:h-14 sm:w-14">
                                    <User className="h-6 w-6 sm:h-7 sm:w-7" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-slate-500">Patient name</p>
                                    <h3 className="mt-0.5 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{result.patientInfo.name}</h3>
                                    <div className="mt-1.5 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {result.patientInfo.phone || "N/A"}
                                        </span>
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{result.patientInfo.email || "N/A"}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                                    <p className="text-xs font-medium text-slate-500">Total visits</p>
                                    <p className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                                        <Activity className="h-4 w-4 shrink-0 text-emerald-500" /> {result.patientInfo.totalVisits || result.bookings?.length || 0}
                                    </p>
                                </div>
                                <div className="order-last col-span-2 rounded-xl bg-slate-50 p-3.5 sm:order-none sm:col-span-1 sm:p-4">
                                    <p className="text-xs font-medium text-slate-500">First / last visit</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(result.patientInfo.firstVisit)}</p>
                                    <p className="text-xs text-slate-500">to {formatDate(result.patientInfo.lastVisit)}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3.5 sm:p-4">
                                    <p className="text-xs font-medium text-slate-500">Total spent</p>
                                    <p className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
                                        <CreditCard className="h-4 w-4 shrink-0 text-amber-500" /> ₹{result.patientInfo.totalSpent}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Booking History Table */}
                        <div className="border-t border-slate-100">
                            <h3 className="flex items-center gap-2 px-5 pb-3 pt-5 text-base font-semibold text-slate-900 sm:px-6">
                                <Calendar className="h-5 w-5 text-indigo-500" /> Booking history
                            </h3>

                            {/* Desktop Table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-y border-slate-100 bg-slate-50/80">
                                            <th className="ui-th pl-6">Booking ID</th>
                                            <th className="ui-th">Date &amp; time</th>
                                            <th className="ui-th">Doctor</th>
                                            <th className="ui-th">Status</th>
                                            <th className="ui-th">Payment</th>
                                            <th className="ui-th pr-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {result.bookings.map((booking: any) => (
                                            <tr key={booking._id} className="transition-colors hover:bg-slate-50/60">
                                                <td className="ui-td pl-6">
                                                    <span className="font-mono text-xs font-semibold text-slate-900">{booking._id.slice(-6).toUpperCase()}</span>
                                                </td>
                                                <td className="ui-td whitespace-nowrap">
                                                    <p className="font-medium text-slate-900">{formatDate(booking.slotTime || booking.bookingDate)}</p>
                                                    <p className="mt-0.5 text-xs text-slate-500">{formatTime(booking.slotTime || booking.bookingDate)}</p>
                                                </td>
                                                <td className="ui-td font-medium text-slate-700">
                                                    {doctorLabel(booking.doctor, "—")}
                                                </td>
                                                <td className="ui-td">
                                                    <span className={`ui-badge capitalize ${bookingStatusTone(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="ui-td">
                                                    <span className={`ui-badge capitalize ${paymentStatusTone(booking.paymentStatus)}`}>
                                                        {booking.paymentStatus || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="ui-td pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {canFollowUp && <button
                                                            onClick={() => setFollowUpBooking({ ...booking, patientInfo: result.patientInfo })}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                                                            title="Schedule Follow-Up Reminder"
                                                        >
                                                            <Bell className="h-4 w-4" />
                                                        </button>}
                                                        {canPay && <button
                                                            onClick={() => handleGenerateInvoice(booking._id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100"
                                                            title="Generate Invoice"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </button>}
                                                        {canPay && <button
                                                            onClick={() => handleOpenPaymentModal(booking._id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100"
                                                            title="Record Payment"
                                                        >
                                                            <IndianRupee className="h-4 w-4" />
                                                        </button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
                                {result.bookings.map((booking: any) => (
                                    <div key={booking._id} className="space-y-3 px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                                                {booking._id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className={`ui-badge capitalize ${bookingStatusTone(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                                            <div className="min-w-0">
                                                <span className="mb-0.5 block text-[11px] font-medium text-slate-500">Date &amp; time</span>
                                                <span className="block text-sm font-medium text-slate-800">{formatDate(booking.slotTime || booking.bookingDate)}</span>
                                                <span className="mt-0.5 block text-xs text-slate-500">{formatTime(booking.slotTime || booking.bookingDate)}</span>
                                            </div>
                                            <div className="min-w-0 text-right">
                                                <span className="mb-1 block text-[11px] font-medium text-slate-500">Payment</span>
                                                <span className={`ui-badge capitalize ${paymentStatusTone(booking.paymentStatus)}`}>
                                                    {booking.paymentStatus || 'pending'}
                                                </span>
                                            </div>
                                            <div className="col-span-2 min-w-0 border-t border-slate-200 pt-2.5">
                                                <span className="mb-0.5 block text-[11px] font-medium text-slate-500">Doctor</span>
                                                <span className="block truncate text-sm font-medium text-slate-800">{doctorLabel(booking.doctor, "—")}</span>
                                            </div>
                                        </div>
                                        <div className="flex w-full flex-col gap-2">
                                            {canFollowUp && <button
                                                onClick={() => setFollowUpBooking({ ...booking, patientInfo: result.patientInfo })}
                                                className="ui-btn min-h-[44px] w-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                            >
                                                <Bell className="h-4 w-4" /> Schedule follow-up
                                            </button>}
                                            {canPay && <button
                                                onClick={() => handleGenerateInvoice(booking._id)}
                                                className="ui-btn min-h-[44px] w-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            >
                                                <FileText className="h-4 w-4" /> Generate invoice
                                            </button>}
                                            {canPay && <button
                                                onClick={() => handleOpenPaymentModal(booking._id)}
                                                className="ui-btn min-h-[44px] w-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                            >
                                                <IndianRupee className="h-4 w-4" /> Record payment
                                            </button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}

                {/* Follow-Up Reminder Modal */}
                {followUpBooking && (
                    <FollowUpRemindersAdmin
                        prefillData={{
                            patientName: followUpBooking.patientInfo?.name || followUpBooking.patient?.name || followUpBooking.patientName || '',
                            patientPhone: followUpBooking.patientInfo?.phone || followUpBooking.patient?.phone || followUpBooking.patientPhone || '',
                            patientEmail: followUpBooking.patientInfo?.email || followUpBooking.patient?.email || followUpBooking.patientEmail || '',
                            originalAppointmentId: followUpBooking._id,
                            doctorId: followUpBooking.doctor?._id || '',
                            doctorName: followUpBooking.doctor?.name || '',
                            department: followUpBooking.doctor?.specialty || ''
                        }}
                        onClosePrefillModal={() => setFollowUpBooking(null)}
                    />
                )}
            </div>

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="ui-overlay"
                    >
                        <div
                            className="absolute inset-0"
                            aria-hidden="true"
                            onClick={() => setPaymentModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Record payment"
                            className="ui-dialog relative sm:max-w-md"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <IndianRupee className="h-5 w-5" />
                                    </span>
                                    <h3 className="text-lg font-semibold leading-tight text-slate-900">Record payment</h3>
                                </div>
                                <button
                                    onClick={() => setPaymentModalOpen(false)}
                                    aria-label="Close"
                                    className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                    <div>
                                        <span className="ui-label">Payment mode</span>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode("online")}
                                                aria-pressed={paymentMode === "online"}
                                                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                                                    paymentMode === "online"
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                <CreditCard className="h-6 w-6" /> Online
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode("offline")}
                                                aria-pressed={paymentMode === "offline"}
                                                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                                                    paymentMode === "offline"
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                <IndianRupee className="h-6 w-6" /> Offline (Cash)
                                            </button>
                                        </div>
                                    </div>

                                    <label className="block">
                                        <span className="ui-label">Amount (₹)</span>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-lg font-semibold text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : "")}
                                                placeholder="0.00"
                                                className="ui-input min-h-[52px] pl-10 text-xl font-semibold"
                                            />
                                        </div>
                                    </label>
                                </div>

                                <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
                                    <button
                                        type="submit"
                                        disabled={paymentSubmitting || paymentAmount === ""}
                                        className="ui-btn-success min-h-[48px] w-full text-base"
                                    >
                                        {paymentSubmitting ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Save payment"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Presentational helpers ───────────────────────────────────────────────────

const bookingStatusTone = (status?: string) =>
    status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "cancelled" ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-amber-200 bg-amber-50 text-amber-700";

const paymentStatusTone = (status?: string) =>
    status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
