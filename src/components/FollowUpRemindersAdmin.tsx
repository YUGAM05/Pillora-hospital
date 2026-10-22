"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, Clock, Bell, Phone, Mail, User, Stethoscope,
    Search, Plus, Filter, CheckCircle2, XCircle, AlertCircle,
    RefreshCcw, ArrowRight, MessageSquare, Edit2, AlertTriangle,
    ShieldCheck, CalendarCheck, Check, Send, RotateCcw, X, Info
} from "lucide-react";

interface Doctor {
    _id: string;
    name: string;
    specialty?: string;
    department?: string;
    fee?: number;
}

interface FollowUpReminder {
    _id: string;
    patientName: string;
    patientPhone: string;
    patientEmail?: string;
    originalAppointment?: {
        _id: string;
        bookingDate: string;
        slotTime: string;
        status: string;
        tokenNumber?: number;
    };
    doctor?: {
        _id: string;
        name: string;
        specialty?: string;
        department?: string;
    };
    doctorName: string;
    department?: string;
    followUpDate: string;
    followUpTime?: string;
    reason?: string;
    reminderTiming: '1_day_before' | '2_days_before' | '3_days_before' | 'custom';
    reminderDate: string;
    channel: 'whatsapp' | 'sms' | 'email';
    status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
    isConfirmedBooking: boolean;
    followUpAppointment?: any;
    sentAt?: string;
    failureReason?: string;
    retryCount: number;
    notes?: string;
    createdAt: string;
}

interface Stats {
    total: number;
    upcoming: number;
    today: number;
    sent: number;
    failed: number;
    cancelled: number;
}

interface FollowUpRemindersAdminProps {
    doctors?: Doctor[];
    // Initial prefill when opened from an appointment row
    prefillData?: {
        patientName?: string;
        patientPhone?: string;
        patientEmail?: string;
        originalAppointmentId?: string;
        doctorId?: string;
        doctorName?: string;
        department?: string;
    } | null;
    onClosePrefillModal?: () => void;
}

