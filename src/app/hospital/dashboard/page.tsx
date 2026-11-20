"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { getToken, getUser, clearAuth } from "@/lib/tokenStorage";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Activity, Calendar, CalendarClock, Clock, Plus, Settings,
    User, UserPlus, Stethoscope, CheckCircle2, Check, ChevronDown,
    XCircle, X, AlertCircle, Info, RefreshCcw, LayoutDashboard,
    Download, CreditCard, IndianRupee, Bell, BellRing, ShieldAlert,
    Landmark, SlidersHorizontal, FileText, Trash2, PhoneCall
} from "lucide-react";
import SlotGenTool from "@/components/SlotGenTool";

import PatientSearchAdmin from "@/components/PatientSearchAdmin";
import PaymentAnalytics from "@/components/PaymentAnalytics";
import PaymentsAndCollections from "@/components/PaymentsAndCollections";
import HospitalSettlements from "@/components/HospitalSettlements";
import FollowUpRemindersAdmin from "@/components/FollowUpRemindersAdmin";
import HospitalSubscriptionDashboard from "@/components/HospitalSubscriptionDashboard";
import UsagePanel, { UsageWarningBanner } from "@/components/UsagePanel";
import HospitalSettingsModule from "@/components/HospitalSettingsModule";
import { initWebPush } from "@/lib/webPush";
import { doctorLabel, doctorShortLabel } from "@/lib/doctorName";
import { planLabel } from "@/lib/plans";

