"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { getToken, getUser, clearAuth } from "@/lib/tokenStorage";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, Activity, Calendar, Clock, Plus, Settings, 
    LogOut, User, Stethoscope, ChevronRight, CheckCircle2, 
    XCircle, AlertCircle, Info, RefreshCcw, LayoutDashboard,
    Download
} from "lucide-react";
import SlotGenTool from "@/components/SlotGenTool";

export default function HospitalDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);
    
    // Tabs & Filters
    const [doctorTab, setDoctorTab] = useState<"individual" | "group">("individual");
    const [filterDate, setFilterDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterSpecialty, setFilterSpecialty] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // Recruit Doctor States
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showSlotGen, setShowSlotGen] = useState<any>(null);
    const [newDoctor, setNewDoctor] = useState({ name: "", specialty: "", fee: 200 });

    // Specialty Group States
    const [showAddSpecialtyGroup, setShowAddSpecialtyGroup] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupDept, setGroupDept] = useState("");
    const [groupFee, setGroupFee] = useState(500);
    const [groupMaxSlots, setGroupMaxSlots] = useState(10);
    const [groupDocsCount, setGroupDocsCount] = useState(5);
    const [groupDesc, setGroupDesc] = useState("");
    const [groupStartTime, setGroupStartTime] = useState("09:00");
    const [groupEndTime, setGroupEndTime] = useState("17:00");
    const [groupDays, setGroupDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

    // Slot Management States
    const [activeMainTab, setActiveMainTab] = useState<"appointments" | "slots">("appointments");
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [slots, setSlots] = useState<any[]>([]);
    const [activeSlotSubTab, setActiveSlotSubTab] = useState<"upcoming" | "cancelled">("upcoming");
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [showCancelSlotModal, setShowCancelSlotModal] = useState<any>(null);
    const [cancellationReason, setCancellationReason] = useState("");

    // Add Slot Form States
    const [addSlotDoctorId, setAddSlotDoctorId] = useState("");
    const [addSlotDate, setAddSlotDate] = useState(new Date().toISOString().split("T")[0]);
    const [addSlotStartTime, setAddSlotStartTime] = useState("09:00");
    const [addSlotEndTime, setAddSlotEndTime] = useState("09:30");
    const [addSlotRecurrenceType, setAddSlotRecurrenceType] = useState<"none" | "daily" | "weekly">("none");
    const [addSlotRecurrenceDays, setAddSlotRecurrenceDays] = useState<string[]>([]);
    const [addSlotRecurrenceUntil, setAddSlotRecurrenceUntil] = useState("");

    // Manual Walk-In Booking States
    const [showManualBooking, setShowManualBooking] = useState(false);
    const [manualPatientName, setManualPatientName] = useState("");
    const [manualPatientEmail, setManualPatientEmail] = useState("");
    const [manualPatientPhone, setManualPatientPhone] = useState("");
    const [manualDoctorId, setManualDoctorId] = useState("");
    const [manualBookingDate, setManualBookingDate] = useState(new Date().toISOString().split("T")[0]);
    const [manualSlotId, setManualSlotId] = useState("");
    const [manualPaymentStatus, setManualPaymentStatus] = useState("pending");
    const [manualBookingNotes, setManualBookingNotes] = useState("");

    const handleAddSlotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/hospital/dashboard/slots/add", {
                doctorId: addSlotDoctorId,
                date: addSlotDate,
                startTime: addSlotStartTime,
                endTime: addSlotEndTime,
                recurrence: {
                    type: addSlotRecurrenceType,
                    days: addSlotRecurrenceDays,
                    until: addSlotRecurrenceUntil || undefined
                }
            });
            alert("Slot(s) added successfully!");
            setShowAddSlot(false);
            setAddSlotDoctorId("");
            setAddSlotDate(new Date().toISOString().split("T")[0]);
            setAddSlotStartTime("09:00");
            setAddSlotEndTime("09:30");
            setAddSlotRecurrenceType("none");
            setAddSlotRecurrenceDays([]);
            setAddSlotRecurrenceUntil("");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to add slot");
        }
    };

    const handleCancelSlotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showCancelSlotModal) return;
        try {
            await api.post(`/hospital/dashboard/slots/${showCancelSlotModal._id}/cancel`, {
                reason: cancellationReason
            });
            alert("Slot and all associated bookings cancelled successfully!");
            setShowCancelSlotModal(null);
            setCancellationReason("");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to cancel slot");
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        if (!window.confirm("Are you sure you want to completely delete this slot? All associated bookings (if any) will also be deleted!")) {
            return;
        }
        try {
            await api.delete(`/hospital/dashboard/slots/${slotId}`);
            alert("Slot deleted successfully!");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete slot");
        }
    };

    const handleAddDoctorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/hospital/dashboard/doctors", {
                ...newDoctor,
                isSpecialtyGroup: false
            });
            alert("Doctor recruited successfully!");
            setShowAddDoctor(false);
            setNewDoctor({ name: "", specialty: "", fee: 200 });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to recruit doctor");
        }
    };

    const handleAddSpecialtyGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const availability = groupDays.map(day => ({
                day,
                startTime: groupStartTime,
                endTime: groupEndTime
            }));

            await api.post("/hospital/dashboard/doctors", {
                name: `${groupName} Specialty Group`,
                specialty: groupName,
                fee: groupFee,
                availability,
                isSpecialtyGroup: true,
                department: groupDept,
                maxAppointmentsPerSlot: groupMaxSlots,
                doctorsCount: groupDocsCount,
                description: groupDesc
            });

            alert("Specialty Group created successfully!");
            setShowAddSpecialtyGroup(false);
            setGroupName("");
            setGroupDept("");
            setGroupFee(500);
            setGroupMaxSlots(10);
            setGroupDocsCount(5);
            setGroupDesc("");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to create specialty group");
        }
    };

    const toggleDoctorStatus = async (doc: any) => {
        try {
            await api.put(`/hospital/dashboard/doctors/${doc._id}`, {
                is_active: !doc.is_active
            });
            alert(`${doc.isSpecialtyGroup ? 'Specialty Group' : 'Doctor'} status updated successfully!`);
            fetchData();
        } catch (err: any) {
            alert("Failed to update status");
        }
    };

    const handleManualBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualDoctorId || !manualSlotId) {
            alert("Please select both a doctor and an available slot.");
            return;
        }

        const selectedSlot = slots.find(s => s._id === manualSlotId);
        if (!selectedSlot) {
            alert("Selected slot is not valid.");
            return;
        }

        try {
            await api.post("/hospital/dashboard/appointments/manual", {
                patientName: manualPatientName,
                patientEmail: manualPatientEmail,
                patientPhone: manualPatientPhone,
                doctorId: manualDoctorId,
                slotId: manualSlotId,
                slotTime: selectedSlot.startTime,
                notes: manualBookingNotes,
                paymentStatus: manualPaymentStatus
            });

            alert("Walk-in appointment booked successfully!");
            setShowManualBooking(false);
            setManualPatientName("");
            setManualPatientEmail("");
            setManualPatientPhone("");
            setManualDoctorId("");
            setManualSlotId("");
            setManualBookingNotes("");
            setManualPaymentStatus("pending");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to book manual appointment");
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const [statsRes, doctorsRes, appointmentsRes, slotsRes] = await Promise.all([
                api.get("/hospital/dashboard/stats"),
                api.get("/hospital/dashboard/doctors"),
                api.get("/hospital/dashboard/appointments"),
                api.get("/hospital/dashboard/slots")
            ]);

            setStats(statsRes.data);
            setDoctors(doctorsRes.data);
            setAppointments(appointmentsRes.data);
            setSlots(slotsRes.data);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                // Interceptor will handle the redirect, but we stop loading here
                return;
            }
            if (err.response?.status === 403) {
                setError("Access Denied. Hospital account required.");
            } else {
                setError("Failed to load dashboard data.");
            }
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const u = getUser();
        if (u && u.role !== 'hospital') {
            router.push("/");
            return;
        }
        setUser(u);
        fetchData();
    }, [fetchData, router]);

    const filteredAppointments = appointments.filter((app: any) => {
        const appDateStr = app.slotTime ? new Date(app.slotTime).toISOString().split('T')[0] : "";
        
        if (filterDate && appDateStr !== filterDate) return false;
        
        if (startDate && appDateStr < startDate) return false;
        if (endDate && appDateStr > endDate) return false;

        if (filterSpecialty && !app.doctor?.specialty?.toLowerCase().includes(filterSpecialty.toLowerCase())) return false;

        if (filterStatus && app.status !== filterStatus) return false;

        return true;
    });

    const filteredDoctors = doctors.filter((doc: any) => {
        if (doctorTab === "individual") {
            return doc.isSpecialtyGroup !== true;
        } else {
            return doc.isSpecialtyGroup === true;
        }
    });

    const exportToExcel = () => {
        if (filteredAppointments.length === 0) {
            alert("No filtered appointments available to export.");
            return;
        }

        // CSV Header
        const headers = ["Token No.", "Patient Name", "Contact Number", "Specialty", "Appointment Date", "Time Slot", "Booking Date", "Status", "Hospital Name"];
        
        // CSV Rows
        const rows = filteredAppointments.map((app, index) => {
            const tokenNo = app.tokenNo || `T-${index + 1001}`;
            const timeSlot = app.slot 
                ? `${new Date(app.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(app.slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}` 
                : new Date(app.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            
            return [
                `"${tokenNo}"`,
                `"${app.patient?.name || 'N/A'}"`,
                `"${app.patient?.phone || 'N/A'}"`,
                `"${app.doctor?.specialty || 'N/A'}"`,
                `"${new Date(app.slotTime).toLocaleDateString()}"`,
                `"${timeSlot}"`,
                `"${new Date(app.bookingDate || app.createdAt || Date.now()).toLocaleDateString()}"`,
                `"${app.status || 'N/A'}"`,
                `"${stats?.hospital?.name || stats?.name || user?.hospitalName || 'Pillora Hospital'}"`
            ];
        });

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Hospital_Bookings_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.put(`/hospital/dashboard/appointments/${id}/status`, { status });
            fetchData();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
                <p className="mt-4 font-bold text-primary animate-pulse">Loading Hospital Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Access Error</h1>
                    <p className="text-gray-500 font-medium">{error}</p>
                    <button onClick={() => {
                        clearAuth();
                        window.location.href = '/login';
                    }} className="mt-6 px-8 py-3 bg-gray-900 text-white font-bold rounded-xl">Back to Login</button>
                </div>
            </div>
        );
    }

    const isSelfManaged = true;

    // Calculate doctor bookings breakdown
    const getDoctorBreakdown = () => {
        const breakdown: { [key: string]: number } = {};
        appointments.forEach(app => {
            const name = app.doctor?.name || "Other";
            breakdown[name] = (breakdown[name] || 0) + 1;
        });
        return Object.entries(breakdown).map(([name, count]) => ({ name, count }));
    };

    const doctorData = getDoctorBreakdown();
    const maxCount = Math.max(...doctorData.map(d => d.count), 1);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hospital Command Center</h1>
                        <p className="text-slate-500 font-medium">Manage your facility operations and patient flow.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                            {stats?.plan || 'Standard'} Tier
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            System Online
                        </div>
                    </div>
                </div>


                {/* Mode Warning & Benefits */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {!isSelfManaged && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/10 flex items-center justify-between gap-6 h-full">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Info className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg">Pillora-Managed</h3>
                                    <p className="text-blue-100 text-xs font-medium">Only admins can modify your facility&apos;s slots.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-900/5 flex items-center justify-between gap-6">
                        <div className="flex flex-wrap gap-2">
                            {stats?.is_featured && (
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">Top of Search</span>
                            )}
                            {stats?.has_govt_schemes && (
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Govt Schemes</span>
                            )}
                            {stats?.is_spotlight && (
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">Spotlight</span>
                            )}
                            {stats?.priority_support && (
                                <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">Priority Support</span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan Benefits</p>
                            <p className="text-xs font-bold text-primary">Active</p>
                        </div>
                    </motion.div>
                </div>

                {isSelfManaged && (
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-slate-900 leading-tight">Quick Slot & Timing Generator</h3>
                                    <p className="text-slate-500 text-xs font-medium mt-0.5">Quickly select a doctor to set their available date, start/end timing, and booking slot duration.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowManualBooking(true)}
                                className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 active:scale-95 shrink-0"
                            >
                                <Plus className="w-4 h-4" /> Book Walk-In Appointment
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                            {doctors.map((doc: any) => (
                                <button
                                    key={doc._id}
                                    onClick={() => setShowSlotGen(doc)}
                                    className="w-full sm:w-auto px-5 py-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-700 hover:text-blue-600 font-black rounded-2xl text-xs flex items-center justify-center sm:justify-start gap-2.5 transition-all shadow-sm hover:shadow active:scale-95 shrink-0"
                                >
                                    <Clock className="w-4 h-4" /> Setup Timing for Dr. {doc.name}
                                </button>
                            ))}
                            {doctors.length === 0 && (
                                <div className="text-center py-6 w-full bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Add a doctor below first to configure timings and generate slots.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Doctors" value={stats?.stats?.doctors} icon={<Stethoscope className="text-blue-500" />} />
                    <StatCard label="Total Bookings" value={stats?.stats?.appointments} icon={<Calendar className="text-emerald-500" />} />
                    <StatCard label="Pending Review" value={stats?.stats?.pending} icon={<Clock className="text-amber-500" />} />
                </div>

                {/* Main Action Tabs */}
                <div className="bg-slate-50 p-2 rounded-[2rem] border border-slate-100 flex max-w-md shadow-sm">
                    <button 
                        onClick={() => setActiveMainTab("appointments")}
                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeMainTab === "appointments" 
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                                : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Appointments & Analytics
                    </button>
                    <button 
                        onClick={() => setActiveMainTab("slots")}
                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeMainTab === "slots" 
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                                : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Slot Management
                    </button>
                </div>

                {activeMainTab === "appointments" ? (
                    <>
                        {/* Bookings Analytics & Operational Graphs */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-primary" /> Bookings & Operational Analytics
                                </h3>
                                <p className="text-slate-500 text-xs font-semibold mt-1">Real-time performance metrics and doctor appointment distributions.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Bar Chart: Bookings per Doctor */}
                                <div className="md:col-span-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col h-[320px]">
                                    <h4 className="text-sm font-extrabold text-slate-800 mb-6 uppercase tracking-wider">Bookings Distribution by Doctor</h4>
                                    <div className="flex-1 flex items-end gap-6 sm:gap-10 px-4 pb-4 border-b border-slate-200">
                                        {doctorData.map((d, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                                <div className="relative w-full flex flex-col items-center justify-end h-full">
                                                    {/* Count tooltip */}
                                                    <div className="absolute -top-8 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg shrink-0">
                                                        {d.count} Bookings
                                                    </div>
                                                    {/* Bar */}
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(d.count / maxCount) * 80}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                                                        className="w-full sm:w-10 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-xl group-hover:from-blue-700 group-hover:to-indigo-500 transition-colors shadow-lg shadow-blue-500/20"
                                                    />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 text-center truncate w-20" title={d.name}>
                                                    Dr. {d.name.split(" ").pop()}
                                                </p>
                                            </div>
                                        ))}
                                        {doctorData.length === 0 && (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold italic text-sm">
                                                No bookings data to display in chart.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Distribution Breakdown */}
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col h-[320px] justify-between">
                                    <div>
                                        <h4 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-wider">Status Distribution</h4>
                                        <div className="space-y-3.5">
                                            {['confirmed', 'pending', 'checked-in', 'completed', 'cancelled'].map((status) => {
                                                const count = appointments.filter(a => a.status === status).length;
                                                const percentage = appointments.length > 0 ? (count / appointments.length) * 100 : 0;
                                                const color = status === 'completed' || status === 'confirmed' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : status === 'checked-in' ? 'bg-blue-500' : status === 'cancelled' ? 'bg-rose-500' : 'bg-slate-400';

                                                return (
                                                    <div key={status} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-600">
                                                            <span>{status}</span>
                                                            <span>{count} ({Math.round(percentage)}%)</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <motion.div 
                                                                initial={{ width: 0 }} 
                                                                animate={{ width: `${percentage}%` }} 
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className={`h-full ${color}`} 
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200/60 pt-3">
                                        Total Monitored: {appointments.length} Appointments
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Doctors & Specialty Groups List */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-6 h-6 text-primary" />
                                        <h2 className="text-xl font-black">Staff & Groups</h2>
                                    </div>
                                    {isSelfManaged && (
                                        <button 
                                            onClick={() => doctorTab === "individual" ? setShowAddDoctor(true) : setShowAddSpecialtyGroup(true)} 
                                            className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-wider shadow-md shadow-primary/10"
                                            title={doctorTab === "individual" ? "Add Doctor" : "Add Specialty Group"}
                                        >
                                            <Plus className="w-4 h-4" /> Add {doctorTab === "individual" ? "Doc" : "Group"}
                                        </button>
                                    )}
                                </div>

                                {/* Tabs */}
                                <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-100 flex gap-2">
                                    <button 
                                        onClick={() => setDoctorTab("individual")} 
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            doctorTab === "individual" 
                                                ? "bg-white text-slate-800 shadow-sm" 
                                                : "text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        Individual
                                    </button>
                                    <button 
                                        onClick={() => setDoctorTab("group")} 
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            doctorTab === "group" 
                                                ? "bg-white text-slate-800 shadow-sm" 
                                                : "text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        Specialty Groups
                                    </button>
                                </div>
                                
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredDoctors.map((doc: any) => (
                                        <div key={doc._id} className={`bg-white p-5 rounded-2xl border ${doc.is_active ? 'border-gray-100' : 'border-dashed border-rose-200 bg-rose-50/20'} shadow-sm hover:border-primary/30 transition-all group`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-black text-primary text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                                    {doc.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{doc.name}</p>
                                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider truncate">{doc.specialty}</p>
                                                    {doc.isSpecialtyGroup && doc.department && (
                                                        <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">
                                                            {doc.department}
                                                        </span>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                                            </div>

                                            {doc.isSpecialtyGroup && (
                                                <div className="mt-3.5 pt-3.5 border-t border-slate-50 grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-500">
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Max Per Slot</span>
                                                        <span className="font-extrabold text-slate-700">{doc.maxAppointmentsPerSlot || 1} Patients</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Doctors Pool</span>
                                                        <span className="font-extrabold text-slate-700">{doc.doctorsCount || 1} Available</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <span className="text-xs font-black text-emerald-600">₹{doc.fee} / Visit</span>
                                                <div className="flex items-center gap-3">
                                                    {isSelfManaged && (
                                                        <>
                                                            <button 
                                                                onClick={() => toggleDoctorStatus(doc)} 
                                                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                                                                    doc.is_active 
                                                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                }`}
                                                            >
                                                                {doc.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            {doc.is_active && (
                                                                <button onClick={() => setShowSlotGen(doc)} className="text-[10px] font-black uppercase text-primary hover:underline">
                                                                    Slots
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredDoctors.length === 0 && (
                                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold italic text-xs">No {doctorTab === "individual" ? "doctors recruited" : "specialty groups created"} yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Appointments List */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black flex items-center gap-2">
                                        <Calendar className="w-6 h-6 text-primary" /> Appointments ({filteredAppointments.length})
                                    </h2>
                                    <button
                                        onClick={exportToExcel}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                                    >
                                        <Download className="w-4 h-4" /> Export Excel
                                    </button>
                                </div>

                                {/* Filters Card */}
                                <div className="bg-slate-50 p-4 sm:p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
                                    <div className="flex sm:hidden justify-between items-center">
                                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Filter Appointments</h4>
                                        <button 
                                            type="button"
                                            onClick={() => setShowMobileFilters(!showMobileFilters)} 
                                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 active:scale-95 transition-all shadow-sm"
                                        >
                                            {showMobileFilters ? "Hide Filters" : "Show Filters"}
                                        </button>
                                    </div>
                                    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 ${showMobileFilters ? 'block space-y-3 sm:space-y-0' : 'hidden sm:grid'}`}>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Single Date</label>
                                            <input 
                                                type="date" 
                                                value={filterDate} 
                                                onChange={(e) => {
                                                    setFilterDate(e.target.value);
                                                    if (e.target.value) {
                                                        setStartDate("");
                                                        setEndDate("");
                                                    }
                                                }} 
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Start Date</label>
                                            <input 
                                                type="date" 
                                                value={startDate} 
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    if (e.target.value) setFilterDate("");
                                                }} 
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">End Date</label>
                                            <input 
                                                type="date" 
                                                value={endDate} 
                                                onChange={(e) => {
                                                    setEndDate(e.target.value);
                                                    if (e.target.value) setFilterDate("");
                                                }} 
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Specialty</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Dentist" 
                                                value={filterSpecialty} 
                                                onChange={(e) => setFilterSpecialty(e.target.value)} 
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-0.5">Status</label>
                                            <select 
                                                value={filterStatus} 
                                                onChange={(e) => setFilterStatus(e.target.value)} 
                                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                                            >
                                                <option value="">All Status</option>
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="checked-in">Checked In</option>
                                                <option value="in-consultation">In Consultation</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-md overflow-hidden">
                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                    <th className="p-4 pl-6">Token</th>
                                                    <th className="p-4">Patient</th>
                                                    <th className="p-4">Doctor</th>
                                                    <th className="p-4">Specialty</th>
                                                    <th className="p-4">Date & Time</th>
                                                    <th className="p-4 pr-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-xs">
                                                {filteredAppointments.map((app: any, idx: number) => (
                                                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 pl-6 font-extrabold text-slate-900">{app.tokenNo || `T-${idx + 1001}`}</td>
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-800">{app.patient?.name || 'N/A'}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">{app.patient?.phone || 'N/A'}</div>
                                                        </td>
                                                        <td className="p-4 font-bold text-slate-700">Dr. {app.doctor?.name}</td>
                                                        <td className="p-4 font-bold uppercase tracking-wider text-[10px] text-slate-400">{app.doctor?.specialty}</td>
                                                        <td className="p-4">
                                                            <div className="font-bold text-slate-800">{new Date(app.slotTime).toLocaleDateString()}</div>
                                                            <div className="text-[10px] font-black text-slate-500 mt-0.5 uppercase tracking-wide">
                                                                {app.slot ? `${new Date(app.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(app.slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 pr-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {app.status === 'pending' ? (
                                                                    <div className="flex gap-1">
                                                                        <button title="Confirm" onClick={() => handleStatusUpdate(app._id, 'confirmed')} className={`p-1.5 rounded-lg ${app.status === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}><CheckCircle2 className="w-4 h-4" /></button>
                                                                        <button title="Check-in" onClick={() => handleStatusUpdate(app._id, 'checked-in')} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><User className="w-4 h-4" /></button>
                                                                        <button title="Cancel" onClick={() => handleStatusUpdate(app._id, 'cancelled')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><XCircle className="w-4 h-4" /></button>
                                                                    </div>
                                                                ) : app.status === 'checked-in' ? (
                                                                    <button onClick={() => handleStatusUpdate(app._id, 'in-consultation')} className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 flex items-center gap-2">
                                                                        <RefreshCcw className="w-3 h-3 animate-spin" /> Start Consultation
                                                                    </button>
                                                                ) : app.status === 'in-consultation' ? (
                                                                    <button onClick={() => handleStatusUpdate(app._id, 'completed')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2">
                                                                        <CheckCircle2 className="w-3 h-3" /> Complete
                                                                    </button>
                                                                ) : (
                                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                                                    }`}>{app.status}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card List View */}
                                    <div className="block sm:hidden divide-y divide-slate-100">
                                        {filteredAppointments.map((app: any, idx: number) => (
                                            <div key={app._id} className="p-5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="px-2.5 py-1 bg-slate-900 text-white font-mono text-[9px] rounded-lg font-black tracking-wider">
                                                            {app.tokenNo || `T-${idx + 1001}`}
                                                        </span>
                                                        <h4 className="font-extrabold text-slate-800 mt-2 text-sm">{app.patient?.name || 'N/A'}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold">{app.patient?.phone || 'N/A'}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        app.status === 'completed' || app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : app.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : app.status === 'checked-in' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-50 flex justify-between text-xs font-bold text-slate-600">
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Doctor</span>
                                                        <span className="font-extrabold text-slate-700">Dr. {app.doctor?.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Schedule Slot</span>
                                                        <span className="font-extrabold text-slate-700">{new Date(app.slotTime).toLocaleDateString()}</span>
                                                        <span className="block text-[9px] text-slate-500 font-black mt-0.5">
                                                            {app.slot ? `${new Date(app.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(app.slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}` : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Mobile Actions block */}
                                                <div className="pt-3 border-t border-slate-50">
                                                    {app.status === 'pending' ? (
                                                        <div className="flex gap-2 w-full">
                                                            <button type="button" onClick={() => handleStatusUpdate(app._id, 'confirmed')} className="flex-1 py-2 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-1.5 border border-emerald-100 active:scale-95 transition-all shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /> Confirm</button>
                                                            <button type="button" onClick={() => handleStatusUpdate(app._id, 'checked-in')} className="flex-1 py-2 bg-blue-50 text-blue-600 font-black text-[10px] uppercase rounded-xl hover:bg-blue-100 flex items-center justify-center gap-1.5 border border-blue-100 active:scale-95 transition-all shadow-sm"><User className="w-3.5 h-3.5" /> Check-in</button>
                                                            <button type="button" onClick={() => handleStatusUpdate(app._id, 'cancelled')} className="flex-1 py-2 bg-rose-50 text-rose-600 font-black text-[10px] uppercase rounded-xl hover:bg-rose-100 flex items-center justify-center gap-1.5 border border-rose-100 active:scale-95 transition-all shadow-sm"><XCircle className="w-3.5 h-3.5" /> Cancel</button>
                                                        </div>
                                                    ) : app.status === 'checked-in' ? (
                                                        <button type="button" onClick={() => handleStatusUpdate(app._id, 'in-consultation')} className="w-full py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 flex items-center justify-center gap-2 border border-amber-100 active:scale-95 transition-all">
                                                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Start Consultation
                                                        </button>
                                                    ) : app.status === 'in-consultation' ? (
                                                        <button type="button" onClick={() => handleStatusUpdate(app._id, 'completed')} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 active:scale-95 transition-all">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete Consultation
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                        {filteredAppointments.length === 0 && (
                                            <div className="text-center py-12 text-slate-400 font-bold italic text-xs">
                                                No appointments found in this category.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* SLOT MANAGEMENT SECTION */
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <Clock className="w-6 h-6 text-primary" /> Proactive Slot Management
                                </h3>
                                <p className="text-slate-500 text-xs font-semibold mt-1">Schedule new slots, configure recurrence, and cancel upcoming appointments in emergency scenarios.</p>
                            </div>
                            {isSelfManaged && (
                                <button 
                                    onClick={() => {
                                        if (doctors.length === 0) {
                                            alert("Please recruit a doctor or specialty group first before adding slots.");
                                            return;
                                        }
                                        setAddSlotDoctorId(doctors[0]._id);
                                        setShowAddSlot(true);
                                    }}
                                    className="px-5 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Add New Slot
                                </button>
                            )}
                        </div>

                        {/* Sub Tabs */}
                        <div className="flex border-b border-slate-100 gap-6">
                            <button 
                                onClick={() => setActiveSlotSubTab("upcoming")}
                                className={`pb-4 text-xs font-black uppercase tracking-widest relative ${
                                    activeSlotSubTab === "upcoming" ? "text-slate-900 border-b-2 border-slate-900 font-extrabold" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                Active / Upcoming Slots
                            </button>
                            <button 
                                onClick={() => setActiveSlotSubTab("cancelled")}
                                className={`pb-4 text-xs font-black uppercase tracking-widest relative ${
                                    activeSlotSubTab === "cancelled" ? "text-slate-900 border-b-2 border-slate-900 font-extrabold" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                Cancelled Slots
                            </button>
                        </div>

                        {/* Slot Table Layout */}
                        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            <th className="p-4 pl-6">Doctor / Group</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Time Range</th>
                                            <th className="p-4">Bookings Count</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 pr-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-xs">
                                        {slots
                                            .filter((slot: any) => {
                                                const isCancelled = slot.status === 'cancelled';
                                                if (activeSlotSubTab === 'upcoming') {
                                                    return !isCancelled;
                                                } else {
                                                    return isCancelled;
                                                }
                                            })
                                            .map((slot: any) => {
                                                const slotDateStr = new Date(slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                                const timeRangeStr = `${new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                                                const isUpcoming = new Date(slot.endTime) >= new Date();
                                                const isBooked = slot.status === 'booked';
                                                
                                                // Cancellable only if not cancelled and hasn't passed and not in progress
                                                const isCancellable = slot.status !== 'cancelled' && new Date(slot.startTime) > new Date();

                                                return (
                                                    <tr key={slot._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 pl-6 font-bold text-slate-900">
                                                            Dr. {slot.doctor?.name || "Specialty Group"}
                                                            {slot.doctor?.isSpecialtyGroup && (
                                                                <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase tracking-wider rounded-md">Group</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 font-semibold text-slate-600">{slotDateStr}</td>
                                                        <td className="p-4 font-semibold text-slate-600">{timeRangeStr}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${slot.bookingCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {slot.bookingCount || 0} Booked
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            {slot.status === 'cancelled' ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">Cancelled</span>
                                                            ) : !isUpcoming ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-500">Past Slot</span>
                                                            ) : isBooked ? (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100 font-bold">Fully Booked</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">Available / Active</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 pr-6 text-right">
                                                            {isSelfManaged && activeSlotSubTab === 'upcoming' && (
                                                                <>
                                                                <button
                                                                    disabled={!isCancellable}
                                                                    onClick={() => setShowCancelSlotModal(slot)}
                                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                        isCancellable 
                                                                            ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white" 
                                                                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                                                    }`}
                                                                >
                                                                    Cancel Slot
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteSlot(slot._id)}
                                                                    className="px-3 py-1.5 ml-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                                                                >
                                                                    Delete Slot
                                                                </button>
                                                            </>
                                                            )}
                                                            {activeSlotSubTab === 'cancelled' && slot.cancellationReason && (
                                                                <span className="text-[10px] text-slate-400 font-medium italic block" title={`Reason: ${slot.cancellationReason}`}>
                                                                    Reason: {slot.cancellationReason}
                                                                </span>
                                                            )}
                                                            {activeSlotSubTab === 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleDeleteSlot(slot._id)}
                                                                    className="px-3 py-1.5 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                                                                >
                                                                    Delete Slot
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        {slots.filter(s => activeSlotSubTab === 'upcoming' ? s.status !== 'cancelled' : s.status === 'cancelled').length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-slate-400 font-bold italic">
                                                    No slots found in this category.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List View */}
                            <div className="block sm:hidden divide-y divide-slate-100">
                                {slots
                                    .filter((slot: any) => {
                                        const isCancelled = slot.status === 'cancelled';
                                        if (activeSlotSubTab === 'upcoming') {
                                            return !isCancelled;
                                        } else {
                                            return isCancelled;
                                        }
                                    })
                                    .map((slot: any) => {
                                        const slotDateStr = new Date(slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                        const timeRangeStr = `${new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                                        const isUpcoming = new Date(slot.endTime) >= new Date();
                                        const isBooked = slot.status === 'booked';
                                        const isCancellable = slot.status !== 'cancelled' && new Date(slot.startTime) > new Date();

                                        return (
                                            <div key={slot._id} className="p-5 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-800 text-sm">Dr. {slot.doctor?.name || "Specialty Group"}</h4>
                                                        {slot.doctor?.isSpecialtyGroup && (
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase tracking-wider rounded-md mt-1 inline-block">Specialty Group</span>
                                                        )}
                                                    </div>
                                                    {slot.status === 'cancelled' ? (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">Cancelled</span>
                                                    ) : !isUpcoming ? (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-500">Past Slot</span>
                                                    ) : isBooked ? (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100 font-bold">Fully Booked</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">Active</span>
                                                    )}
                                                </div>
                                                <div className="pt-3 border-t border-slate-50 grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Date</span>
                                                        <span className="font-extrabold text-slate-700">{slotDateStr}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Time Range</span>
                                                        <span className="font-extrabold text-slate-700">{timeRangeStr}</span>
                                                    </div>
                                                </div>
                                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-600">
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bookings Count</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase mt-1 inline-block ${slot.bookingCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {slot.bookingCount || 0} Booked
                                                        </span>
                                                    </div>
                                                    {activeSlotSubTab === 'cancelled' && slot.cancellationReason && (
                                                        <div className="text-right">
                                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reason</span>
                                                            <span className="text-[10px] text-slate-400 font-medium italic block" title={`Reason: ${slot.cancellationReason}`}>
                                                                {slot.cancellationReason}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Actions */}
                                                {isSelfManaged && (
                                                    <div className="pt-3 border-t border-slate-50 flex justify-end gap-2">
                                                        {activeSlotSubTab === 'upcoming' && (
                                                            <button
                                                                type="button"
                                                                disabled={!isCancellable}
                                                                onClick={() => setShowCancelSlotModal(slot)}
                                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center border ${
                                                                    isCancellable 
                                                                        ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white" 
                                                                        : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                Cancel Slot
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSlot(slot._id)}
                                                            className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center border border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                                                        >
                                                            Delete Slot
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                {slots.filter(s => activeSlotSubTab === 'upcoming' ? s.status !== 'cancelled' : s.status === 'cancelled').length === 0 && (
                                    <div className="text-center py-12 text-slate-400 font-bold italic text-xs">
                                        No slots found in this category.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals for Add Doctor and Slot Gen would go here */}
            {showSlotGen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black">Generate Slots</h3>
                            <button onClick={() => setShowSlotGen(null)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <SlotGenTool doctor={showSlotGen} onClose={() => { setShowSlotGen(null); fetchData(); }} />
                    </motion.div>
                </div>
            )}

            {showAddDoctor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900">Recruit New Doctor</h3>
                            <button onClick={() => setShowAddDoctor(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddDoctorSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor Name</label>
                                <input required type="text" placeholder="Dr. Jane Smith" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-xs" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialty</label>
                                <input required type="text" placeholder="Cardiologist" value={newDoctor.specialty} onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-xs" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Fee (₹)</label>
                                <input required type="number" value={newDoctor.fee} onChange={e => setNewDoctor({...newDoctor, fee: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-xs" />
                            </div>
                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:-translate-y-1 transition-all text-xs uppercase tracking-wider">
                                Recruit Doctor
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showAddSpecialtyGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black">Create Specialty Group</h3>
                            <button onClick={() => setShowAddSpecialtyGroup(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddSpecialtyGroupSubmit} className="space-y-4 pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialty Name</label>
                                <input required type="text" placeholder="e.g. Cardiology" value={groupName} onChange={e => setGroupName(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                <input required type="text" placeholder="e.g. Department of Cardiac Sciences" value={groupDept} onChange={e => setGroupDept(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fee (₹)</label>
                                    <input required type="number" value={groupFee} onChange={e => setGroupFee(Number(e.target.value))} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Per Slot</label>
                                    <input required type="number" value={groupMaxSlots} onChange={e => setGroupMaxSlots(Number(e.target.value))} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Docs Count</label>
                                    <input required type="number" value={groupDocsCount} onChange={e => setGroupDocsCount(Number(e.target.value))} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Availability Schedule</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[8px] font-bold text-slate-400 uppercase ml-0.5">Start Time</label>
                                        <input type="time" value={groupStartTime} onChange={e => setGroupStartTime(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-bold text-slate-400 uppercase ml-0.5">End Time</label>
                                        <input type="time" value={groupEndTime} onChange={e => setGroupEndTime(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Days</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                        <label key={day} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={groupDays.includes(day)} 
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setGroupDays([...groupDays, day]);
                                                    } else {
                                                        setGroupDays(groupDays.filter(d => d !== day));
                                                    }
                                                }}
                                                className="rounded text-primary"
                                            />
                                            <span className="text-[10px] font-bold text-slate-700">{day}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Notes</label>
                                <textarea placeholder="General details about the group or department..." value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs h-20 resize-none" />
                            </div>

                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:-translate-y-1 transition-all text-xs uppercase tracking-wider">
                                Create Specialty Group
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showAddSlot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900">Add New Slot</h3>
                            <button onClick={() => setShowAddSlot(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddSlotSubmit} className="space-y-4 pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Doctor / Specialty Group</label>
                                <select required value={addSlotDoctorId} onChange={e => setAddSlotDoctorId(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs">
                                    {doctors.map((doc: any) => (
                                        <option key={doc._id} value={doc._id}>
                                            {doc.name} ({doc.specialty})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                <input required type="date" min={new Date().toISOString().split("T")[0]} value={addSlotDate} onChange={e => setAddSlotDate(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                                    <input required type="time" value={addSlotStartTime} onChange={e => setAddSlotStartTime(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                                    <input required type="time" value={addSlotEndTime} onChange={e => setAddSlotEndTime(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Recurrence</label>
                                <select value={addSlotRecurrenceType} onChange={e => setAddSlotRecurrenceType(e.target.value as any)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs">
                                    <option value="none">Does not repeat</option>
                                    <option value="daily">Repeat Daily</option>
                                    <option value="weekly">Repeat on Selected Days</option>
                                </select>
                            </div>
                            {addSlotRecurrenceType === "weekly" && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Repeat on Days</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                            <label key={day} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox" 
                                                    checked={addSlotRecurrenceDays.includes(day)} 
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setAddSlotRecurrenceDays([...addSlotRecurrenceDays, day]);
                                                        } else {
                                                            setAddSlotRecurrenceDays(addSlotRecurrenceDays.filter(d => d !== day));
                                                        }
                                                    }}
                                                    className="rounded text-primary"
                                                />
                                                <span className="text-[10px] font-bold text-slate-700">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {addSlotRecurrenceType !== "none" && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Repeat Until Date</label>
                                    <input required type="date" min={addSlotDate} value={addSlotRecurrenceUntil} onChange={e => setAddSlotRecurrenceUntil(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                            )}
                            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:-translate-y-1 transition-all text-xs uppercase tracking-wider">
                                Save Slot(s)
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showCancelSlotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900">Cancel Slot</h3>
                            <button onClick={() => setShowCancelSlotModal(null)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCancelSlotSubmit} className="space-y-6">
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-rose-600">
                                    Warning: Cancelling this slot will automatically cancel all associated appointments for this doctor/specialty group on this date, and the patients will be automatically notified of the emergency cancellation.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cancellation Reason</label>
                                <textarea required placeholder="Emergency meeting, doctor unavailable..." value={cancellationReason} onChange={e => setCancellationReason(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none h-28 resize-none text-xs" />
                            </div>
                            <button className="w-full py-5 bg-rose-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-rose-700 transition-all text-xs uppercase tracking-wider">
                                Confirm Cancellation
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showManualBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900">Book Walk-In Appointment</h3>
                            <button onClick={() => setShowManualBooking(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleManualBookingSubmit} className="space-y-4 pr-2 custom-scrollbar">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Full Name</label>
                                <input required type="text" placeholder="John Doe" value={manualPatientName} onChange={e => setManualPatientName(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Email Address</label>
                                    <input required type="email" placeholder="john@example.com" value={manualPatientEmail} onChange={e => setManualPatientEmail(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Phone Number</label>
                                    <input type="tel" placeholder="e.g. +91 98765 43210" value={manualPatientPhone} onChange={e => setManualPatientPhone(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Doctor / Specialty Group</label>
                                <select required value={manualDoctorId} onChange={e => { setManualDoctorId(e.target.value); setManualSlotId(""); }} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs">
                                    <option value="">-- Choose Staff / Group --</option>
                                    {doctors.map((doc: any) => (
                                        <option key={doc._id} value={doc._id}>
                                            {doc.name} ({doc.specialty})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Appointment Date</label>
                                    <input required type="date" min={new Date().toISOString().split("T")[0]} value={manualBookingDate} onChange={e => { setManualBookingDate(e.target.value); setManualSlotId(""); }} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Offline Payment Status</label>
                                    <select value={manualPaymentStatus} onChange={e => setManualPaymentStatus(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs">
                                        <option value="pending">Pending Payment</option>
                                        <option value="paid">Paid (Offline Collected)</option>
                                    </select>
                                </div>
                            </div>

                            {manualDoctorId && (
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Available Slot</label>
                                    <select required value={manualSlotId} onChange={e => setManualSlotId(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs">
                                        <option value="">-- Select Slot Time --</option>
                                        {slots.filter((s: any) => {
                                            const matchDoc = s.doctor?._id === manualDoctorId;
                                            const slotDate = new Date(s.startTime).toISOString().split("T")[0];
                                            const matchDate = slotDate === manualBookingDate;
                                            const isAvailable = s.status === "available";
                                            const maxAppts = s.max_appointments || 1;
                                            const bookingCount = s.bookingCount || 0;
                                            const hasCapacity = bookingCount < maxAppts;
                                            return matchDoc && matchDate && isAvailable && hasCapacity;
                                        }).map((s: any) => {
                                            const timeRangeStr = `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
                                            const remaining = (s.max_appointments || 1) - (s.bookingCount || 0);
                                            return (
                                                <option key={s._id} value={s._id}>
                                                    {timeRangeStr} ({remaining} remaining spots)
                                                </option>
                                            );
                                        })}
                                    </select>
                                    {slots.filter((s: any) => {
                                        const matchDoc = s.doctor?._id === manualDoctorId;
                                        const slotDate = new Date(s.startTime).toISOString().split("T")[0];
                                        const matchDate = slotDate === manualBookingDate;
                                        const isAvailable = s.status === "available";
                                        const maxAppts = s.max_appointments || 1;
                                        const bookingCount = s.bookingCount || 0;
                                        const hasCapacity = bookingCount < maxAppts;
                                        return matchDoc && matchDate && isAvailable && hasCapacity;
                                    }).length === 0 && (
                                        <p className="text-[10px] font-bold text-rose-500 mt-1 italic">
                                            No available slots found for this doctor on this date. Configure and generate slots first!
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Booking Notes / Symptoms</label>
                                <textarea placeholder="Patient notes, reason for visit, walk-in comments..." value={manualBookingNotes} onChange={e => setManualBookingNotes(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-xs h-20 resize-none" />
                            </div>

                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-emerald-700 transition-all text-xs uppercase tracking-wider">
                                Confirm Walk-in Booking
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-lg shadow-blue-900/5 flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="text-xl sm:text-3xl font-black text-gray-900 leading-tight">{value || 0}</h4>
                <p className="text-[9px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-none mt-1">{label}</p>
            </div>
        </div>
    );
}
