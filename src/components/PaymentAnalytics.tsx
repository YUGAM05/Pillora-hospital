"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, IndianRupee, CreditCard, Activity, CalendarDays, RefreshCw } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";

export default function PaymentAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");

    const [summaryData, setSummaryData] = useState<any>(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError("");
        try {
            let queryParams = "";
            const today = new Date();
            let fromDate: Date | null = null;
            let toDate = new Date();

            if (dateRange === "today") {
                fromDate = new Date(today.setHours(0, 0, 0, 0));
            } else if (dateRange === "week") {
                fromDate = new Date(today.setDate(today.getDate() - 7));
            } else if (dateRange === "month") {
                fromDate = new Date(today.setMonth(today.getMonth() - 1));
            } else if (dateRange === "all" && customFrom) {
                fromDate = new Date(customFrom);
                if (customTo) toDate = new Date(customTo);
            }

            if (fromDate) {
                queryParams = `?from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}`;
            }

            const res = await api.get(`/hospital/dashboard/payments/summary${queryParams}`);
            setSummaryData(res.data);
        } catch (err: any) {
            setError("Failed to fetch payment analytics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, customFrom, customTo]);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // emerald, blue, amber, rose

    if (loading && !summaryData) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 text-red-600 rounded-[2rem] font-bold">
                {error}
                <button onClick={fetchSummary} className="ml-4 underline">Retry</button>
            </div>
        );
    }

    const { summary, chartData, paidVsPending } = summaryData;

    const pieData = [
        { name: 'Online', value: summary.online.total, count: summary.online.count },
        { name: 'Offline', value: summary.offline.total, count: summary.offline.count }
    ].filter(d => d.value > 0);

    const statusData = [
        { name: 'Paid', value: paidVsPending.paid },
        { name: 'Pending', value: paidVsPending.pending }
    ];

    return (
        <div className="space-y-8">
            {/* Header & Filters */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-7 h-7 text-emerald-500" /> Payment Analytics
                    </h2>
                    <p className="text-slate-500 font-semibold text-sm mt-1">
                        Track your hospital&apos;s revenue, payment modes, and pending dues.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button onClick={() => setDateRange("today")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${dateRange === "today" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Today</button>
                    <button onClick={() => setDateRange("week")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${dateRange === "week" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Last 7 Days</button>
                    <button onClick={() => setDateRange("month")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${dateRange === "month" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Last 30 Days</button>
                    <button onClick={() => setDateRange("all")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${dateRange === "all" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>All Time / Custom</button>
                    <button onClick={fetchSummary} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors ml-2" title="Refresh">
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {dateRange === "all" && (
                <div className="flex gap-4 items-center px-2">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">From:</label>
                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="p-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">To:</label>
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="p-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500" />
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><IndianRupee className="w-24 h-24" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black text-slate-900">₹{summary.totalRevenue.toLocaleString()}</h3>
                    <p className="text-sm font-bold text-emerald-500 mt-2">{summary.online.count + summary.offline.count} total payments</p>
                </div>
                
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><CreditCard className="w-24 h-24" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Online Payments</p>
                    <h3 className="text-3xl font-black text-blue-600">₹{summary.online.total.toLocaleString()}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-2">{summary.online.count} transactions</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><IndianRupee className="w-24 h-24" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Offline (Cash)</p>
                    <h3 className="text-3xl font-black text-emerald-600">₹{summary.offline.total.toLocaleString()}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-2">{summary.offline.count} transactions</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><CalendarDays className="w-24 h-24" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Pending Dues</p>
                    <h3 className="text-3xl font-black text-amber-500">{summary.pending.count}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-2">unpaid bookings</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Over Time Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Revenue Over Time</h3>
                    <div className="h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} dx={-10} tickFormatter={(value) => `₹${value}`} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                                    <Bar dataKey="online" name="Online" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="offline" name="Offline (Cash)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-bold">No revenue data for this period</div>
                        )}
                    </div>
                </div>

                <div className="space-y-6 flex flex-col">
                    {/* Payment Mode Pie Chart */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex-1 flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 mb-2">Payment Modes</h3>
                        <div className="flex-1 min-h-[200px] relative">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === 'Online' ? '#3b82f6' : '#10b981'} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm">No data</div>
                            )}
                        </div>
                    </div>

                    {/* Paid vs Pending Bar */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex-1 flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 mb-2">Collection Status</h3>
                        <div className="flex-1 min-h-[150px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'Paid' ? '#10b981' : '#f59e0b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
