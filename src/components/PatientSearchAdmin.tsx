"use client";

import { useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, User, Phone, Mail, Calendar, CreditCard, 
    Upload, FileText, Download, Activity, FileCheck, X
} from "lucide-react";

export default function PatientSearchAdmin() {
    const [searchType, setSearchType] = useState<"bookingId" | "name">("bookingId");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState("");

    // Modal states
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    
    // View Modal state
    const [viewPrescriptionUrl, setViewPrescriptionUrl] = useState<string | null>(null);
    const [fetchingPrescription, setFetchingPrescription] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        setError("");
        setResults([]);

        try {
            const queryParam = searchType === "bookingId" ? `bookingId=${searchQuery}` : `name=${searchQuery}`;
            const res = await api.get(`/hospital/dashboard/patients/search?${queryParam}`);
            setResults(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to find patient");
        } finally {
            setLoading(false);
        }
    };

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
            
            // Refresh results
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
            if (res.data.url) {
                window.open(res.data.url, "_blank");
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
            // Wait, we need to pass the amount or assume it is retrieved by backend.
            // According to backend, it needs `amount`.
            const amountStr = prompt("Enter amount for the invoice (e.g., 500):", "500");
            if (!amountStr) return;
            const amount = parseInt(amountStr, 10);
            if (isNaN(amount)) {
                alert("Invalid amount");
                return;
            }
            await api.post(`/hospital/dashboard/appointments/${appointmentId}/invoice`, { amount });
            alert("Invoice generated and sent successfully!");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to generate invoice");
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Search className="w-6 h-6 text-primary" /> Patient Search & Records
                    </h2>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Search by Booking ID or Name to view patient history and manage prescriptions.</p>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <select 
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value as "bookingId" | "name")}
                        className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 outline-none transition-all w-full md:w-48"
                    >
                        <option value="bookingId">Booking ID</option>
                        <option value="name">Patient Name</option>
                    </select>

                    <input 
                        type="text"
                        placeholder={searchType === "bookingId" ? "Enter Booking ID..." : "Enter Patient Name..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:border-blue-200 outline-none transition-all"
                    />

                    <button 
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="px-8 py-4 bg-primary text-white font-black rounded-2xl transition-all shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50"
                    >
                        {loading ? "Searching..." : "Search"}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold flex items-center gap-2">
                        <X className="w-4 h-4" /> {error}
                    </div>
                )}
            </div>

            {results.map((result, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-8">
                    {/* Patient Info Card */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shrink-0 border border-blue-100 shadow-inner">
                            <User className="w-10 h-10" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Booking ID</th>
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Doctor</th>
                                        <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}

            {/* Prescription Upload Modal */}
            <AnimatePresence>
                {uploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setUploadModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-2xl"
                        >
                            <button 
                                onClick={() => setUploadModalOpen(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Upload Prescription</h3>
                            <p className="text-slate-500 text-sm font-medium mb-8">
                                Please upload the prescription PDF for this booking. The patient will be notified via email.
                            </p>

                            <form onSubmit={handleUploadSubmit} className="space-y-6">
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
                                                <p className="font-bold text-slate-900">{prescriptionFile.name}</p>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-slate-700">Click or drag file to upload</p>
                                                    <p className="text-xs text-slate-400 font-semibold mt-1">PDF format up to 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={uploading || !prescriptionFile}
                                    className="w-full py-4 bg-primary text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                                    ) : (
                                        <>Upload & Notify Patient</>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