export default function HospitalDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);
    
    // Analytics States
    const [cancellationRate, setCancellationRate] = useState<any>(null);

    // Tabs & Filters
    const [doctorTab, setDoctorTab] = useState<"individual" | "group">("individual");
    const [filterDate, setFilterDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterSpecialty, setFilterSpecialty] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterDoctor, setFilterDoctor] = useState("");

    // Recruit Doctor States
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [showSlotGen, setShowSlotGen] = useState<any>(null);
    const [newDoctor, setNewDoctor] = useState({ name: "", email: "", phone: "", specialty: "", fee: 200 });

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
    const [activeMainTab, setActiveMainTab] = useState<"appointments" | "slots" | "patients" | "payments" | "settlements" | "followups" | "subscription" | "settings">("appointments");
    const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
    const [subscriptionData, setSubscriptionData] = useState<any>(null);
    const [followUpPrefillData, setFollowUpPrefillData] = useState<any>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [slots, setSlots] = useState<any[]>([]);
    const [activeSlotSubTab, setActiveSlotSubTab] = useState<"upcoming" | "cancelled">("upcoming");
    // Date filter for Proactive Slot Management — persists across sub-tab switches
    const [slotDateFilter, setSlotDateFilter] = useState<string>("");

    // Patient Records States
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedPatientName, setSelectedPatientName] = useState<string>("");
    const [patientNotes, setPatientNotes] = useState<any[]>([]);
    const [newNoteContent, setNewNoteContent] = useState("");

    // Invoice States
    const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);

    // Payment badge states
    const [paymentUpdatingId, setPaymentUpdatingId] = useState<string | null>(null);
    const [openPaymentDropdown, setOpenPaymentDropdown] = useState<string | null>(null);

    // Payment Modal states
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [paymentMode, setPaymentMode] = useState<"online" | "offline">("offline");
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    // Toast notification
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Push Notification Diagnostic States
    const [pushStatus, setPushStatus] = useState<string>("Checking...");

    const checkPushPermission = useCallback(async () => {
        if (typeof window === 'undefined') return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPushStatus("Not Supported");
            return;
        }

        if (Notification.permission === 'denied') {
            setPushStatus("Blocked");
            return;
        }

        if (Notification.permission === 'default') {
            setPushStatus("Setup Required");
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                setPushStatus("Active");
            } else {
                setPushStatus("Setup Required");
            }
        } catch (err) {
            setPushStatus("Inactive");
        }
    }, []);

    const handleEnableNotifications = async () => {
        if (!stats?.stats?.hospital?._id) return;
        setPushStatus("Enabling...");
        try {
            await initWebPush(stats.stats.hospital._id);
            await checkPushPermission();
            showToast("Real-time notifications enabled!", "success");
        } catch (err: any) {
            console.error('[EnablePushError]', err.message);
            showToast(err.message || "Failed to subscribe.", "error");
            await checkPushPermission();
        }
    };

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
    const [manualPaymentMethod, setManualPaymentMethod] = useState("cash");
    const [manualBookingNotes, setManualBookingNotes] = useState("");

    const isSubscriptionActive = !subscriptionData?.hospital || subscriptionData.hospital.subscriptionStatus === 'Active' || subscriptionData.hospital.subscriptionStatus === 'Expiring Soon';
    const restrictionMessage = "Your Pillora subscription has expired or your payment is pending. Please contact the Pillora Admin to renew your subscription before generating new appointment slots.";

    const handleAddSlotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSubscriptionActive) {
            alert(restrictionMessage);
            return;
        }
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
            alert(err.response?.data?.message || restrictionMessage);
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

    const handleScheduleFollowUpFromAppointment = (app: any) => {
        setFollowUpPrefillData({
            patientName: app.patient?.name || app.patientName || '',
            patientPhone: app.patient?.phone || app.patientPhone || '',
            patientEmail: app.patient?.email || app.patientEmail || '',
            originalAppointmentId: app._id,
            doctorId: app.doctor?._id || '',
            doctorName: app.doctor?.name || '',
            department: app.doctor?.specialty || app.doctor?.department || ''
        });
        setActiveMainTab("followups");
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
            setNewDoctor({ name: "", email: "", phone: "", specialty: "", fee: 200 });
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
                paymentStatus: manualPaymentStatus,
                paymentMethod: manualPaymentMethod
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
            setManualPaymentMethod("cash");
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to book manual appointment");
        }
    };

    const handleDeleteDoctor = async (doc: any) => {
        if (!window.confirm(`Are you sure you want to completely delete ${doc.isSpecialtyGroup ? 'Specialty Group: ' : 'Dr. '}${doc.name}? All associated slots and active appointments will also be deleted!`)) {
            return;
        }
        try {
            await api.delete(`/hospital/dashboard/doctors/${doc._id}`);
            alert(`${doc.isSpecialtyGroup ? 'Specialty Group' : 'Doctor'} deleted successfully!`);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete doctor");
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) {
                window.location.replace("/login");
                return;
            }

            const [statsRes, doctorsRes, appointmentsRes, slotsRes, subRes] = await Promise.all([
                api.get("/hospital/dashboard/stats"),
                api.get("/hospital/dashboard/doctors"),
                api.get("/hospital/dashboard/appointments"),
                api.get("/hospital/dashboard/slots"),
                api.get("/hospital/dashboard/subscription").catch(err => {
                    console.error("Failed to load subscription in dashboard", err);
                    return { data: null };
                })
            ]);

            setStats(statsRes.data);
            setDoctors(doctorsRes.data);
            setAppointments(appointmentsRes.data);
            setSlots(slotsRes.data);
            if (subRes?.data) {
                setSubscriptionData(subRes.data);
            }

            // Fetch pending settlements for instant notification banner and badge
            api.get("/settlements/hospital/history").then((res) => {
                if (res.data?.success) {
                    const pending = (res.data.settlements || []).filter((s: any) => s.status === 'Awaiting Hospital Confirmation');
                    setPendingSettlements(pending);
                }
            }).catch(() => {});
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
    }, []);

    // Light refresh of appointments + slots only. Bookings also arrive from
    // outside this page (patients online, the AI phone receptionist), and live
    // socket updates don't work on the serverless backend, so poll instead.
    const refreshAppointments = useCallback(async () => {
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
        if (!getToken()) return;
        try {
            const [appointmentsRes, slotsRes] = await Promise.all([
                api.get("/hospital/dashboard/appointments"),
                api.get("/hospital/dashboard/slots"),
            ]);
            setAppointments(appointmentsRes.data);
            setSlots(slotsRes.data);
        } catch {
            /* keep showing the last data; the next refresh will retry */
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(refreshAppointments, 30 * 1000);
        const onVisible = () => document.visibilityState === "visible" && refreshAppointments();
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [refreshAppointments]);

    const fetchAnalytics = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;
            const rateRes = await api.get("/hospital/dashboard/analytics/cancellation-rate");
            setCancellationRate(rateRes.data);
        } catch (err) {
            console.error("Failed to fetch analytics");
        }
    }, []);

    useEffect(() => {
        const u = getUser();
        if (u && u.role !== 'hospital') {
            window.location.replace("/");
            return;
        }
        setUser(u);
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab");
            if (tab && ["appointments", "slots", "patients", "payments", "settlements", "followups", "subscription", "settings"].includes(tab)) {
                setActiveMainTab(tab as any);
            }
        }
        fetchData();
        fetchAnalytics();

        const interval = setInterval(() => {
            fetchAnalytics();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchData, fetchAnalytics, router]);

    useEffect(() => {
        if (stats?.stats?.hospital?._id) {
            checkPushPermission();
            // Silent init sync if permission is already granted
            if (Notification.permission === 'granted') {
                initWebPush(stats.stats.hospital._id)
                    .then(() => checkPushPermission())
                    .catch((err) => console.warn('Silent push sync failed:', err.message));
            }
        }
    }, [stats, checkPushPermission]);

    const filteredAppointments = appointments.filter((app: any) => {
        const appDateStr = app.slotTime ? new Date(app.slotTime).toISOString().split('T')[0] : "";
        
        if (filterDate && appDateStr !== filterDate) return false;
        
        if (startDate && appDateStr < startDate) return false;
        if (endDate && appDateStr > endDate) return false;

        if (filterSpecialty && !app.doctor?.specialty?.toLowerCase().includes(filterSpecialty.toLowerCase())) return false;

        if (filterDoctor && app.doctor?._id !== filterDoctor) return false;

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
                `"${new Date(app.slotTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
                `"${timeSlot}"`,
                `"${new Date(app.bookingDate || app.createdAt || Date.now()).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
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

    const handleAssignDoctor = async (id: string, doctorId: string) => {
        if (!doctorId) return;
        try {
            await api.put(`/hospital/dashboard/appointments/${id}/assign-doctor`, { doctorId });
            fetchData();
            alert("Doctor assigned successfully");
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to assign doctor");
        }
    };

    const handleViewRecords = async (patientId: string, patientName: string) => {
        if (!patientId) {
            alert("This patient is a guest or not fully registered.");
            return;
        }
        setSelectedPatientId(patientId);
        setSelectedPatientName(patientName);
        try {
            const res = await api.get(`/hospital/dashboard/patients/${patientId}/notes`);
            setPatientNotes(res.data);
        } catch (err) {
            alert("Failed to fetch patient records");
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId || !newNoteContent.trim()) return;
        try {
            const res = await api.post(`/hospital/dashboard/patients/${selectedPatientId}/notes`, {
                note: newNoteContent
            });
            setPatientNotes([res.data, ...patientNotes]);
            setNewNoteContent("");
        } catch (err) {
            alert("Failed to add note");
        }
    };

    const handlePaymentStatusUpdate = async (appointmentId: string, status: 'unpaid' | 'paid' | 'waived') => {
        setOpenPaymentDropdown(null);
        const app = appointments.find((a: any) => a._id === appointmentId);
        const prev = app?.paymentStatus;

        if (status === 'paid') {
            if (prev === 'paid') {
                if (!confirm("This booking is already marked as paid. Do you want to update the payment?")) return;
            }
            setSelectedAppointmentId(appointmentId);
            setPaymentAmount(app?.paymentDetails?.amount || app?.doctor?.fee || 500);
            setPaymentMode(app?.paymentDetails?.mode || "offline");
            setPaymentModalOpen(true);
            return;
        }

        // Optimistic update for unpaid/waived
        setAppointments((prevArr: any[]) =>
            prevArr.map((a: any) => a._id === appointmentId ? { ...a, paymentStatus: status, paymentDetails: null } : a)
        );
        setPaymentUpdatingId(appointmentId);
        try {
            await api.patch(`/hospital/dashboard/appointments/${appointmentId}/payment-status`, { status });
            showToast(`Payment marked as ${status === 'waived' ? 'revoked' : status}`, 'success');
        } catch (error: any) {
            // Rollback
            setAppointments((cur: any[]) =>
                cur.map((a: any) => a._id === appointmentId ? { ...a, paymentStatus: prev, paymentDetails: app?.paymentDetails } : a)
            );
            showToast(error.response?.data?.message || 'Failed to update payment status', 'error');
        } finally {
            setPaymentUpdatingId(null);
        }
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
                amount: Number(paymentAmount),
                mode: paymentMode
            });
            showToast("Payment recorded successfully!", "success");
            setPaymentModalOpen(false);
            
            // Update local state for appointment payment status and details
            setAppointments((prevArr: any[]) =>
                prevArr.map((a: any) =>
                    a._id === selectedAppointmentId
                        ? {
                              ...a,
                              paymentStatus: 'paid',
                              paymentDetails: { amount: Number(paymentAmount), mode: paymentMode }
                          }
                        : a
                )
            );
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to record payment");
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const handleGenerateInvoice = async (appointmentId: string, fee: number) => {
        setGeneratingInvoiceId(appointmentId);
        try {
            await api.post(`/hospital/dashboard/appointments/${appointmentId}/invoice`, {
                amount: fee
            });
            fetchData();
            alert('Invoice generated and sent to patient successfully!');
        } catch (error) {
            console.error('Invoice error:', error);
            alert('Failed to generate invoice');
        } finally {
            setGeneratingInvoiceId(null);
        }
    };

    // Mobile section tabs: keep the active tab scrolled into view, and open a
    // newly chosen section at the top of the page.
    const tabStripRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const strip = tabStripRef.current;
        const active = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (strip && active) {
            strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2, behavior: "smooth" });
        }
        if (typeof window !== "undefined" && window.scrollY > 200) window.scrollTo({ top: 0 });
    }, [activeMainTab, loading]);

    // The payment menu in the appointments table floats above the table (so the
    // table's scroll area can't cut it off). It follows its button while the page
    // scrolls and closes once the button is off screen.
    const [paymentMenuPos, setPaymentMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
    const paymentAnchorRef = useRef<HTMLElement | null>(null);
    const placePaymentMenu = useCallback((el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        const right = document.documentElement.clientWidth - r.right;
        setPaymentMenuPos(window.innerHeight - r.bottom > 220 ? { top: r.bottom + 4, right } : { bottom: window.innerHeight - r.top + 4, right });
    }, []);
    useEffect(() => {
        if (!openPaymentDropdown) return;
        const follow = () => {
            const el = paymentAnchorRef.current;
            if (!el || !el.isConnected) return setOpenPaymentDropdown(null);
            const r = el.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return setOpenPaymentDropdown(null);
            placePaymentMenu(el);
        };
        window.addEventListener("scroll", follow, true);
        window.addEventListener("resize", follow);
        return () => {
            window.removeEventListener("scroll", follow, true);
            window.removeEventListener("resize", follow);
        };
    }, [openPaymentDropdown, placePaymentMenu]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full" />
                <p className="text-sm font-medium text-slate-500">Loading hospital dashboard…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="ui-card p-8 text-center max-w-md w-full">
                    <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <AlertCircle className="w-7 h-7" />
                    </span>
                    <h1 className="text-xl font-bold text-slate-900">Access error</h1>
                    <p className="mt-1 text-sm text-slate-500">{error}</p>
                    <button onClick={() => {
                        clearAuth();
                        window.location.href = '/login';
                    }} className="ui-btn-dark mt-6 w-full sm:w-auto">Back to login</button>
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

    const hospitalName: string = stats?.hospital?.name || stats?.stats?.hospital?.name || "";
    const timeRange = (start?: string, end?: string) =>
        start && end
            ? `${new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`
            : 'N/A';

    // Slots listed in Slot Management (same rules for the table and the phone cards)
    const visibleSlots = slots.filter((slot: any) => {
        const isCancelled = slot.status === 'cancelled';
        const tabMatch = activeSlotSubTab === 'upcoming' ? !isCancelled : isCancelled;
        if (!tabMatch) return false;
        // Upcoming = not yet ended (pick a date in the filter to see past slots)
        if (activeSlotSubTab === 'upcoming' && !slotDateFilter && new Date(slot.endTime || slot.startTime).getTime() < Date.now()) return false;
        // Date filter: compare slot's local date (YYYY-MM-DD) against the filter
        if (slotDateFilter) {
            const slotLocalDate = new Date(slot.startTime).toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (slotLocalDate !== slotDateFilter) return false;
        }
        return true;
    });

    // Free slots offered in the walk-in booking form
    const manualSlotOptions = slots.filter((s: any) => {
        const matchDoc = s.doctor?._id === manualDoctorId;
        const slotDate = new Date(s.startTime).toISOString().split("T")[0];
        const matchDate = slotDate === manualBookingDate;
        const isAvailable = s.status === "available";
        const maxAppts = s.max_appointments || 1;
        const bookingCount = s.bookingCount || 0;
        const hasCapacity = bookingCount < maxAppts;
        return matchDoc && matchDate && isAvailable && hasCapacity;
    });

    const activeFilterCount = [filterDate, startDate, endDate, filterSpecialty, filterDoctor, filterStatus].filter(Boolean).length;

    const dot = (cls: string, label: string) => (
        <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} role="img" aria-label={label} />
    );

    const navItems: { id: typeof activeMainTab; label: string; short: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
        { id: "appointments", label: "Appointments", short: "Appointments", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
        {
            id: "slots", label: "Slot management", short: "Slots", icon: <CalendarClock className="w-[18px] h-[18px]" />,
            badge: !isSubscriptionActive ? dot("bg-rose-500", "Slot generation locked") : null,
        },
        { id: "patients", label: "Patient records", short: "Patients", icon: <Users className="w-[18px] h-[18px]" /> },
        { id: "payments", label: "Payments & collections", short: "Payments", icon: <IndianRupee className="w-[18px] h-[18px]" /> },
        {
            id: "settlements", label: "Settlements", short: "Settlements", icon: <Landmark className="w-[18px] h-[18px]" />,
            badge: pendingSettlements.length > 0 ? (
                <span className="min-w-[20px] rounded-full bg-amber-400 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-slate-950" aria-label={`${pendingSettlements.length} waiting for confirmation`}>
                    {pendingSettlements.length}
                </span>
            ) : null,
        },
        { id: "followups", label: "Follow-up reminders", short: "Follow-ups", icon: <BellRing className="w-[18px] h-[18px]" /> },
        {
            id: "subscription", label: "Plan & usage", short: "Plan & usage", icon: <CreditCard className="w-[18px] h-[18px]" />,
            badge: subscriptionData?.hospital?.isExpired ? dot("bg-rose-500 ring-4 ring-rose-500/20", "Subscription expired")
                : subscriptionData?.hospital?.subscriptionStatus === 'Pending Payment' ? dot("bg-amber-500", "Payment pending")
                : subscriptionData?.hospital?.isExpiringSoon ? dot("bg-orange-500", "Expiring soon")
                : null,
        },
        { id: "settings", label: "Settings", short: "Settings", icon: <Settings className="w-[18px] h-[18px]" /> },
    ];

    const hasPlanBenefits = stats?.is_featured || stats?.has_custom_page || stats?.has_govt_schemes || stats?.is_spotlight || stats?.priority_support;
    const planBenefits = (
        <div className="ui-card p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500">Plan benefits</p>
                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">Active</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{planLabel(stats?.plan)} plan</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
                {stats?.is_featured && (
                    <span className="ui-badge border-indigo-100 bg-indigo-50 text-indigo-700">Top of search</span>
                )}
                {stats?.has_govt_schemes && (
                    <span className="ui-badge border-emerald-100 bg-emerald-50 text-emerald-700">Govt schemes</span>
                )}
                {stats?.is_spotlight && (
                    <span className="ui-badge border-amber-100 bg-amber-50 text-amber-700">Spotlight</span>
                )}
                {stats?.priority_support && (
                    <span className="ui-badge border-rose-100 bg-rose-50 text-rose-700">Priority support</span>
                )}
                {!hasPlanBenefits && (
                    <p className="text-xs leading-relaxed text-slate-500">
                        Standard listing — your hospital page and online booking are live.
                    </p>
                )}
            </div>
        </div>
    );

    const quickSlotCard = isSelfManaged ? (
        <section className="ui-card p-5 sm:p-6" aria-labelledby="quick-slot-heading">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Clock className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <h2 id="quick-slot-heading" className="ui-title">Quick slot & timing generator</h2>
                    <p className="ui-subtitle">Select a doctor to set their available date, start/end timing and booking slot duration.</p>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {doctors.map((doc: any) => (
                    <button
                        key={doc._id}
                        onClick={() => setShowSlotGen(doc)}
                        title={`Set up timing for ${doctorLabel(doc)}`}
                        className="ui-btn-secondary ui-btn-sm min-h-[40px] max-w-full text-[13px] sm:min-h-[36px]"
                    >
                        <Clock className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="truncate">{doctorLabel(doc)}</span>
                    </button>
                ))}
                {doctors.length === 0 && (
                    <p className="ui-empty w-full py-6">Add a doctor under Staff &amp; groups first to configure timings and generate slots.</p>
                )}
            </div>
        </section>
    ) : null;

    const statusPill = (status: string) => {
        const tone =
            status === 'completed' || status === 'confirmed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : status === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-700'
            : status === 'checked-in' ? 'border-blue-200 bg-blue-50 text-blue-700'
            : status === 'in-consultation' ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'border-rose-200 bg-rose-50 text-rose-700';
        const label = (status || 'unknown').replace(/-/g, ' ');
        return <span className={`ui-badge capitalize ${tone}`}>{label}</span>;
    };

    const paymentTone = (s?: string) =>
        s === 'paid' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : s === 'partial' ? 'border-amber-200 bg-amber-50 text-amber-700'
        : s === 'waived' ? 'border-slate-200 bg-slate-100 text-slate-600'
        : 'border-rose-200 bg-rose-50 text-rose-600';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" onClick={(e) => {
            // Close payment dropdown when clicking outside
            if (openPaymentDropdown && !(e.target as HTMLElement).closest('.payment-dropdown-wrapper')) {
                setOpenPaymentDropdown(null);
            }
        }}>
            {/* Toast notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        role="status"
                        className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
                            toast.type === 'success'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                        }`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:flex lg:gap-8">
                {/* Sidebar (computers) */}
                <aside className="hidden lg:block w-60 shrink-0 py-8">
                    <div className="sticky top-24 space-y-4">
                        <nav aria-label="Dashboard sections" className="ui-card p-2">
                            <div role="tablist" aria-orientation="vertical" aria-label="Hospital Management Tabs" className="space-y-0.5">
                                {navItems.map((item) => {
                                    const active = activeMainTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setActiveMainTab(item.id)}
                                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                                active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                            }`}
                                        >
                                            <span className={active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}>{item.icon}</span>
                                            <span className="flex-1 truncate text-left">{item.label}</span>
                                            {item.badge}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>
                        {planBenefits}
                    </div>
                </aside>

                <main className="flex-1 min-w-0 py-6 lg:py-8 space-y-6">
                    {/* Header */}
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0">
                            {hospitalName && <p className="text-sm font-medium text-slate-500">Hospital Command Center</p>}
                            <h1 className="mt-0.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 line-clamp-2">
                                {hospitalName || "Hospital Command Center"}
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">
                                    {planLabel(stats?.plan)} plan
                                </span>
                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> System online
                                </span>
                                <button
                                    onClick={handleEnableNotifications}
                                    disabled={pushStatus === "Active" || pushStatus === "Checking..." || pushStatus === "Not Supported"}
                                    className={`ui-badge transition ${
                                        pushStatus === "Active"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                                            : pushStatus === "Checking..."
                                            ? "border-slate-200 bg-slate-50 text-slate-500 cursor-default"
                                            : pushStatus === "Blocked"
                                            ? "border-rose-200 bg-rose-50 text-rose-700 cursor-not-allowed"
                                            : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                                    }`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${pushStatus === "Active" ? "bg-emerald-500" : pushStatus === "Blocked" ? "bg-rose-500" : "bg-amber-500"} ${pushStatus === "Setup Required" ? "animate-pulse" : ""}`} />
                                    Notifications: {pushStatus}
                                </button>
                            </div>
                        </div>
                        {isSelfManaged && (
                            <button
                                onClick={() => setShowManualBooking(true)}
                                className="ui-btn-success w-full sm:w-auto shrink-0 min-h-[44px]"
                            >
                                <Plus className="w-4 h-4" /> Book walk-in appointment
                            </button>
                        )}
                    </header>

                    {/* Section tabs (phones and tablets) */}
                    <div className="lg:hidden sticky top-16 sm:top-20 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-slate-50/95 backdrop-blur border-b border-slate-200/70">
                        <div
                            ref={tabStripRef}
                            role="tablist"
                            aria-label="Hospital Management Tabs"
                            className="no-scrollbar flex gap-1.5 overflow-x-auto"
                        >
                            {navItems.map((item) => {
                                const active = activeMainTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setActiveMainTab(item.id)}
                                        className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 min-h-[40px] text-sm font-medium transition ${
                                            active ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
                                        }`}
                                    >
                                        <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
                                        {item.short}
                                        {item.badge}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {!isSelfManaged && (
                        <div className="flex items-center gap-3 rounded-2xl bg-blue-600 p-4 text-white">
                            <Info className="h-5 w-5 shrink-0" />
                            <div>
                                <h3 className="font-semibold">Pillora-Managed</h3>
                                <p className="text-sm text-blue-100">Only admins can modify your facility&apos;s slots.</p>
                            </div>
                        </div>
                    )}

                    {/* Action Required Banner for Pending Settlement Payouts */}
                    {pendingSettlements.length > 0 && activeMainTab !== "settlements" && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 md:flex-row md:items-center md:justify-between"
                        >
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                                    <Clock className="h-5 w-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-amber-800">Action required · Settlement confirmation</p>
                                    <h4 className="mt-0.5 font-semibold text-slate-900">
                                        Pillora Admin sent a settlement payout of ₹{pendingSettlements[0].netAmount?.toFixed(2)}
                                    </h4>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                        Transferred via <strong className="font-semibold text-slate-800">{pendingSettlements[0].transferMethod}</strong> (UTR: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-900">{pendingSettlements[0].utrNumber}</code>).
                                        Please verify your bank account and confirm receipt.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveMainTab("settlements")}
                                className="ui-btn-success w-full md:w-auto shrink-0"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Review &amp; confirm settlement
                            </button>
                        </motion.div>
                    )}

                    {/* Low WhatsApp messages / AI minutes warning (hidden when there's enough left) */}
                    {activeMainTab !== "subscription" && <UsageWarningBanner onOpen={() => setActiveMainTab("subscription")} />}

                    {activeMainTab === "patients" && (
                        <PatientSearchAdmin />
                    )}

                    {activeMainTab === "payments" && (
                        <PaymentAnalytics doctors={doctors} />
                    )}

                    {activeMainTab === "settlements" && (
                        <HospitalSettlements
                            hospitalId={stats?.stats?.hospital?._id || stats?.hospital?._id}
                            trialEndDate={stats?.stats?.hospital?.trialEndDate || stats?.hospital?.trialEndDate}
                        />
                    )}

                    {activeMainTab === "followups" && (
                        <FollowUpRemindersAdmin
                            doctors={doctors}
                            prefillData={followUpPrefillData}
                            onClosePrefillModal={() => setFollowUpPrefillData(null)}
                        />
                    )}

                    {activeMainTab === "subscription" && (
                        <div className="space-y-6">
                            <div className="lg:hidden">{planBenefits}</div>
                            <UsagePanel />
                            <HospitalSubscriptionDashboard />
                        </div>
                    )}

                    {activeMainTab === "settings" && (
                        <HospitalSettingsModule
                            hospital={stats?.hospital || stats?.stats?.hospital}
                            user={user}
                            onProfileUpdated={fetchData}
                            onNavigateTab={(tab: string) => {
                                if (["appointments", "slots", "patients", "payments", "settlements", "followups", "subscription", "settings"].includes(tab)) {
                                    setActiveMainTab(tab as any);
                                }
                            }}
                        />
                    )}

                    {activeMainTab === "appointments" && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                                <StatCard label="Total doctors" value={stats?.stats?.doctors} icon={<Stethoscope className="w-5 h-5" />} tone="blue" />
                                <StatCard label="Total bookings" value={stats?.stats?.appointments} icon={<Calendar className="w-5 h-5" />} tone="emerald" />
                                <StatCard label="Pending review" value={stats?.stats?.pending} icon={<Clock className="w-5 h-5" />} tone="amber" />
                                <StatCard
                                    label="Cancellation rate · this month"
                                    value={`${cancellationRate?.rate || 0}%`}
                                    icon={<XCircle className="w-5 h-5" />}
                                    tone="rose"
                                    sub={`${cancellationRate?.cancelled || 0} cancelled, out of ${cancellationRate?.total || 0} bookings`}
                                />
                            </div>

                            {quickSlotCard}

                            {/* Appointments List */}
                            <section className="ui-card" aria-labelledby="appointments-heading">
                                <div className="p-5 sm:p-6 space-y-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h2 id="appointments-heading" className="ui-title">Appointments</h2>
                                            <span className="ui-badge border-slate-200 bg-slate-50 text-slate-600">{filteredAppointments.length}</span>
                                        </div>
                                        <button
                                            onClick={exportToExcel}
                                            className="ui-btn ui-btn-sm min-h-[36px] border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        >
                                            <Download className="w-4 h-4" /> Export Excel
                                        </button>
                                    </div>

                                    {/* Filters */}
                                    <div className="sm:hidden">
                                        <button
                                            type="button"
                                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                                            aria-expanded={showMobileFilters}
                                            className="ui-btn-secondary w-full justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                                                {showMobileFilters ? "Hide filters" : "Filter appointments"}
                                            </span>
                                            {activeFilterCount > 0 && (
                                                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">{activeFilterCount} active</span>
                                            )}
                                        </button>
                                    </div>
                                    <div className={`grid-cols-1 sm:grid-cols-3 xl:grid-cols-6 gap-3 ${showMobileFilters ? 'grid' : 'hidden sm:grid'}`}>
                                        <label className="block">
                                            <span className="ui-label">Single date</span>
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
                                                className="ui-input"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="ui-label">Start date</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    if (e.target.value) setFilterDate("");
                                                }}
                                                className="ui-input"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="ui-label">End date</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => {
                                                    setEndDate(e.target.value);
                                                    if (e.target.value) setFilterDate("");
                                                }}
                                                className="ui-input"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="ui-label">Specialty</span>
                                            <input
                                                type="text"
                                                placeholder="e.g. Dentist"
                                                value={filterSpecialty}
                                                onChange={(e) => setFilterSpecialty(e.target.value)}
                                                className="ui-input"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="ui-label">Doctor</span>
                                            <select
                                                value={filterDoctor}
                                                onChange={(e) => setFilterDoctor(e.target.value)}
                                                className="ui-input"
                                            >
                                                <option value="">All Doctors</option>
                                                {doctors.map(d => <option key={d._id} value={d._id}>{doctorLabel(d)}</option>)}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="ui-label">Status</span>
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="ui-input"
                                            >
                                                <option value="">All Status</option>
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="checked-in">Checked In</option>
                                                <option value="in-consultation">In Consultation</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                                <th className="ui-th pl-6">Token</th>
                                                <th className="ui-th">Patient</th>
                                                <th className="ui-th">Doctor</th>
                                                <th className="ui-th">Date &amp; time</th>
                                                <th className="ui-th">Status</th>
                                                <th className="ui-th pr-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredAppointments.map((app: any, idx: number) => (
                                                <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="ui-td pl-6 font-semibold text-slate-900 whitespace-nowrap">{app.tokenNo || `T-${idx + 1001}`}</td>
                                                    <td className="ui-td min-w-[200px]">
                                                        <div className="font-medium text-slate-900">
                                                            {app.patientName || app.patient?.name || 'N/A'}
                                                            {(app.patientAge !== undefined || app.patient?.age !== undefined) && (
                                                                <span className="text-xs font-normal text-slate-400 ml-1">
                                                                    ({app.patientAge || app.patient?.age} yrs)
                                                                </span>
                                                            )}
                                                            {app.bookingSource === 'ai_call' && <AiCallBadge className="ml-1.5" />}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {app.patientPhone || app.patient?.phone || 'N/A'}
                                                        </div>
                                                        {(app.patientEmail || app.patient?.email) && (
                                                            <div className="text-xs text-slate-400 mt-0.5 break-all">
                                                                {app.patientEmail || app.patient?.email}
                                                            </div>
                                                        )}
                                                        {app.patient?._id && (
                                                            <button
                                                                onClick={() => handleViewRecords(app.patient._id, app.patient.name || app.patientName)}
                                                                className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                                                            >
                                                                View records
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="ui-td">
                                                        <div className="font-medium text-slate-800">{doctorLabel(app.doctor)}</div>
                                                        {app.doctor?.specialty && <div className="text-xs text-slate-500 mt-0.5">{app.doctor.specialty}</div>}
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap">
                                                        <div className="font-medium text-slate-800">{new Date(app.slotTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
                                                            {app.slot ? timeRange(app.slot.startTime, app.slot.endTime) : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="ui-td">{statusPill(app.status)}</td>
                                                    <td className="ui-td pr-6">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                                {/* Doctor assign — only for pending/confirmed */}
                                                                {(app.status === 'pending' || app.status === 'confirmed') && (
                                                                    <select
                                                                        className="h-8 max-w-[150px] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 transition-colors"
                                                                        value={app.doctor?._id || ""}
                                                                        onChange={(e) => handleAssignDoctor(app._id, e.target.value)}
                                                                        title="Assign/Reassign Doctor"
                                                                        aria-label="Assign or reassign doctor"
                                                                    >
                                                                        <option value="" disabled>Assign doctor</option>
                                                                        {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                                                    </select>
                                                                )}
                                                                {/* Status progression buttons */}
                                                                {app.status === 'pending' ? (
                                                                    <div className="flex gap-1">
                                                                        <button title="Confirm" aria-label="Confirm" onClick={() => handleStatusUpdate(app._id, 'confirmed')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                                                                        <button title="Check-in" aria-label="Check in" onClick={() => handleStatusUpdate(app._id, 'checked-in')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><User className="w-4 h-4" /></button>
                                                                        <button title="No-Show / Cancel" aria-label="No-show or cancel" onClick={() => handleStatusUpdate(app._id, 'cancelled')} className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"><XCircle className="w-4 h-4" /></button>
                                                                    </div>
                                                                ) : app.status === 'checked-in' ? (
                                                                    <button onClick={() => handleStatusUpdate(app._id, 'in-consultation')} className="ui-btn ui-btn-sm bg-amber-50 text-amber-700 hover:bg-amber-100">
                                                                        <RefreshCcw className="w-3.5 h-3.5" /> Start consultation
                                                                    </button>
                                                                ) : app.status === 'in-consultation' ? (
                                                                    <button onClick={() => handleStatusUpdate(app._id, 'completed')} className="ui-btn-success ui-btn-sm">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                                                                    </button>
                                                                ) : app.status === 'completed' && (
                                                                    app.invoiceUrl ? (
                                                                        <a href={app.invoiceUrl} target="_blank" rel="noreferrer" className="ui-btn ui-btn-sm border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                                                                            <FileText className="w-3.5 h-3.5" /> View invoice
                                                                        </a>
                                                                    ) : (
                                                                        <button onClick={() => handleGenerateInvoice(app._id, app.doctor?.fee || 500)} disabled={generatingInvoiceId === app._id} className="ui-btn-dark ui-btn-sm">
                                                                            <FileText className="w-3.5 h-3.5" /> {generatingInvoiceId === app._id ? 'Generating…' : 'Generate invoice'}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                                {/* Schedule Follow-Up Reminder */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleScheduleFollowUpFromAppointment(app)}
                                                                    title="Schedule Patient Follow-Up Reminder"
                                                                    className="ui-btn ui-btn-sm border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                                                >
                                                                    <Bell className="w-3.5 h-3.5" /> Follow-up
                                                                </button>

                                                                {/* Payment status badge — available for ALL statuses, labeled as manual */}
                                                                <div className={`relative payment-dropdown-wrapper ${openPaymentDropdown === app._id ? 'z-50' : 'z-0'}`}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            if (openPaymentDropdown === app._id) {
                                                                                setOpenPaymentDropdown(null);
                                                                                return;
                                                                            }
                                                                            paymentAnchorRef.current = e.currentTarget;
                                                                            placePaymentMenu(e.currentTarget);
                                                                            setOpenPaymentDropdown(app._id);
                                                                        }}
                                                                        disabled={paymentUpdatingId === app._id}
                                                                        title="Manually recorded — not verified by payment gateway"
                                                                        aria-haspopup="menu"
                                                                        aria-expanded={openPaymentDropdown === app._id}
                                                                        className={`ui-btn ui-btn-sm border ${paymentTone(app.paymentStatus)}`}
                                                                    >
                                                                        {paymentUpdatingId === app._id ? (
                                                                            <RefreshCcw className="w-3 h-3 animate-spin" />
                                                                        ) : app.paymentStatus === 'paid' ? (
                                                                            <CreditCard className="w-3.5 h-3.5" />
                                                                        ) : app.paymentStatus === 'partial' || app.paymentStatus === 'waived' ? null : (
                                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                                        )}
                                                                        {app.paymentStatus === 'paid'
                                                                            ? 'Paid'
                                                                            : app.paymentStatus === 'partial'
                                                                            ? `Advance: ₹${app.advancePaid || ''} • Due: ₹${app.balanceDue !== undefined ? app.balanceDue : ''}`
                                                                            : app.paymentStatus === 'waived'
                                                                            ? 'Revoked'
                                                                            : 'Unpaid'}
                                                                        <ChevronDown className="w-3 h-3 opacity-60" />
                                                                    </button>
                                                                    {openPaymentDropdown === app._id && (
                                                                        <div
                                                                            role="menu"
                                                                            style={paymentMenuPos ? { top: paymentMenuPos.top, bottom: paymentMenuPos.bottom, right: paymentMenuPos.right } : undefined}
                                                                            className={`${paymentMenuPos ? 'fixed' : 'absolute right-0 top-full mt-1'} z-[60] min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl`}
                                                                        >
                                                                            <p className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-slate-400">Payment action (recorded manually)</p>
                                                                            {app.balanceDue > 0 && (
                                                                                <button
                                                                                    type="button"
                                                                                    role="menuitem"
                                                                                    onClick={() => {
                                                                                        setOpenPaymentDropdown(null);
                                                                                        setActiveMainTab("payments");
                                                                                    }}
                                                                                    className="block w-full px-3 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                                                >
                                                                                    Collect balance
                                                                                </button>
                                                                            )}
                                                                            {(['unpaid', 'paid', 'waived'] as const).map(s => (
                                                                                <button
                                                                                    key={s}
                                                                                    role="menuitem"
                                                                                    onClick={() => handlePaymentStatusUpdate(app._id, s)}
                                                                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium hover:bg-slate-50 transition-colors ${
                                                                                        s === 'paid' ? 'text-emerald-700' : s === 'waived' ? 'text-slate-600' : 'text-rose-600'
                                                                                    } ${app.paymentStatus === s ? 'bg-slate-50' : ''}`}
                                                                                >
                                                                                    {s === 'paid' ? 'Paid' : s === 'waived' ? 'Revoke' : 'Unpaid'}
                                                                                    {app.paymentStatus === s && <Check className="w-3.5 h-3.5" />}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredAppointments.length === 0 && (
                                        <div className="px-6 py-14 text-center text-sm text-slate-500">
                                            No appointments found in this category.
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Card List View */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {filteredAppointments.map((app: any, idx: number) => (
                                        <div key={app._id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[11px] rounded-md font-semibold">
                                                            {app.tokenNo || `T-${idx + 1001}`}
                                                        </span>
                                                        {app.bookingSource === 'ai_call' && <AiCallBadge />}
                                                    </div>
                                                    <h4 className="font-semibold text-slate-900 mt-2">
                                                        {app.patientName || app.patient?.name || 'N/A'}
                                                        {(app.patientAge !== undefined || app.patient?.age !== undefined) && (
                                                            <span className="text-xs text-slate-400 font-normal ml-1">
                                                                ({app.patientAge || app.patient?.age} yrs)
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p className="text-xs text-slate-500">{app.patientPhone || app.patient?.phone || 'N/A'}</p>
                                                    {(app.patientEmail || app.patient?.email) && (
                                                        <p className="text-xs text-slate-400 mt-0.5 break-all">{app.patientEmail || app.patient?.email}</p>
                                                    )}
                                                    {app.patient?._id && (
                                                        <button
                                                            onClick={() => handleViewRecords(app.patient._id, app.patient.name || app.patientName)}
                                                            className="mt-1 text-xs font-semibold text-blue-600 hover:underline min-h-[32px]"
                                                        >
                                                            View records
                                                        </button>
                                                    )}
                                                </div>
                                                {statusPill(app.status)}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                                                <div className="min-w-0">
                                                    <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Doctor</span>
                                                    <span className="block text-sm font-medium text-slate-800 truncate">{doctorLabel(app.doctor)}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Schedule slot</span>
                                                    <span className="block text-sm font-medium text-slate-800">{new Date(app.slotTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                                    <span className="block text-xs text-slate-500 mt-0.5">
                                                        {app.slot ? timeRange(app.slot.startTime, app.slot.endTime) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mobile Actions block */}
                                            <div className="space-y-2">
                                                {/* Doctor assign — only for pending/confirmed */}
                                                {(app.status === 'pending' || app.status === 'confirmed') && (
                                                    <select
                                                        className="ui-input text-center"
                                                        value={app.doctor?._id || ""}
                                                        onChange={(e) => handleAssignDoctor(app._id, e.target.value)}
                                                        aria-label="Assign or reassign doctor"
                                                    >
                                                        <option value="" disabled>-- Assign / Reassign Doctor --</option>
                                                        {doctors.map(d => <option key={d._id} value={d._id}>{doctorLabel(d)}</option>)}
                                                    </select>
                                                )}
                                                {/* Status progression */}
                                                {app.status === 'pending' ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <button type="button" onClick={() => handleStatusUpdate(app._id, 'confirmed')} className="ui-btn min-h-[44px] px-2 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"><CheckCircle2 className="w-4 h-4" /> Confirm</button>
                                                        <button type="button" onClick={() => handleStatusUpdate(app._id, 'checked-in')} className="ui-btn min-h-[44px] px-2 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"><User className="w-4 h-4" /> Check-in</button>
                                                        <button type="button" onClick={() => handleStatusUpdate(app._id, 'cancelled')} className="ui-btn min-h-[44px] px-2 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100"><XCircle className="w-4 h-4" /> Cancel</button>
                                                    </div>
                                                ) : app.status === 'checked-in' ? (
                                                    <button type="button" onClick={() => handleStatusUpdate(app._id, 'in-consultation')} className="ui-btn w-full min-h-[44px] bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100">
                                                        <RefreshCcw className="w-4 h-4" /> Start consultation
                                                    </button>
                                                ) : app.status === 'in-consultation' ? (
                                                    <button type="button" onClick={() => handleStatusUpdate(app._id, 'completed')} className="ui-btn-success w-full min-h-[44px]">
                                                        <CheckCircle2 className="w-4 h-4" /> Complete consultation
                                                    </button>
                                                ) : app.status === 'completed' && (
                                                    app.invoiceUrl ? (
                                                        <a href={app.invoiceUrl} target="_blank" rel="noreferrer" className="ui-btn w-full min-h-[44px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            <FileText className="w-4 h-4" /> View invoice
                                                        </a>
                                                    ) : (
                                                        <button onClick={() => handleGenerateInvoice(app._id, app.doctor?.fee || 500)} disabled={generatingInvoiceId === app._id} className="ui-btn-dark w-full min-h-[44px]">
                                                            <FileText className="w-4 h-4" /> {generatingInvoiceId === app._id ? 'Generating...' : 'Generate invoice'}
                                                        </button>
                                                    )
                                                )}

                                                <div className="grid grid-cols-2 gap-2">
                                                    {/* Schedule Follow-Up Reminder — Mobile */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleScheduleFollowUpFromAppointment(app)}
                                                        className="ui-btn min-h-[44px] px-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                                    >
                                                        <Bell className="w-4 h-4" /> Follow-up
                                                    </button>

                                                    {/* Payment status — ALL statuses */}
                                                    <div className="relative">
                                                        <select
                                                            value={app.paymentStatus || 'unpaid'}
                                                            disabled={paymentUpdatingId === app._id}
                                                            onChange={(e) => handlePaymentStatusUpdate(app._id, e.target.value as any)}
                                                            title="Manually recorded — not verified by payment gateway"
                                                            aria-label="Payment status"
                                                            className={`w-full min-h-[44px] pl-3 pr-8 rounded-xl border text-sm font-semibold outline-none text-center appearance-none cursor-pointer transition-colors disabled:opacity-50 ${paymentTone(app.paymentStatus)}`}
                                                        >
                                                            <option value="unpaid">Unpaid</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="waived">Revoke</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 opacity-60" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredAppointments.length === 0 && (
                                        <div className="text-center py-12 px-4 text-sm text-slate-500">
                                            No appointments found in this category.
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Bookings Analytics & Operational Graphs */}
                            <section aria-labelledby="analytics-heading" className="space-y-4">
                                <div>
                                    <h2 id="analytics-heading" className="ui-title flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" /> Bookings &amp; operational analytics
                                    </h2>
                                    <p className="ui-subtitle">Performance metrics and doctor appointment distributions.</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {/* Bar Chart: Bookings per Doctor */}
                                    <div className="ui-card p-5 sm:p-6 lg:col-span-2 flex flex-col h-[300px]">
                                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Bookings by doctor</h3>
                                        <div className="flex-1 flex items-end gap-4 sm:gap-8 px-2 border-b border-slate-200">
                                            {doctorData.map((d, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end min-w-0">
                                                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                                                        <span className="mb-1 text-xs font-semibold text-slate-600">{d.count}</span>
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(d.count / maxCount) * 80}%` }}
                                                            transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                                                            title={`${d.count} Bookings`}
                                                            className="w-full max-w-[44px] bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg hover:from-blue-700 hover:to-indigo-500 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {doctorData.length === 0 && (
                                                <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                                                    No bookings data to display in chart.
                                                </div>
                                            )}
                                        </div>
                                        {doctorData.length > 0 && (
                                            <div className="flex gap-4 sm:gap-8 px-2 pt-2">
                                                {doctorData.map((d, i) => (
                                                    <p key={i} className="flex-1 min-w-0 text-[11px] font-medium text-slate-500 text-center truncate" title={d.name}>
                                                        {doctorShortLabel(d)}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Distribution Breakdown */}
                                    <div className="ui-card p-5 sm:p-6 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800 mb-4">Status distribution</h3>
                                            <div className="space-y-3.5">
                                                {['confirmed', 'pending', 'checked-in', 'completed', 'cancelled'].map((status) => {
                                                    const count = appointments.filter(a => a.status === status).length;
                                                    const percentage = appointments.length > 0 ? (count / appointments.length) * 100 : 0;
                                                    const color = status === 'completed' || status === 'confirmed' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : status === 'checked-in' ? 'bg-blue-500' : status === 'cancelled' ? 'bg-rose-500' : 'bg-slate-400';

                                                    return (
                                                        <div key={status} className="space-y-1.5">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="capitalize text-slate-600">{status.replace('-', ' ')}</span>
                                                                <span className="font-medium text-slate-800">{count} <span className="text-slate-400 font-normal">({Math.round(percentage)}%)</span></span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                    className={`h-full rounded-full ${color}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 border-t border-slate-100 pt-3 mt-5">
                                            Total monitored: <span className="font-medium text-slate-700">{appointments.length} appointments</span>
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Doctors & Specialty Groups List */}
                            <section className="ui-card p-5 sm:p-6 space-y-5" aria-labelledby="staff-heading">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        <h2 id="staff-heading" className="ui-title">Staff &amp; groups</h2>
                                    </div>
                                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                                        <div className="ui-segmented w-full sm:w-auto">
                                            <button
                                                onClick={() => setDoctorTab("individual")}
                                                className={`ui-segment flex-1 sm:flex-none ${doctorTab === "individual" ? "ui-segment-active" : ""}`}
                                            >
                                                Individual
                                            </button>
                                            <button
                                                onClick={() => setDoctorTab("group")}
                                                className={`ui-segment flex-1 sm:flex-none ${doctorTab === "group" ? "ui-segment-active" : ""}`}
                                            >
                                                Specialty groups
                                            </button>
                                        </div>
                                        {isSelfManaged && (
                                            <button
                                                onClick={() => doctorTab === "individual" ? setShowAddDoctor(true) : setShowAddSpecialtyGroup(true)}
                                                className="ui-btn-primary"
                                                title={doctorTab === "individual" ? "Add Doctor" : "Add Specialty Group"}
                                            >
                                                <Plus className="w-4 h-4" /> Add {doctorTab === "individual" ? "doctor" : "group"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredDoctors.map((doc: any) => (
                                        <div key={doc._id} className={`rounded-xl border p-4 transition-colors ${doc.is_active ? 'border-slate-200 bg-white hover:border-blue-200' : 'border-dashed border-rose-200 bg-rose-50/40'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-semibold text-blue-600 shrink-0">
                                                    {doc.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 truncate">{doc.name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{doc.specialty}</p>
                                                </div>
                                                {!doc.is_active && <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Inactive</span>}
                                            </div>
                                            {doc.isSpecialtyGroup && doc.department && (
                                                <span className="ui-badge border-blue-100 bg-blue-50 text-blue-700 mt-3 max-w-full truncate">
                                                    {doc.department}
                                                </span>
                                            )}

                                            {doc.isSpecialtyGroup && (
                                                <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-2.5">
                                                    <div>
                                                        <span className="block text-[11px] font-medium text-slate-500">Max per slot</span>
                                                        <span className="text-sm font-semibold text-slate-800">{doc.maxAppointmentsPerSlot || 1} Patients</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[11px] font-medium text-slate-500">Doctors pool</span>
                                                        <span className="text-sm font-semibold text-slate-800">{doc.doctorsCount || 1} Available</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-sm font-semibold text-emerald-600">₹{doc.fee} / visit</span>
                                                {isSelfManaged && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => toggleDoctorStatus(doc)}
                                                            className={`ui-btn ui-btn-sm min-h-[36px] ${
                                                                doc.is_active
                                                                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            }`}
                                                        >
                                                            {doc.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        {doc.is_active && (
                                                            <button onClick={() => setShowSlotGen(doc)} className="ui-btn ui-btn-sm min-h-[36px] bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                                Slots
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteDoctor(doc)}
                                                            className="ui-btn ui-btn-sm min-h-[36px] text-rose-600 hover:bg-rose-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {filteredDoctors.length === 0 && (
                                        <p className="ui-empty sm:col-span-2 xl:col-span-3">
                                            No {doctorTab === "individual" ? "doctors recruited" : "specialty groups created"} yet.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </>
                    )}

                    {activeMainTab === "slots" && (
                        /* SLOT MANAGEMENT SECTION */
                        <>
                            {/* Subscription restriction warning banner */}
                            {!isSubscriptionActive && (
                                <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-800">
                                    <div className="flex items-start gap-3">
                                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="font-semibold text-sm text-rose-900">Slot generation locked</p>
                                            <p className="text-sm leading-relaxed">
                                                {restrictionMessage}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveMainTab("subscription")}
                                        className="ui-btn-danger shrink-0 self-start sm:self-auto"
                                    >
                                        View subscription &amp; billing
                                    </button>
                                </div>
                            )}

                            {quickSlotCard}

                            <section className="ui-card" aria-labelledby="slots-heading">
                                <div className="p-5 sm:p-6 space-y-4 border-b border-slate-100">
                                    {/* Title row */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <CalendarClock className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <h2 id="slots-heading" className="ui-title">Proactive slot management</h2>
                                                <p className="ui-subtitle">Schedule new slots, configure recurrence, and cancel upcoming appointments in emergency scenarios.</p>
                                            </div>
                                        </div>
                                        {isSelfManaged && (
                                            <button
                                                onClick={() => {
                                                    if (!isSubscriptionActive) {
                                                        alert(restrictionMessage);
                                                        return;
                                                    }
                                                    if (doctors.length === 0) {
                                                        alert("Please recruit a doctor or specialty group first before adding slots.");
                                                        return;
                                                    }
                                                    setAddSlotDoctorId(doctors[0]._id);
                                                    setShowAddSlot(true);
                                                }}
                                                className={`shrink-0 ${
                                                    !isSubscriptionActive
                                                        ? 'ui-btn bg-slate-200 text-slate-500 cursor-not-allowed'
                                                        : 'ui-btn-primary'
                                                }`}
                                            >
                                                <Plus className="w-4 h-4" /> Add new slot
                                            </button>
                                        )}
                                    </div>

                                    {/* Sub tabs + date filter */}
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="ui-segmented w-full md:w-auto">
                                            <button
                                                onClick={() => setActiveSlotSubTab("upcoming")}
                                                className={`ui-segment flex-1 md:flex-none ${activeSlotSubTab === "upcoming" ? "ui-segment-active" : ""}`}
                                            >
                                                Active / upcoming
                                            </button>
                                            <button
                                                onClick={() => setActiveSlotSubTab("cancelled")}
                                                className={`ui-segment flex-1 md:flex-none ${activeSlotSubTab === "cancelled" ? "ui-segment-active" : ""}`}
                                            >
                                                Cancelled
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label htmlFor="slot-date-filter" className="text-[13px] font-medium text-slate-600 whitespace-nowrap">
                                                Filter by date
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <input
                                                    id="slot-date-filter"
                                                    type="date"
                                                    value={slotDateFilter}
                                                    onChange={e => setSlotDateFilter(e.target.value)}
                                                    className="ui-input min-h-[40px] py-2 pl-9 w-auto"
                                                />
                                            </div>
                                            {slotDateFilter && (
                                                <button
                                                    onClick={() => setSlotDateFilter("")}
                                                    className="ui-btn-soft ui-btn-sm min-h-[40px]"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> All dates
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {slotDateFilter && (
                                        <p className="text-sm text-blue-700">
                                            Showing: <span className="font-semibold">{new Date(slotDateFilter + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse [&_td]:align-middle">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                                <th className="ui-th pl-6">Doctor / group</th>
                                                <th className="ui-th">Date</th>
                                                <th className="ui-th">Time range</th>
                                                <th className="ui-th">Bookings</th>
                                                <th className="ui-th">Status</th>
                                                <th className="ui-th pr-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {visibleSlots.map((slot: any) => {
                                                const slotDateStr = new Date(slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                                const timeRangeStr = timeRange(slot.startTime, slot.endTime);
                                                const isUpcoming = new Date(slot.endTime) >= new Date();
                                                const isBooked = slot.status === 'booked';

                                                // Cancellable only if not cancelled and hasn't passed and not in progress
                                                const isCancellable = slot.status !== 'cancelled' && new Date(slot.startTime) > new Date();

                                                return (
                                                    <tr key={slot._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="ui-td pl-6 font-medium text-slate-900">
                                                            {slot.doctor ? doctorLabel(slot.doctor) : "Specialty Group"}
                                                            {slot.doctor?.isSpecialtyGroup && (
                                                                <span className="ui-badge ml-2 border-blue-100 bg-blue-50 text-blue-700">Group</span>
                                                            )}
                                                        </td>
                                                        <td className="ui-td whitespace-nowrap">{slotDateStr}</td>
                                                        <td className="ui-td whitespace-nowrap">{timeRangeStr}</td>
                                                        <td className="ui-td">
                                                            <span className={`ui-badge ${slot.bookingCount > 0 ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                                                                {slot.bookingCount || 0} booked
                                                            </span>
                                                        </td>
                                                        <td className="ui-td">
                                                            {slot.status === 'cancelled' ? (
                                                                <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Cancelled</span>
                                                            ) : !isUpcoming ? (
                                                                <span className="ui-badge border-slate-200 bg-slate-100 text-slate-500">Past slot</span>
                                                            ) : isBooked ? (
                                                                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Fully booked</span>
                                                            ) : (
                                                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Available / active</span>
                                                            )}
                                                        </td>
                                                        <td className="ui-td pr-6">
                                                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                                                                {isSelfManaged && activeSlotSubTab === 'upcoming' && (
                                                                    <>
                                                                        <button
                                                                            disabled={!isCancellable}
                                                                            onClick={() => setShowCancelSlotModal(slot)}
                                                                            className={`ui-btn ui-btn-sm ${
                                                                                isCancellable
                                                                                    ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                                                                                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                                                            }`}
                                                                        >
                                                                            Cancel slot
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSlot(slot._id)}
                                                                            className="ui-btn ui-btn-sm border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" /> Delete slot
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {activeSlotSubTab === 'cancelled' && slot.cancellationReason && (
                                                                    <span className="text-xs text-slate-500 italic max-w-[220px] text-right" title={`Reason: ${slot.cancellationReason}`}>
                                                                        Reason: {slot.cancellationReason}
                                                                    </span>
                                                                )}
                                                                {activeSlotSubTab === 'cancelled' && (
                                                                    <button
                                                                        onClick={() => handleDeleteSlot(slot._id)}
                                                                        className="ui-btn ui-btn-sm border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" /> Delete slot
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {visibleSlots.length === 0 && (
                                        <div className="px-6 py-14 text-center text-sm text-slate-500">
                                            {slotDateFilter
                                                ? `No slots found for ${new Date(slotDateFilter + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
                                                : 'No slots found in this category.'
                                            }
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Card List View */}
                                <div className="md:hidden divide-y divide-slate-100">
                                    {visibleSlots.map((slot: any) => {
                                        const slotDateStr = new Date(slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                                        const timeRangeStr = timeRange(slot.startTime, slot.endTime);
                                        const isUpcoming = new Date(slot.endTime) >= new Date();
                                        const isBooked = slot.status === 'booked';
                                        const isCancellable = slot.status !== 'cancelled' && new Date(slot.startTime) > new Date();

                                        return (
                                            <div key={slot._id} className="p-4 space-y-3">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-slate-900">{slot.doctor ? doctorLabel(slot.doctor) : "Specialty Group"}</h4>
                                                        {slot.doctor?.isSpecialtyGroup && (
                                                            <span className="ui-badge border-blue-100 bg-blue-50 text-blue-700 mt-1">Specialty group</span>
                                                        )}
                                                    </div>
                                                    {slot.status === 'cancelled' ? (
                                                        <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Cancelled</span>
                                                    ) : !isUpcoming ? (
                                                        <span className="ui-badge border-slate-200 bg-slate-100 text-slate-500">Past slot</span>
                                                    ) : isBooked ? (
                                                        <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Fully booked</span>
                                                    ) : (
                                                        <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">Active</span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                                                    <div>
                                                        <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Date</span>
                                                        <span className="text-sm font-medium text-slate-800">{slotDateStr}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Time range</span>
                                                        <span className="text-sm font-medium text-slate-800">{timeRangeStr}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className={`ui-badge ${slot.bookingCount > 0 ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                                                        {slot.bookingCount || 0} booked
                                                    </span>
                                                    {activeSlotSubTab === 'cancelled' && slot.cancellationReason && (
                                                        <p className="text-xs text-slate-500 italic text-right" title={`Reason: ${slot.cancellationReason}`}>
                                                            Reason: {slot.cancellationReason}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                {isSelfManaged && (
                                                    <div className="flex gap-2">
                                                        {activeSlotSubTab === 'upcoming' && (
                                                            <button
                                                                type="button"
                                                                disabled={!isCancellable}
                                                                onClick={() => setShowCancelSlotModal(slot)}
                                                                className={`ui-btn flex-1 min-h-[44px] border ${
                                                                    isCancellable
                                                                        ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white"
                                                                        : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                                                }`}
                                                            >
                                                                Cancel slot
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSlot(slot._id)}
                                                            className="ui-btn flex-1 min-h-[44px] border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white"
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete slot
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {visibleSlots.length === 0 && (
                                        <div className="text-center py-12 px-4 text-sm text-slate-500">
                                            {slotDateFilter
                                                ? `No slots found for ${new Date(slotDateFilter + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
                                                : 'No slots found in this category.'
                                            }
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* Slot generator */}
            {showSlotGen && (
                <Modal title="Generate slots" onClose={() => setShowSlotGen(null)} bodyClassName="p-0">
                    <div className="h-full px-5 pt-5 sm:px-6">
                        <SlotGenTool
                            doctor={showSlotGen}
                            subscriptionStatus={subscriptionData?.hospital?.subscriptionStatus}
                            onClose={() => { setShowSlotGen(null); fetchData(); }}
                        />
                    </div>
                </Modal>
            )}

            {showAddDoctor && (
                <Modal title="Recruit new doctor" icon={<UserPlus className="w-5 h-5" />} onClose={() => setShowAddDoctor(false)}>
                    <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
                        <Field label="Doctor name">
                            <input required type="text" placeholder="Dr. Jane Smith" value={newDoctor.name} onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} className="ui-input" />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Email">
                                <input type="email" placeholder="doctor@example.com" value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} className="ui-input" />
                            </Field>
                            <Field label="Phone">
                                <input type="tel" placeholder="+91 9876543210" value={newDoctor.phone} onChange={e => setNewDoctor({...newDoctor, phone: e.target.value})} className="ui-input" />
                            </Field>
                        </div>
                        <Field label="Specialty">
                            <input required type="text" placeholder="Cardiologist" value={newDoctor.specialty} onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})} className="ui-input" />
                        </Field>
                        <Field label="Consultation fee (₹)">
                            <input required type="number" value={newDoctor.fee} onChange={e => setNewDoctor({...newDoctor, fee: Number(e.target.value)})} className="ui-input" />
                        </Field>
                        <ModalActions>
                            <button className="ui-btn-dark w-full min-h-[48px]">
                                Recruit doctor
                            </button>
                        </ModalActions>
                    </form>
                </Modal>
            )}

            {showAddSpecialtyGroup && (
                <Modal title="Create specialty group" icon={<Users className="w-5 h-5" />} onClose={() => setShowAddSpecialtyGroup(false)}>
                    <form onSubmit={handleAddSpecialtyGroupSubmit} className="space-y-4">
                        <Field label="Specialty name">
                            <input required type="text" placeholder="e.g. Cardiology" value={groupName} onChange={e => setGroupName(e.target.value)} className="ui-input" />
                        </Field>
                        <Field label="Department">
                            <input required type="text" placeholder="e.g. Department of Cardiac Sciences" value={groupDept} onChange={e => setGroupDept(e.target.value)} className="ui-input" />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Fee (₹)">
                                <input required type="number" value={groupFee} onChange={e => setGroupFee(Number(e.target.value))} className="ui-input" />
                            </Field>
                            <Field label="Max per slot">
                                <input required type="number" value={groupMaxSlots} onChange={e => setGroupMaxSlots(Number(e.target.value))} className="ui-input" />
                            </Field>
                            <Field label="Doctors count">
                                <input required type="number" value={groupDocsCount} onChange={e => setGroupDocsCount(Number(e.target.value))} className="ui-input" />
                            </Field>
                        </div>

                        <fieldset>
                            <legend className="ui-label">Availability schedule</legend>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Start time" className="[&>span]:text-xs [&>span]:text-slate-500">
                                    <input type="time" value={groupStartTime} onChange={e => setGroupStartTime(e.target.value)} className="ui-input" />
                                </Field>
                                <Field label="End time" className="[&>span]:text-xs [&>span]:text-slate-500">
                                    <input type="time" value={groupEndTime} onChange={e => setGroupEndTime(e.target.value)} className="ui-input" />
                                </Field>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="ui-label">Available days</legend>
                            <DayPicker
                                selected={groupDays}
                                onToggle={(day, checked) => {
                                    if (checked) {
                                        setGroupDays([...groupDays, day]);
                                    } else {
                                        setGroupDays(groupDays.filter(d => d !== day));
                                    }
                                }}
                            />
                        </fieldset>

                        <Field label="Description / notes">
                            <textarea placeholder="General details about the group or department..." value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="ui-input h-24 resize-none" />
                        </Field>

                        <ModalActions>
                            <button className="ui-btn-dark w-full min-h-[48px]">
                                Create specialty group
                            </button>
                        </ModalActions>
                    </form>
                </Modal>
            )}

            {showAddSlot && (
                <Modal title="Add new slot" icon={<CalendarClock className="w-5 h-5" />} onClose={() => setShowAddSlot(false)}>
                    <form onSubmit={handleAddSlotSubmit} className="space-y-4">
                        <Field label="Doctor / specialty group">
                            <select required value={addSlotDoctorId} onChange={e => setAddSlotDoctorId(e.target.value)} className="ui-input">
                                {doctors.map((doc: any) => (
                                    <option key={doc._id} value={doc._id}>
                                        {doc.name} ({doc.specialty})
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Date">
                            <input required type="date" min={new Date().toISOString().split("T")[0]} value={addSlotDate} onChange={e => setAddSlotDate(e.target.value)} className="ui-input" />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Start time">
                                <input required type="time" value={addSlotStartTime} onChange={e => setAddSlotStartTime(e.target.value)} className="ui-input" />
                            </Field>
                            <Field label="End time">
                                <input required type="time" value={addSlotEndTime} onChange={e => setAddSlotEndTime(e.target.value)} className="ui-input" />
                            </Field>
                        </div>
                        <Field label="Recurrence">
                            <select value={addSlotRecurrenceType} onChange={e => setAddSlotRecurrenceType(e.target.value as any)} className="ui-input">
                                <option value="none">Does not repeat</option>
                                <option value="daily">Repeat Daily</option>
                                <option value="weekly">Repeat on Selected Days</option>
                            </select>
                        </Field>
                        {addSlotRecurrenceType === "weekly" && (
                            <fieldset>
                                <legend className="ui-label">Repeat on days</legend>
                                <DayPicker
                                    selected={addSlotRecurrenceDays}
                                    onToggle={(day, checked) => {
                                        if (checked) {
                                            setAddSlotRecurrenceDays([...addSlotRecurrenceDays, day]);
                                        } else {
                                            setAddSlotRecurrenceDays(addSlotRecurrenceDays.filter(d => d !== day));
                                        }
                                    }}
                                />
                            </fieldset>
                        )}
                        {addSlotRecurrenceType !== "none" && (
                            <Field label="Repeat until date">
                                <input required type="date" min={addSlotDate} value={addSlotRecurrenceUntil} onChange={e => setAddSlotRecurrenceUntil(e.target.value)} className="ui-input" />
                            </Field>
                        )}
                        <ModalActions>
                            <button className="ui-btn-dark w-full min-h-[48px]">
                                Save slot(s)
                            </button>
                        </ModalActions>
                    </form>
                </Modal>
            )}

            {showCancelSlotModal && (
                <Modal title="Cancel slot" icon={<ShieldAlert className="w-5 h-5" />} iconTone="rose" onClose={() => setShowCancelSlotModal(null)}>
                    <form onSubmit={handleCancelSlotSubmit} className="space-y-4">
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                            <p className="text-sm leading-relaxed text-rose-700">
                                Warning: Cancelling this slot will automatically cancel all associated appointments for this doctor/specialty group on this date, and the patients will be automatically notified of the emergency cancellation.
                            </p>
                        </div>
                        <Field label="Cancellation reason">
                            <textarea required placeholder="Emergency meeting, doctor unavailable..." value={cancellationReason} onChange={e => setCancellationReason(e.target.value)} className="ui-input h-28 resize-none" />
                        </Field>
                        <ModalActions>
                            <button className="ui-btn-danger w-full min-h-[48px]">
                                Confirm cancellation
                            </button>
                        </ModalActions>
                    </form>
                </Modal>
            )}

            {showManualBooking && (
                <Modal title="Book walk-in appointment" icon={<Plus className="w-5 h-5" />} iconTone="emerald" onClose={() => setShowManualBooking(false)}>
                    <form onSubmit={handleManualBookingSubmit} className="space-y-4">
                        <Field label="Patient full name">
                            <input required type="text" placeholder="John Doe" value={manualPatientName} onChange={e => setManualPatientName(e.target.value)} className="ui-input" />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Patient email address">
                                <input required type="email" placeholder="john@example.com" value={manualPatientEmail} onChange={e => setManualPatientEmail(e.target.value)} className="ui-input" />
                            </Field>
                            <Field label="Patient phone number">
                                <input type="tel" placeholder="e.g. +91 98765 43210" value={manualPatientPhone} onChange={e => setManualPatientPhone(e.target.value)} className="ui-input" />
                            </Field>
                        </div>
                        <Field label="Assign doctor / specialty group">
                            <select required value={manualDoctorId} onChange={e => { setManualDoctorId(e.target.value); setManualSlotId(""); }} className="ui-input">
                                <option value="">-- Choose Staff / Group --</option>
                                {doctors.map((doc: any) => (
                                    <option key={doc._id} value={doc._id}>
                                        {doc.name} ({doc.specialty})
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Appointment date">
                                <input required type="date" min={new Date().toISOString().split("T")[0]} value={manualBookingDate} onChange={e => { setManualBookingDate(e.target.value); setManualSlotId(""); }} className="ui-input" />
                            </Field>
                            <Field label="Clinic payment status">
                                <select value={manualPaymentStatus} onChange={e => setManualPaymentStatus(e.target.value)} className="ui-input">
                                    <option value="pending">Pending Payment</option>
                                    <option value="paid">Paid (Collected at Hospital)</option>
                                </select>
                            </Field>
                        </div>

                        {manualPaymentStatus === "paid" && (
                            <Field label="Payment method">
                                <select value={manualPaymentMethod} onChange={e => setManualPaymentMethod(e.target.value)} className="ui-input">
                                    <option value="cash">Cash Collection</option>
                                    <option value="upi">UPI / QR Code</option>
                                    <option value="card">Debit / Credit Card</option>
                                    <option value="other_online">Other Online Collection</option>
                                </select>
                            </Field>
                        )}

                        {manualDoctorId && (
                            <div>
                                <Field label="Select available slot">
                                    <select required value={manualSlotId} onChange={e => setManualSlotId(e.target.value)} className="ui-input">
                                        <option value="">-- Select Slot Time --</option>
                                        {manualSlotOptions.map((s: any) => {
                                            const remaining = (s.max_appointments || 1) - (s.bookingCount || 0);
                                            return (
                                                <option key={s._id} value={s._id}>
                                                    {timeRange(s.startTime, s.endTime)} ({remaining} remaining spots)
                                                </option>
                                            );
                                        })}
                                    </select>
                                </Field>
                                {manualSlotOptions.length === 0 && (
                                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                                        No available slots found for this doctor on this date. Configure and generate slots first!
                                    </p>
                                )}
                            </div>
                        )}

                        <Field label="Booking notes / symptoms">
                            <textarea placeholder="Patient notes, reason for visit, walk-in comments..." value={manualBookingNotes} onChange={e => setManualBookingNotes(e.target.value)} className="ui-input h-24 resize-none" />
                        </Field>

                        <ModalActions>
                            <button type="submit" className="ui-btn-success w-full min-h-[48px]">
                                Confirm walk-in booking
                            </button>
                        </ModalActions>
                    </form>
                </Modal>
            )}

            {selectedPatientId && (
                <Modal
                    title="Patient records"
                    description={selectedPatientName}
                    icon={<FileText className="w-5 h-5" />}
                    maxWidth="sm:max-w-2xl"
                    onClose={() => { setSelectedPatientId(null); setSelectedPatientName(""); setPatientNotes([]); setNewNoteContent(""); }}
                >
                    {/* Notes List */}
                    <div className="space-y-3">
                        {patientNotes.length === 0 ? (
                            <p className="ui-empty">No records found for this patient.</p>
                        ) : (
                            patientNotes.map((note, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800">{note.doctor ? doctorLabel(note.doctor) : 'Hospital Staff'}</span>
                                            {note.doctor?.specialty && <span className="ui-badge border-blue-100 bg-blue-50 text-blue-700">{note.doctor.specialty}</span>}
                                        </div>
                                        <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className="sticky -bottom-5 -mx-5 sm:-mx-6 -mb-5 mt-5 px-5 sm:px-6 pt-4 pb-5 bg-white border-t border-slate-100">
                        <textarea
                            required
                            value={newNoteContent}
                            onChange={e => setNewNoteContent(e.target.value)}
                            placeholder="Add a new note, observation, or diagnosis..."
                            aria-label="New note"
                            className="ui-input h-24 resize-none mb-3"
                        />
                        <button type="submit" className="ui-btn-dark w-full min-h-[44px]">
                            Save record
                        </button>
                    </form>
                </Modal>
            )}

            {/* Payment Modal */}
            <AnimatePresence>
                {paymentModalOpen && (
                    <Modal
                        title="Record payment"
                        icon={<IndianRupee className="w-5 h-5" />}
                        iconTone="emerald"
                        maxWidth="sm:max-w-md"
                        closeOnBackdrop
                        onClose={() => setPaymentModalOpen(false)}
                    >
                        <form onSubmit={handlePaymentSubmit} className="space-y-5">
                            <div>
                                <span className="ui-label">Payment mode</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMode("online")}
                                        aria-pressed={paymentMode === "online"}
                                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-2 ${
                                            paymentMode === "online"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <CreditCard className="w-6 h-6" /> Online
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMode("offline")}
                                        aria-pressed={paymentMode === "offline"}
                                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-2 ${
                                            paymentMode === "offline"
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <IndianRupee className="w-6 h-6" /> Offline (Cash)
                                    </button>
                                </div>
                            </div>

                            <label className="block">
                                <span className="ui-label">Amount (₹)</span>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-semibold text-lg">₹</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : "")}
                                        placeholder="0.00"
                                        className="ui-input pl-10 min-h-[52px] text-xl font-semibold"
                                    />
                                </div>
                            </label>

                            <ModalActions>
                                <button
                                    type="submit"
                                    disabled={paymentSubmitting || paymentAmount === ""}
                                    className="ui-btn-success w-full min-h-[48px] text-base"
                                >
                                    {paymentSubmitting ? (
                                        <RefreshCcw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "Save payment"
                                    )}
                                </button>
                            </ModalActions>
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

const STAT_TONES = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
} as const;

function StatCard({ label, value, icon, tone = "blue", sub }: { label: string; value: React.ReactNode; icon: React.ReactNode; tone?: keyof typeof STAT_TONES; sub?: string }) {
    return (
        <div className="ui-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium leading-snug text-slate-500">{label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}>{icon}</span>
            </div>
            <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value || 0}</p>
            {sub && <p className="mt-1 text-xs leading-snug text-slate-500">{sub}</p>}
        </div>
    );
}

/** Label for appointments booked by the AI phone receptionist (bookingSource 'ai_call'). */
function AiCallBadge({ className = "" }: { className?: string }) {
    return (
        <span
            title="Booked by the AI phone receptionist"
            className={`inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 align-middle text-[11px] font-semibold text-violet-700 border border-violet-100 ${className}`}
        >
            <PhoneCall className="w-3 h-3" aria-hidden="true" /> AI call
        </span>
    );
}

const ICON_TONES = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
} as const;

/** Dialog shell shared by the dashboard forms: bottom sheet on phones, centred card on larger screens. */
function Modal({
    title,
    description,
    icon,
    iconTone = "blue",
    maxWidth = "sm:max-w-lg",
    closeOnBackdrop = false,
    bodyClassName = "px-5 py-5 sm:px-6",
    onClose,
    children,
}: {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    iconTone?: keyof typeof ICON_TONES;
    maxWidth?: string;
    closeOnBackdrop?: boolean;
    bodyClassName?: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ui-overlay"
            onClick={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) onClose();
            }}
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
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon && (
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ICON_TONES[iconTone]}`}>{icon}</span>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h3>
                            {description && <p className="mt-0.5 text-sm text-slate-500 truncate">{description}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mr-2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
            </motion.div>
        </motion.div>
    );
}

/** Keeps a form's main button visible at the bottom of a scrolling dialog. */
function ModalActions({ children }: { children: React.ReactNode }) {
    return (
        <div className="sticky -bottom-5 -mx-5 sm:-mx-6 -mb-5 mt-2 px-5 sm:px-6 py-4 bg-white/95 backdrop-blur border-t border-slate-100">
            {children}
        </div>
    );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
    return (
        <label className={`block ${className}`}>
            <span className="ui-label">{label}</span>
            {children}
        </label>
    );
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function DayPicker({ selected, onToggle }: { selected: string[]; onToggle: (day: string, checked: boolean) => void }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEEK_DAYS.map(day => {
                const checked = selected.includes(day);
                return (
                    <label
                        key={day}
                        className={`flex min-h-[40px] items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer select-none transition-colors ${
                            checked ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => onToggle(day, e.target.checked)}
                            aria-label={day}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                        />
                        <span className="font-medium" aria-hidden="true">{day.slice(0, 3)}</span>
                    </label>
                );
            })}
        </div>
    );
}
