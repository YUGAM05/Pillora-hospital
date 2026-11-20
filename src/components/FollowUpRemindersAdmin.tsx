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
import { doctorLabel } from "@/lib/doctorName";

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
        
        // Default custom time to now + 10 minutes (in local time)
        const defaultCustom = new Date();
        defaultCustom.setMinutes(defaultCustom.getMinutes() + 10);
        const pad = (n: number) => String(n).padStart(2, '0');
        setFormCustomReminderDate(`${defaultCustom.getFullYear()}-${pad(defaultCustom.getMonth() + 1)}-${pad(defaultCustom.getDate())}T${pad(defaultCustom.getHours())}:${pad(defaultCustom.getMinutes())}`);

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

        // Populate custom date if present
        if (reminder.reminderDate) {
            const remD = new Date(reminder.reminderDate);
            const pad = (n: number) => String(n).padStart(2, '0');
            setFormCustomReminderDate(`${remD.getFullYear()}-${pad(remD.getMonth() + 1)}-${pad(remD.getDate())}T${pad(remD.getHours())}:${pad(remD.getMinutes())}`);
        } else {
            setFormCustomReminderDate('');
        }

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

        if (formReminderTiming === 'custom' && !formCustomReminderDate) {
            setFormError('Please select a custom reminder date & time');
            return;
        }

        let customIso: string | undefined = undefined;
        if (formReminderTiming === 'custom' && formCustomReminderDate) {
            const parsed = new Date(formCustomReminderDate);
            if (!isNaN(parsed.getTime())) {
                customIso = parsed.toISOString();
            }
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
                customReminderDate: customIso,
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
        if (!confirm(`Mark follow-up for ${reminder.patientName} on ${new Date(reminder.followUpDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} as a Confirmed Appointment?`)) {
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
        if (formReminderTiming === 'custom') {
            if (!formCustomReminderDate) return 'Select your custom reminder date & time (IST)';
            const parsed = new Date(formCustomReminderDate);
            return !isNaN(parsed.getTime())
                ? `Custom reminder scheduled for ${parsed.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} at ${parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} (IST).`
                : 'Select your custom reminder date & time';
        }

        if (!formFollowUpDate) return 'Select a follow-up date to see reminder timing preview.';
        const d = new Date(formFollowUpDate);
        let daysSub = 1;
        if (formReminderTiming === '2_days_before') daysSub = 2;
        if (formReminderTiming === '3_days_before') daysSub = 3;

        d.setDate(d.getDate() - daysSub);
        return `Notification will be sent on ${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })} at 09:00 AM IST (${daysSub} day${daysSub > 1 ? 's' : ''} prior).`;
    };

    return (
        <div>
            <div className="space-y-6">
                {/* Header with Title & Action */}
                <div className="ui-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Bell className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="ui-title">Patient follow-up reminders</h2>
                            <p className="ui-subtitle max-w-2xl">
                                Schedule automatic reminders for walk-in visits and online appointments. Reminders dispatch automatically via WhatsApp, SMS, or Email.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleOpenCreateModal}
                        className="ui-btn-primary w-full min-h-[44px] shrink-0 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" /> Schedule follow-up
                    </button>
                </div>

                {/* Stats Summary Cards (they double as the status tabs; one scrollable row on phones) */}
                <div
                    role="group"
                    aria-label="Filter reminders by status"
                    className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:p-0 xl:grid-cols-6"
                >
                    <StatTile label="Total" value={stats.total} icon={<Bell className="h-4 w-4" />} tone="slate" active={tab === 'all'} onClick={() => setTab('all')} />
                    <StatTile label="Upcoming" value={stats.upcoming} icon={<Calendar className="h-4 w-4" />} tone="blue" active={tab === 'upcoming'} onClick={() => setTab('upcoming')} />
                    <StatTile label="Due today" value={stats.today} icon={<Clock className="h-4 w-4" />} tone="amber" active={tab === 'today'} onClick={() => setTab('today')} />
                    <StatTile label="Delivered" value={stats.sent} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" active={tab === 'sent'} onClick={() => setTab('sent')} />
                    <StatTile label="Failed" value={stats.failed} icon={<AlertCircle className="h-4 w-4" />} tone="rose" active={tab === 'failed'} onClick={() => setTab('failed')} />
                    <StatTile label="Cancelled" value={stats.cancelled} icon={<XCircle className="h-4 w-4" />} tone="slate" active={tab === 'cancelled'} onClick={() => setTab('cancelled')} />
                </div>

                <section className="ui-card overflow-hidden">
                    {/* Filter Bar & Search */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
                        {/* Search */}
                        <div className="relative w-full md:max-w-sm">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search patient, phone, doctor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search reminders"
                                className="ui-input pl-10"
                            />
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 md:flex md:items-center">
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                aria-label="Filter by channel"
                                className="ui-input md:w-36 xl:w-40"
                            >
                                <option value="all">All Channels</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="sms">SMS</option>
                                <option value="email">Email</option>
                            </select>

                            <select
                                value={doctorFilter}
                                onChange={(e) => setDoctorFilter(e.target.value)}
                                aria-label="Filter by doctor"
                                className="ui-input truncate md:w-44 xl:w-52"
                            >
                                <option value="all">All Doctors</option>
                                {doctors.map(doc => (
                                    <option key={doc._id} value={doc._id}>{doctorLabel(doc)}</option>
                                ))}
                            </select>

                            <button
                                onClick={fetchReminders}
                                className="ui-btn-secondary h-11 w-11 shrink-0 px-0"
                                title="Refresh List"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Reminders List View */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16">
                            <RefreshCcw className="mb-3 h-6 w-6 animate-spin text-blue-600" />
                            <p className="text-sm text-slate-500">Loading reminders...</p>
                        </div>
                    ) : reminders.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <Bell className="h-6 w-6" />
                            </span>
                            <h3 className="text-base font-semibold text-slate-900">No follow-up reminders found</h3>
                            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                                {tab === 'upcoming'
                                    ? 'No upcoming follow-up reminders scheduled. Click below to set one for a patient.'
                                    : 'No reminders match your current tab or filter criteria.'}
                            </p>
                            <button
                                onClick={handleOpenCreateModal}
                                className="ui-btn-primary mt-5 w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4" /> Schedule follow-up
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden overflow-x-auto xl:block">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80">
                                            <th className="ui-th pl-6">Patient</th>
                                            <th className="ui-th">Doctor / Dept</th>
                                            <th className="ui-th">Follow-up date</th>
                                            <th className="ui-th">Reminder scheduled</th>
                                            <th className="ui-th">Status</th>
                                            <th className="ui-th pr-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {reminders.map((rem) => {
                                            const followUpD = new Date(rem.followUpDate);
                                            const reminderD = new Date(rem.reminderDate);

                                            return (
                                                <tr key={rem._id} className="transition-colors hover:bg-slate-50/60">
                                                    {/* Patient */}
                                                    <td className="ui-td pl-6">
                                                        <p className="font-medium text-slate-900">{rem.patientName}</p>
                                                        <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-500">
                                                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                                            <span>{rem.patientPhone}</span>
                                                        </div>
                                                        {rem.originalAppointment && (
                                                            <span className="mt-1 block text-[11px] text-slate-400">
                                                                Ref visit: #{rem.originalAppointment._id.slice(-6)}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Doctor */}
                                                    <td className="ui-td">
                                                        <p className="font-medium text-slate-800">{doctorLabel(rem.doctorName)}</p>
                                                        <p className="mt-0.5 text-xs text-slate-500">{rem.department || 'General Medicine'}</p>
                                                        {rem.reason && (
                                                            <p className="mt-1 line-clamp-2 max-w-[220px] text-xs italic text-slate-400" title={rem.reason}>
                                                                &ldquo;{rem.reason}&rdquo;
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* Follow-Up Date & mode */}
                                                    <td className="ui-td">
                                                        <div className="flex items-center gap-1.5 whitespace-nowrap font-medium text-slate-900">
                                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                            <span>{followUpD.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                        {rem.followUpTime && (
                                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                                                <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                                                                <span>{rem.followUpTime}</span>
                                                            </div>
                                                        )}
                                                        <div className="mt-2">
                                                            {rem.isConfirmedBooking ? (
                                                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                                                    <Check className="h-3 w-3" /> Confirmed appt
                                                                </span>
                                                            ) : (
                                                                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                                                                    <Info className="h-3 w-3" /> Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Reminder Scheduled & channel */}
                                                    <td className="ui-td">
                                                        <div className="flex items-center gap-1.5 whitespace-nowrap font-medium text-slate-800">
                                                            <Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                                            <span>{reminderD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</span>
                                                            <span className="text-xs font-normal text-slate-500">{reminderD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}</span>
                                                        </div>
                                                        <span className="mt-0.5 block text-xs text-slate-500">
                                                            {rem.reminderTiming.replace(/_/g, ' ')}
                                                        </span>
                                                        <div className="mt-2">
                                                            <span className="ui-badge border-slate-200 bg-white text-slate-600">
                                                                {rem.channel === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                                                                {rem.channel === 'sms' && <Phone className="h-3 w-3" />}
                                                                {rem.channel === 'email' && <Mail className="h-3 w-3" />}
                                                                {CHANNEL_LABELS[rem.channel] || rem.channel}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="ui-td">
                                                        <span className={`ui-badge capitalize ${STATUS_TONES[rem.status] || STATUS_TONES.cancelled}`}>
                                                            {rem.status}
                                                        </span>
                                                        {rem.status === 'failed' && rem.failureReason && (
                                                            <span className="mt-1 line-clamp-2 max-w-[140px] text-[11px] leading-4 text-rose-600" title={rem.failureReason}>
                                                                {rem.failureReason}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="ui-td pr-6">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Convert to confirmed booking */}
                                                            {!rem.isConfirmedBooking && rem.status === 'scheduled' && (
                                                                <button
                                                                    onClick={() => handleConfirmBooking(rem)}
                                                                    disabled={actionLoadingId === rem._id}
                                                                    title="Convert to Confirmed Appointment"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                                                                >
                                                                    <CalendarCheck className="h-4 w-4" />
                                                                </button>
                                                            )}

                                                            {/* Retry if failed */}
                                                            {rem.status === 'failed' && (
                                                                <button
                                                                    onClick={() => handleRetryReminder(rem._id)}
                                                                    disabled={actionLoadingId === rem._id}
                                                                    title="Retry Sending Notification"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                                                                >
                                                                    <RotateCcw className={`h-4 w-4 ${actionLoadingId === rem._id ? 'animate-spin' : ''}`} />
                                                                </button>
                                                            )}

                                                            {/* Edit / Reschedule */}
                                                            {rem.status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleOpenEditModal(rem)}
                                                                    title="Edit / Reschedule"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                            )}

                                                            {/* Cancel */}
                                                            {rem.status === 'scheduled' && (
                                                                <button
                                                                    onClick={() => handleCancelReminder(rem._id)}
                                                                    disabled={actionLoadingId === rem._id}
                                                                    title="Cancel Reminder"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                                                >
                                                                    <X className="h-4 w-4" />
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
                            <div className="divide-y divide-slate-100 xl:hidden">
                                {reminders.map((rem) => {
                                    const followUpD = new Date(rem.followUpDate);
                                    const reminderD = new Date(rem.reminderDate);

                                    return (
                                        <div key={rem._id} className="space-y-3 p-4 sm:p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900">{rem.patientName}</p>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                                                        <span>{rem.patientPhone}</span>
                                                    </div>
                                                </div>

                                                <span className={`ui-badge shrink-0 capitalize ${STATUS_TONES[rem.status] || STATUS_TONES.cancelled}`}>
                                                    {rem.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3 sm:gap-4">
                                                <div className="flex items-baseline justify-between gap-3 sm:block">
                                                    <span className="shrink-0 text-xs font-medium text-slate-500">Doctor</span>
                                                    <span className="min-w-0 text-right font-medium text-slate-800 sm:mt-0.5 sm:block sm:text-left">{doctorLabel(rem.doctorName)}</span>
                                                </div>
                                                <div className="flex items-baseline justify-between gap-3 sm:block">
                                                    <span className="shrink-0 text-xs font-medium text-slate-500">Follow-up</span>
                                                    <span className="min-w-0 text-right font-medium text-blue-700 sm:mt-0.5 sm:block sm:text-left">
                                                        {followUpD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        {rem.followUpTime ? ` (${rem.followUpTime})` : ''}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline justify-between gap-3 sm:block">
                                                    <span className="shrink-0 text-xs font-medium text-slate-500">Reminder</span>
                                                    <span className="min-w-0 text-right font-medium text-amber-700 sm:mt-0.5 sm:block sm:text-left">
                                                        {reminderD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} at {reminderD.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                                                    </span>
                                                </div>
                                                {rem.reason && (
                                                    <div className="border-t border-slate-200 pt-2 text-xs italic text-slate-600 sm:col-span-3">
                                                        &ldquo;{rem.reason}&rdquo;
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {rem.isConfirmedBooking ? (
                                                        <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Confirmed</span>
                                                    ) : (
                                                        <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Recommended</span>
                                                    )}
                                                    <span className="ui-badge border-slate-200 bg-white text-slate-600">{CHANNEL_LABELS[rem.channel] || rem.channel}</span>
                                                </div>

                                                <div className="flex flex-1 items-center justify-end gap-2">
                                                    {!rem.isConfirmedBooking && rem.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleConfirmBooking(rem)}
                                                            className="ui-btn flex-1 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 sm:flex-none"
                                                        >
                                                            <CalendarCheck className="h-4 w-4" /> Confirm appt
                                                        </button>
                                                    )}
                                                    {rem.status === 'failed' && (
                                                        <button
                                                            onClick={() => handleRetryReminder(rem._id)}
                                                            className="ui-btn flex-1 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 sm:flex-none"
                                                        >
                                                            <RotateCcw className="h-4 w-4" /> Retry
                                                        </button>
                                                    )}
                                                    {rem.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => handleOpenEditModal(rem)}
                                                            aria-label="Edit / Reschedule"
                                                            className="ui-btn-secondary h-10 w-10 shrink-0 px-0"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {rem.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handleCancelReminder(rem._id)}
                                                            aria-label="Cancel Reminder"
                                                            className="ui-btn-secondary h-10 w-10 shrink-0 px-0 text-slate-500 hover:text-rose-600"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* Schedule / Edit Modal */}
            <AnimatePresence>
                {modalOpen && (
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
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={editingReminder ? 'Edit follow-up reminder' : 'Schedule patient follow-up'}
                            className="ui-dialog sm:max-w-xl"
                        >
                            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Bell className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold leading-tight text-slate-900">
                                            {editingReminder ? 'Edit follow-up reminder' : 'Schedule patient follow-up'}
                                        </h3>
                                        <p className="mt-0.5 truncate text-sm text-slate-500">
                                            Walk-in visits &amp; online appointments
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalOpen(false);
                                        if (onClosePrefillModal) onClosePrefillModal();
                                    }}
                                    aria-label="Close"
                                    className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                                    {/* Patient Contact Details */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="ui-label">Patient full name *</span>
                                            <input
                                                type="text"
                                                required
                                                value={formPatientName}
                                                onChange={(e) => setFormPatientName(e.target.value)}
                                                placeholder="e.g. Ramesh Patel"
                                                className="ui-input"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="ui-label">Mobile number (10 digits) *</span>
                                            <input
                                                type="tel"
                                                required
                                                value={formPatientPhone}
                                                onChange={(e) => setFormPatientPhone(e.target.value)}
                                                placeholder="e.g. 9876543210"
                                                className="ui-input"
                                            />
                                        </label>
                                    </div>

                                    {/* Patient Email (Optional) */}
                                    <label className="block">
                                        <span className="ui-label">Email address (optional)</span>
                                        <input
                                            type="email"
                                            value={formPatientEmail}
                                            onChange={(e) => setFormPatientEmail(e.target.value)}
                                            placeholder="patient@example.com (Required if Email channel selected)"
                                            className="ui-input"
                                        />
                                    </label>

                                    {/* Doctor and Department */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="ui-label">Attending doctor</span>
                                            {doctors.length > 0 ? (
                                                <select
                                                    value={formDoctorId}
                                                    onChange={(e) => handleDoctorSelectChange(e.target.value)}
                                                    className="ui-input"
                                                >
                                                    <option value="">Select Doctor</option>
                                                    {doctors.map(d => (
                                                        <option key={d._id} value={d._id}>{doctorLabel(d)} ({d.specialty || 'General'})</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={formDoctorName}
                                                    onChange={(e) => setFormDoctorName(e.target.value)}
                                                    placeholder="Doctor Name"
                                                    className="ui-input"
                                                />
                                            )}
                                        </label>

                                        <label className="block">
                                            <span className="ui-label">Specialty / department</span>
                                            <input
                                                type="text"
                                                value={formDepartment}
                                                onChange={(e) => setFormDepartment(e.target.value)}
                                                placeholder="e.g. Cardiology, OPD"
                                                className="ui-input"
                                            />
                                        </label>
                                    </div>

                                    {/* Follow-Up Date & Preferred Time */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <label className="block">
                                            <span className="ui-label">Follow-up date *</span>
                                            <input
                                                type="date"
                                                required
                                                min={tomorrowStr}
                                                value={formFollowUpDate}
                                                onChange={(e) => setFormFollowUpDate(e.target.value)}
                                                className="ui-input"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="ui-label">Preferred time (optional)</span>
                                            <input
                                                type="time"
                                                value={formFollowUpTime}
                                                onChange={(e) => setFormFollowUpTime(e.target.value)}
                                                className="ui-input"
                                            />
                                        </label>
                                    </div>

                                    {/* Reason for Follow-Up & Quick Pills */}
                                    <div>
                                        <label className="block">
                                            <span className="ui-label">Reason for follow-up</span>
                                            <input
                                                type="text"
                                                value={formReason}
                                                onChange={(e) => setFormReason(e.target.value)}
                                                placeholder="e.g. Routine checkup, review lab reports, suture removal..."
                                                className="ui-input"
                                            />
                                        </label>
                                        <div className="mt-2 flex flex-wrap gap-1.5">
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
                                                    className="inline-flex min-h-[36px] items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:min-h-[32px]"
                                                >
                                                    + {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reminder Timing Selection */}
                                    <div>
                                        <span className="ui-label">Reminder notification timing</span>
                                        <div className="ui-segmented grid w-full grid-cols-2 gap-1 sm:grid-cols-4">
                                            {[
                                                { key: '1_day_before', label: '1 day before' },
                                                { key: '2_days_before', label: '2 days before' },
                                                { key: '3_days_before', label: '3 days before' },
                                                { key: 'custom', label: 'Custom time' }
                                            ].map((timing) => (
                                                <button
                                                    key={timing.key}
                                                    type="button"
                                                    onClick={() => setFormReminderTiming(timing.key as any)}
                                                    aria-pressed={formReminderTiming === timing.key}
                                                    className={`ui-segment min-h-[40px] ${
                                                        formReminderTiming === timing.key ? 'ui-segment-active' : ''
                                                    }`}
                                                >
                                                    {timing.label}
                                                </button>
                                            ))}
                                        </div>

                                        {formReminderTiming === 'custom' && (
                                            <label className="mt-3 block">
                                                <span className="ui-label">Select custom date &amp; time (IST)</span>
                                                <input
                                                    type="datetime-local"
                                                    required={formReminderTiming === 'custom'}
                                                    value={formCustomReminderDate}
                                                    onChange={(e) => setFormCustomReminderDate(e.target.value)}
                                                    className="ui-input"
                                                />
                                            </label>
                                        )}

                                        {/* Preview banner */}
                                        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                            <p className="text-sm leading-relaxed text-amber-900">
                                                {getReminderPreviewText()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Notification Channel */}
                                    <div>
                                        <span className="ui-label">Delivery channel</span>
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                                                        aria-pressed={formChannel === ch.key}
                                                        className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-3 text-sm font-medium transition ${
                                                            formChannel === ch.key
                                                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        <span>{ch.label}</span>
                                                        {ch.badge && (
                                                            <span className="ui-badge border-emerald-200 bg-emerald-50 px-1.5 text-emerald-700">
                                                                {ch.badge}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Appointment Mode Selection */}
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <input
                                            type="checkbox"
                                            checked={formIsConfirmedBooking}
                                            onChange={(e) => setFormIsConfirmedBooking(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
                                        />
                                        <span>
                                            <span className="block text-sm font-semibold text-slate-900">
                                                Mark as confirmed appointment
                                            </span>
                                            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                                                Check this if the patient already has a confirmed slot or confirmed walk-in token. Leave unchecked for a <strong className="font-semibold text-slate-700">Recommended Follow-Up</strong> reminder (no slot reserved).
                                            </span>
                                        </span>
                                    </label>
                                </div>

                                {/* Error + submit button (stay visible at the bottom of the dialog) */}
                                <div className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
                                    {formError && (
                                        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{formError}</span>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="ui-btn-primary w-full min-h-[48px]"
                                    >
                                        {submitting ? (
                                            <RefreshCcw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {submitting ? 'Saving...' : editingReminder ? 'Save changes' : 'Schedule reminder'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast feedback (same look as the dashboard toast) */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        role="status"
                        className={`fixed bottom-4 left-4 right-4 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:bottom-6 sm:left-auto sm:right-6 ${
                            toast.type === 'success'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                        }`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Presentational helpers ─────────────────────────────────────────────────

const STATUS_TONES: Record<string, string> = {
    scheduled: 'border-blue-200 bg-blue-50 text-blue-700',
    sent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    failed: 'border-rose-200 bg-rose-50 text-rose-700',
    cancelled: 'border-slate-200 bg-slate-100 text-slate-600',
};

const CHANNEL_LABELS: Record<string, string> = {
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    email: 'Email',
};

const TILE_TONES = {
    slate: { icon: 'bg-slate-100 text-slate-600', active: 'border-slate-400 bg-slate-50 ring-4 ring-slate-500/10' },
    blue: { icon: 'bg-blue-50 text-blue-600', active: 'border-blue-400 bg-blue-50/50 ring-4 ring-blue-500/10' },
    amber: { icon: 'bg-amber-50 text-amber-600', active: 'border-amber-400 bg-amber-50/50 ring-4 ring-amber-500/10' },
    emerald: { icon: 'bg-emerald-50 text-emerald-600', active: 'border-emerald-400 bg-emerald-50/50 ring-4 ring-emerald-500/10' },
    rose: { icon: 'bg-rose-50 text-rose-600', active: 'border-rose-400 bg-rose-50/50 ring-4 ring-rose-500/10' },
} as const;

/** Count tile (same look as the dashboard StatCard) that also works as a status tab. */
function StatTile({ label, value, icon, tone, active, onClick }: {
    label: string;
    value: number;
    icon: React.ReactNode;
    tone: keyof typeof TILE_TONES;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`ui-card w-[9.5rem] shrink-0 p-4 text-left transition sm:w-auto ${
                active ? TILE_TONES[tone].active : 'hover:border-slate-300'
            }`}
        >
            <span className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium leading-snug text-slate-500">{label}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TILE_TONES[tone].icon}`}>{icon}</span>
            </span>
            <span className="mt-1 block text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</span>
        </button>
    );
}
