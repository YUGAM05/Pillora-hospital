"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { getToken, getUser } from "@/lib/tokenStorage";
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

    const fetchData = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                router.push("/login");
                return;
            }

            const [statsRes, doctorsRes, appointmentsRes] = await Promise.all([
                api.get("/hospital/dashboard/stats"),
                api.get("/hospital/dashboard/doctors"),
                api.get("/hospital/dashboard/appointments")
            ]);

            setStats(statsRes.data);
            setDoctors(doctorsRes.data);
            setAppointments(appointmentsRes.data);
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
                        localStorage.clear();
                        window.location.href = '/login';
                    }} className="mt-6 px-8 py-3 bg-gray-900 text-white font-bold rounded-xl">Back to Login</button>
                </div>
            </div>
        );
    }

    const isSelfManaged = stats?.management_type === 'SELF';

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
            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
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
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {doctors.map((doc: any) => (
                                <button
                                    key={doc._id}
                                    onClick={() => setShowSlotGen(doc)}
                                    className="px-5 py-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-slate-700 hover:text-blue-600 font-black rounded-2xl text-xs flex items-center gap-2.5 transition-all shadow-sm hover:shadow active:scale-95 shrink-0"
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
                        <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 shadow-sm">
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
                                    placeholder="e.g. Cardiology" 
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
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="checked-in">Checked-in</option>
                                    <option value="in-consultation">In-consultation</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Doctor / Specialty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredAppointments.map((app: any) => (
                                            <tr key={app._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{app.patient?.name}</p>
                                                    <p className="text-xs text-gray-500">{app.patient?.phone}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-700">{app.doctor?.name}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{new Date(app.slotTime).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-500">{new Date(app.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {app.status === 'pending' || app.status === 'confirmed' ? (
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
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals for Add Doctor and Slot Gen would go here */}
            {showSlotGen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
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
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black">Recruit New Doctor</h3>
                            <button onClick={() => setShowAddDoctor(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddDoctorSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Doctor Name</label>
                                <input required type="text" placeholder="Dr. Jane Smith" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialty</label>
                                <input required type="text" placeholder="Cardiologist" value={newDoctor.specialty} onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Fee (₹)</label>
                                <input required type="number" value={newDoctor.fee} onChange={e => setNewDoctor({...newDoctor, fee: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" />
                            </div>
                            <button className="w-full py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:-translate-y-1 transition-all">
                                Recruit Doctor
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showAddSpecialtyGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black">Create Specialty Group</h3>
                            <button onClick={() => setShowAddSpecialtyGroup(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddSpecialtyGroupSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
        </div>
    );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg shadow-blue-900/5 flex items-center gap-5">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">
                {icon}
            </div>
            <div>
                <h4 className="text-3xl font-black text-gray-900">{value || 0}</h4>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}
