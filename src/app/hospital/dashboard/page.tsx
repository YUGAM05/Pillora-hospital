"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { getToken, getUser } from "@/lib/tokenStorage";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, Activity, Calendar, Clock, Plus, Settings, 
    LogOut, User, Stethoscope, ChevronRight, CheckCircle2, 
    XCircle, AlertCircle, Info, RefreshCcw, LayoutDashboard
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
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showSlotGen, setShowSlotGen] = useState(false);

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
                                    <p className="text-blue-100 text-xs font-medium">Only admins can modify your slots.</p>
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Doctors" value={stats?.stats?.doctors} icon={<Stethoscope className="text-blue-500" />} />
                    <StatCard label="Total Bookings" value={stats?.stats?.appointments} icon={<Calendar className="text-emerald-500" />} />
                    <StatCard label="Pending Review" value={stats?.stats?.pending} icon={<Clock className="text-amber-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Doctors List */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black flex items-center gap-2">
                                <Users className="w-6 h-6 text-primary" /> Our Doctors
                            </h2>
                            {isSelfManaged && (
                                <button onClick={() => setShowAddDoctor(true)} className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {doctors.map((doc: any) => (
                                <div key={doc._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-black text-primary text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                            {doc.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{doc.name}</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{doc.specialty}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-xs font-black text-emerald-600">₹{doc.fee} / Visit</span>
                                        {isSelfManaged && (
                                            <button onClick={() => setShowSlotGen(doc)} className="text-[10px] font-black uppercase text-primary hover:underline">
                                                Manage Slots
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Appointments List */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" /> Recent Appointments
                        </h2>
                        
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Doctor</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {appointments.map((app: any) => (
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
                            <button onClick={() => setShowSlotGen(false)}><XCircle className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <SlotGenTool doctor={showSlotGen} onClose={() => { setShowSlotGen(false); fetchData(); }} />
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