export default function FollowUpRemindersAdmin({
    doctors = [],
    prefillData = null,
    onClosePrefillModal
}: FollowUpRemindersAdminProps) {
    const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        upcoming: 0,
        today: 0,
        sent: 0,
        failed: 0,
        cancelled: 0
    });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'upcoming' | 'today' | 'sent' | 'failed' | 'cancelled'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [channelFilter, setChannelFilter] = useState('all');
    const [doctorFilter, setDoctorFilter] = useState('all');

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<FollowUpReminder | null>(null);
    const [convertModalReminder, setConvertModalReminder] = useState<FollowUpReminder | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [formPatientName, setFormPatientName] = useState('');
    const [formPatientPhone, setFormPatientPhone] = useState('');
    const [formPatientEmail, setFormPatientEmail] = useState('');
    const [formDoctorId, setFormDoctorId] = useState('');
    const [formDoctorName, setFormDoctorName] = useState('');
    const [formDepartment, setFormDepartment] = useState('');
    const [formFollowUpDate, setFormFollowUpDate] = useState('');
    const [formFollowUpTime, setFormFollowUpTime] = useState('');
    const [formReason, setFormReason] = useState('');
    const [formReminderTiming, setFormReminderTiming] = useState<'1_day_before' | '2_days_before' | '3_days_before' | 'custom'>('1_day_before');
    const [formCustomReminderDate, setFormCustomReminderDate] = useState('');
    const [formChannel, setFormChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
    const [formIsConfirmedBooking, setFormIsConfirmedBooking] = useState(false);
    const [formOriginalAppointmentId, setFormOriginalAppointmentId] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formError, setFormError] = useState('');

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Calculate tomorrow's date string YYYY-MM-DD for min date
    const tomorrowStr = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    })();

    // Fetch reminders
    const fetchReminders = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { tab };
            if (searchQuery.trim()) params.search = searchQuery.trim();
            if (channelFilter !== 'all') params.channel = channelFilter;
            if (doctorFilter !== 'all') params.doctorId = doctorFilter;

            const res = await api.get('/hospital/dashboard/follow-ups', { params });
            if (res.data.success) {
                setReminders(res.data.reminders || []);
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err: any) {
            console.error('Failed to fetch follow-ups:', err);
            showToast('Failed to load follow-up reminders', 'error');
        } finally {
            setLoading(false);
        }
    }, [tab, searchQuery, channelFilter, doctorFilter]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    // Handle prefillData passed from parent (e.g. clicking "Schedule Follow-Up" on an appointment row)
    useEffect(() => {
        if (prefillData) {
            setEditingReminder(null);
            setFormPatientName(prefillData.patientName || '');
            setFormPatientPhone(prefillData.patientPhone || '');
            setFormPatientEmail(prefillData.patientEmail || '');
            setFormOriginalAppointmentId(prefillData.originalAppointmentId || '');
            setFormDoctorId(prefillData.doctorId || '');
            setFormDoctorName(prefillData.doctorName || '');
            setFormDepartment(prefillData.department || '');
            
            // Default follow-up date to 5 days from today
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 5);
            setFormFollowUpDate(defaultDate.toISOString().split('T')[0]);
            setFormFollowUpTime('10:00');
            setFormReason('Routine Follow-Up Consultation');
            setFormReminderTiming('1_day_before');
            setFormChannel('whatsapp');
            setFormIsConfirmedBooking(false);
            setFormNotes('');
            setFormError('');
            setModalOpen(true);
        }
    }, [prefillData]);

    // Open modal for fresh creation
    const handleOpenCreateModal = () => {
        setEditingReminder(null);
        setFormPatientName('');
        setFormPatientPhone('');
        setFormPatientEmail('');
        setFormOriginalAppointmentId('');
        setFormDoctorId(doctors.length > 0 ? doctors[0]._id : '');
        setFormDoctorName(doctors.length > 0 ? doctors[0].name : '');
        setFormDepartment(doctors.length > 0 ? doctors[0].specialty || doctors[0].department || '' : '');
        
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 5);
        setFormFollowUpDate(defaultDate.toISOString().split('T')[0]);
        setFormFollowUpTime('10:00');
        setFormReason('');
        setFormReminderTiming('1_day_before');
        setFormChannel('whatsapp');
        setFormIsConfirmedBooking(false);
        setFormNotes('');
        setFormError('');
        setModalOpen(true);
    };

    // Open modal for editing
    const handleOpenEditModal = (reminder: FollowUpReminder) => {
        setEditingReminder(reminder);
        setFormPatientName(reminder.patientName);
        setFormPatientPhone(reminder.patientPhone);
        setFormPatientEmail(reminder.patientEmail || '');
        setFormOriginalAppointmentId(reminder.originalAppointment?._id || '');
        setFormDoctorId(reminder.doctor?._id || '');
        setFormDoctorName(reminder.doctorName);
        setFormDepartment(reminder.department || '');
        setFormFollowUpDate(reminder.followUpDate ? new Date(reminder.followUpDate).toISOString().split('T')[0] : '');
        setFormFollowUpTime(reminder.followUpTime || '');
        setFormReason(reminder.reason || '');
        setFormReminderTiming(reminder.reminderTiming || '1_day_before');
        setFormChannel(reminder.channel || 'whatsapp');
        setFormIsConfirmedBooking(reminder.isConfirmedBooking);
        setFormNotes(reminder.notes || '');
        setFormError('');
        setModalOpen(true);
    };

    const handleDoctorSelectChange = (docId: string) => {
        setFormDoctorId(docId);
        const doc = doctors.find(d => d._id === docId);
        if (doc) {
            setFormDoctorName(doc.name);
            setFormDepartment(doc.department || doc.specialty || '');
        }
    };

    // Submit reminder (Create or Update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formPatientName.trim()) {
            setFormError('Patient name is required');
            return;
        }

        const cleanPhone = formPatientPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            setFormError('Please enter a valid 10-digit mobile number');
            return;
        }

        if (!formFollowUpDate) {
            setFormError('Follow-up date is required');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                patientName: formPatientName.trim(),
                patientPhone: formPatientPhone.trim(),
                patientEmail: formPatientEmail.trim() || undefined,
                originalAppointmentId: formOriginalAppointmentId || undefined,
                doctorId: formDoctorId || undefined,
                doctorName: formDoctorName || 'Consultant Doctor',
                department: formDepartment || undefined,
                followUpDate: formFollowUpDate,
                followUpTime: formFollowUpTime || undefined,
                reason: formReason.trim() || undefined,
                reminderTiming: formReminderTiming,
                customReminderDate: formReminderTiming === 'custom' ? formCustomReminderDate : undefined,
                channel: formChannel,
                isConfirmedBooking: formIsConfirmedBooking,
                notes: formNotes.trim() || undefined
            };

            if (editingReminder) {
                await api.put(`/hospital/dashboard/follow-ups/${editingReminder._id}`, payload);
                showToast('Follow-up reminder updated successfully', 'success');
            } else {
                await api.post('/hospital/dashboard/follow-ups', payload);
                showToast('Follow-up reminder scheduled successfully', 'success');
            }

            setModalOpen(false);
            if (onClosePrefillModal) onClosePrefillModal();
            fetchReminders();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save follow-up reminder');
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel reminder
    const handleCancelReminder = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled follow-up reminder?')) return;
        setActionLoadingId(id);
        try {
            await api.put(`/hospital/dashboard/follow-ups/${id}/cancel`);
            showToast('Reminder cancelled', 'success');
            fetchReminders();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to cancel reminder', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Retry sending failed reminder
    const handleRetryReminder = async (id: string) => {
        setActionLoadingId(id);
        try {
            const res = await api.post(`/hospital/dashboard/follow-ups/${id}/retry`);
            if (res.data.success) {
                showToast('Reminder notification delivered successfully!', 'success');
            } else {
                showToast(res.data.message || 'Retry delivery failed', 'error');
            }
            fetchReminders();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Retry failed', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Convert Recommended Follow-Up to Confirmed Appointment
    const handleConfirmBooking = async (reminder: FollowUpReminder) => {
        if (!confirm(`Mark follow-up for ${reminder.patientName} on ${new Date(reminder.followUpDate).toLocaleDateString()} as a Confirmed Appointment?`)) {
            return;
        }
        setActionLoadingId(reminder._id);
        try {
            await api.post(`/hospital/dashboard/follow-ups/${reminder._id}/convert-booking`, {
                slotTime: reminder.followUpDate
            });
            showToast('Follow-up converted to confirmed appointment!', 'success');
            fetchReminders();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to convert to confirmed appointment', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Calculated reminder preview text
    const getReminderPreviewText = () => {
        if (!formFollowUpDate) return 'Select a follow-up date to see reminder timing preview.';
        const d = new Date(formFollowUpDate);
        let daysSub = 1;
        if (formReminderTiming === '2_days_before') daysSub = 2;
        if (formReminderTiming === '3_days_before') daysSub = 3;

        if (formReminderTiming === 'custom') {
            return formCustomReminderDate 
                ? `Custom reminder scheduled for ${new Date(formCustomReminderDate).toLocaleString()}`
                : 'Select your custom reminder date & time';
        }

        d.setDate(d.getDate() - daysSub);
        return `Notification will be sent on ${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at 09:00 AM IST (${daysSub} day${daysSub > 1 ? 's' : ''} prior).`;
    };

    return (
        <div className="space-y-6">
            {/* Toast feedback */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 border animate-bounce ${
                    toast.type === 'success' 
                        ? 'bg-emerald-500 text-white border-emerald-400' 
                        : 'bg-rose-500 text-white border-rose-400'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* Header with Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5">
                <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                            Patient Follow-Up Reminders
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Schedule automatic reminders for walk-in visits and online appointments. Reminders dispatch automatically via WhatsApp, SMS, or Email.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-600/20 transition-all shrink-0"
                >
                    <Plus className="w-4 h-4" /> Schedule Follow-Up
                </button>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div 
                    onClick={() => setTab('all')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        tab === 'all' 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-slate-300 text-slate-900'
                    }`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Total</span>
                    <span className="text-2xl font-black mt-1 block">{stats.total}</span>
                </div>

                <div 
                    onClick={() => setTab('upcoming')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        tab === 'upcoming' 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-blue-200 text-slate-900'
                    }`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Upcoming</span>
                    <span className="text-2xl font-black mt-1 block text-blue-500 group-hover:text-blue-600">{stats.upcoming}</span>
                </div>

                <div 
                    onClick={() => setTab('today')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        tab === 'today' 
                            ? 'bg-amber-500 text-white border-amber-500 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-amber-200 text-slate-900'
                    }`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Due Today</span>
                    <span className="text-2xl font-black mt-1 block text-amber-500">{stats.today}</span>
                </div>

                <div 
                    onClick={() => setTab('sent')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        tab === 'sent' 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-emerald-200 text-slate-900'
                    }`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Delivered</span>
                    <span className="text-2xl font-black mt-1 block text-emerald-600">{stats.sent}</span>
                </div>

                <div 
                    onClick={() => setTab('failed')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        tab === 'failed' 
                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-rose-200 text-slate-900'
                    }`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Failed</span>
                    <span className="text-2xl font-black mt-1 block text-rose-600">{stats.failed}</span>
                </div>

                <div 
                    onClick={() => setTab('cancelled')}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        tab === 'cancelled' 
                            ? 'bg-slate-700 text-white border-slate-700 shadow-lg' 
                            : 'bg-white border-slate-100 hover:border-slate-300 text-slate-900'
                    }`}
                >
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Cancelled</span>
                    <span className="text-2xl font-black mt-1 block text-slate-400">{stats.cancelled}</span>
                </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search patient, phone, doctor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <select
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors"
                    >
                        <option value="all">All Channels</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                    </select>

                    <select
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors max-w-[180px] truncate"
                    >
                        <option value="all">All Doctors</option>
                        {doctors.map(doc => (
                            <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchReminders}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Reminders List View */}
            {loading ? (
                <div className="bg-white p-12 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center">
                    <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading reminders...</p>
                </div>
            ) : reminders.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 opacity-60" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">No Follow-Up Reminders Found</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-md mx-auto mb-6">
                        {tab === 'upcoming' 
                            ? 'No upcoming follow-up reminders scheduled. Click below to set one for a patient.' 
                            : 'No reminders match your current tab or filter criteria.'}
                    </p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                    >
                        <Plus className="w-4 h-4 inline mr-1" /> Schedule Follow-Up
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-900/5 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/70 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Doctor / Dept</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Follow-Up Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reminder Scheduled</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reminders.map((rem) => {
                                    const followUpD = new Date(rem.followUpDate);
                                    const reminderD = new Date(rem.reminderDate);

                                    return (
                                        <tr key={rem._id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Patient */}
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 text-sm">{rem.patientName}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                                    <Phone className="w-3 h-3 text-slate-400" />
                                                    <span>{rem.patientPhone}</span>
                                                </div>
                                                {rem.originalAppointment && (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">
                                                        Ref Visit: #{rem.originalAppointment._id.slice(-6)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Doctor */}
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800 text-sm">Dr. {rem.doctorName}</p>
                                                <p className="text-[11px] font-semibold text-blue-600 mt-0.5">{rem.department || 'General Medicine'}</p>
                                                {rem.reason && (
                                                    <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5" title={rem.reason}>
                                                        &ldquo;{rem.reason}&rdquo;
                                                    </p>
                                                )}
                                            </td>

                                            {/* Follow-Up Date */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    <span>{followUpD.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                {rem.followUpTime && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-0.5">
                                                        <Clock className="w-3 h-3 text-slate-400" />
                                                        <span>{rem.followUpTime}</span>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Reminder Scheduled */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>{reminderD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">{reminderD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mt-0.5">
                                                    {rem.reminderTiming.replace(/_/g, ' ')}
                                                </span>
                                            </td>

                                            {/* Mode */}
                                            <td className="px-6 py-4">
                                                {rem.isConfirmedBooking ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                        <Check className="w-3 h-3" /> Confirmed Appt
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider">
                                                        <Info className="w-3 h-3" /> Recommended
                                                    </span>
                                                )}
                                            </td>

                                            {/* Channel */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    rem.channel === 'whatsapp'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : rem.channel === 'sms'
                                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    {rem.channel === 'whatsapp' && <MessageSquare className="w-3 h-3" />}
                                                    {rem.channel === 'sms' && <Phone className="w-3 h-3" />}
                                                    {rem.channel === 'email' && <Mail className="w-3 h-3" />}
                                                    {rem.channel}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    rem.status === 'sent'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                        : rem.status === 'scheduled'
                                                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                        : rem.status === 'failed'
                                                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {rem.status}
                                                </span>
                                                {rem.status === 'failed' && rem.failureReason && (
                                                    <span className="block text-[8px] text-rose-500 truncate max-w-[120px] mx-auto mt-0.5" title={rem.failureReason}>
                                                        {rem.failureReason}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Convert to confirmed booking */}
                                                    {!rem.isConfirmedBooking && rem.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleConfirmBooking(rem)}
                                                            disabled={actionLoadingId === rem._id}
                                                            title="Convert to Confirmed Appointment"
                                                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                        >
                                                            <CalendarCheck className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Retry if failed */}
                                                    {rem.status === 'failed' && (
                                                        <button
                                                            onClick={() => handleRetryReminder(rem._id)}
                                                            disabled={actionLoadingId === rem._id}
                                                            title="Retry Sending Notification"
                                                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                        >
                                                            <RotateCcw className={`w-4 h-4 ${actionLoadingId === rem._id ? 'animate-spin' : ''}`} />
                                                        </button>
                                                    )}

                                                    {/* Edit / Reschedule */}
                                                    {rem.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => handleOpenEditModal(rem)}
                                                            title="Edit / Reschedule"
                                                            className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {/* Cancel */}
                                                    {rem.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleCancelReminder(rem._id)}
                                                            disabled={actionLoadingId === rem._id}
                                                            title="Cancel Reminder"
                                                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {reminders.map((rem) => {
                            const followUpD = new Date(rem.followUpDate);
                            const reminderD = new Date(rem.reminderDate);

                            return (
                                <div key={rem._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-bold text-slate-900 text-base">{rem.patientName}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                <span>{rem.patientPhone}</span>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            rem.status === 'sent'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                : rem.status === 'scheduled'
                                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                                : rem.status === 'failed'
                                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {rem.status}
                                        </span>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-bold uppercase text-[9px]">Doctor</span>
                                            <span className="font-bold text-slate-800">Dr. {rem.doctorName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-bold uppercase text-[9px]">Follow-Up</span>
                                            <span className="font-bold text-blue-600">
                                                {followUpD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {rem.followUpTime ? ` (${rem.followUpTime})` : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400 font-bold uppercase text-[9px]">Reminder</span>
                                            <span className="font-bold text-amber-600">
                                                {reminderD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {reminderD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {rem.reason && (
                                            <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-600 italic">
                                                &ldquo;{rem.reason}&rdquo;
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="flex items-center gap-2">
                                            {rem.isConfirmedBooking ? (
                                                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Confirmed</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Recommended</span>
                                            )}
                                            <span className="text-[9px] font-black uppercase text-slate-400">{rem.channel}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {!rem.isConfirmedBooking && rem.status === 'scheduled' && (
                                                <button
                                                    onClick={() => handleConfirmBooking(rem)}
                                                    className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-200"
                                                >
                                                    Confirm Appt
                                                </button>
                                            )}
                                            {rem.status === 'failed' && (
                                                <button
                                                    onClick={() => handleRetryReminder(rem._id)}
                                                    className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-lg border border-rose-200"
                                                >
                                                    Retry
                                                </button>
                                            )}
                                            {rem.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleOpenEditModal(rem)}
                                                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {rem.status === 'scheduled' && (
                                                <button
                                                    onClick={() => handleCancelReminder(rem._id)}
                                                    className="p-1.5 bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg text-xs"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Schedule / Edit Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative my-8"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">
                                            {editingReminder ? 'Edit Follow-Up Reminder' : 'Schedule Patient Follow-Up'}
                                        </h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                            Walk-in visits & Online appointments
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setModalOpen(false);
                                        if (onClosePrefillModal) onClosePrefillModal();
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {formError && (
                                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-bold">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Patient Contact Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Patient Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formPatientName}
                                            onChange={(e) => setFormPatientName(e.target.value)}
                                            placeholder="e.g. Ramesh Patel"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Mobile Number (10 Digits) *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={formPatientPhone}
                                            onChange={(e) => setFormPatientPhone(e.target.value)}
                                            placeholder="e.g. 9876543210"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Patient Email (Optional) */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                        Email Address (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={formPatientEmail}
                                        onChange={(e) => setFormPatientEmail(e.target.value)}
                                        placeholder="patient@example.com (Required if Email channel selected)"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                {/* Doctor and Department */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Attending Doctor
                                        </label>
                                        {doctors.length > 0 ? (
                                            <select
                                                value={formDoctorId}
                                                onChange={(e) => handleDoctorSelectChange(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                            >
                                                <option value="">Select Doctor</option>
                                                {doctors.map(d => (
                                                    <option key={d._id} value={d._id}>Dr. {d.name} ({d.specialty || 'General'})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={formDoctorName}
                                                onChange={(e) => setFormDoctorName(e.target.value)}
                                                placeholder="Doctor Name"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Specialty / Department
                                        </label>
                                        <input
                                            type="text"
                                            value={formDepartment}
                                            onChange={(e) => setFormDepartment(e.target.value)}
                                            placeholder="e.g. Cardiology, OPD"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Follow-Up Date & Preferred Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Follow-Up Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={tomorrowStr}
                                            value={formFollowUpDate}
                                            onChange={(e) => setFormFollowUpDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                            Preferred Time (Optional)
                                        </label>
                                        <input
                                            type="time"
                                            value={formFollowUpTime}
                                            onChange={(e) => setFormFollowUpTime(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Reason for Follow-Up & Quick Pills */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Reason for Follow-Up
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={formReason}
                                        onChange={(e) => setFormReason(e.target.value)}
                                        placeholder="e.g. Routine checkup, review lab reports, suture removal..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all mb-2"
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            'Routine Checkup',
                                            'Review Lab Reports',
                                            'Post-Op Follow-Up',
                                            'Suture Removal',
                                            'Medication Review',
                                            'BP / Sugar Monitoring'
                                        ].map((chip) => (
                                            <button
                                                key={chip}
                                                type="button"
                                                onClick={() => setFormReason(chip)}
                                                className="text-[10px] font-extrabold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                            >
                                                + {chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reminder Timing Selection */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                        Reminder Notification Timing
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { key: '1_day_before', label: '1 Day Before' },
                                            { key: '2_days_before', label: '2 Days Before' },
                                            { key: '3_days_before', label: '3 Days Before' },
                                            { key: 'custom', label: 'Custom Time' }
                                        ].map((timing) => (
                                            <button
                                                key={timing.key}
                                                type="button"
                                                onClick={() => setFormReminderTiming(timing.key as any)}
                                                className={`py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all ${
                                                    formReminderTiming === timing.key
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {timing.label}
                                            </button>
                                        ))}
                                    </div>

                                    {formReminderTiming === 'custom' && (
                                        <div className="mt-3">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                                Select Custom Date & Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required={formReminderTiming === 'custom'}
                                                value={formCustomReminderDate}
                                                onChange={(e) => setFormCustomReminderDate(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Preview banner */}
                                    <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-900 font-medium leading-relaxed">
                                            {getReminderPreviewText()}
                                        </p>
                                    </div>
                                </div>

                                {/* Notification Channel */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                                        Delivery Channel
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, badge: 'Recommended' },
                                            { key: 'sms', label: 'SMS', icon: Phone },
                                            { key: 'email', label: 'Email', icon: Mail }
                                        ].map((ch) => {
                                            const Icon = ch.icon;
                                            return (
                                                <button
                                                    key={ch.key}
                                                    type="button"
                                                    onClick={() => setFormChannel(ch.key as any)}
                                                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                                                        formChannel === ch.key
                                                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-2 ring-blue-100'
                                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span>{ch.label}</span>
                                                    {ch.badge && (
                                                        <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                                            {ch.badge}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Appointment Mode Selection */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formIsConfirmedBooking}
                                            onChange={(e) => setFormIsConfirmedBooking(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">
                                                Mark as Confirmed Appointment
                                            </span>
                                            <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                                Check this if the patient already has a confirmed slot or confirmed walk-in token. Leave unchecked for a <strong>Recommended Follow-Up</strong> reminder (no slot reserved).
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {/* Submit button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <RefreshCcw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        {submitting ? 'Saving...' : editingReminder ? 'Save Changes' : 'Schedule Reminder'}
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
