"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Users, CalendarClock, Landmark, CreditCard,
    BellRing, ShieldCheck, FileSpreadsheet, Download, HelpCircle,
    LifeBuoy, AlertTriangle, CheckCircle2, Lock, Key, LogOut,
    RefreshCw, Plus, Edit2, Trash2, Eye, EyeOff, Save, X,
    Phone, Mail, Globe, MapPin, Clock, Calendar, Check,
    ShieldAlert, FileText, ArrowRight, Upload, Stethoscope, ChevronRight
} from "lucide-react";
import api from "@/lib/api";
import { planLabel } from "@/lib/plans";
import { SUPPORT_PHONE } from "@/content/marketing";

type SettingsSection = 
    | "profile" 
    | "staff" 
    | "appointments" 
    | "payments" 
    | "notifications" 
    | "security" 
    | "reports" 
    | "support";

interface HospitalSettingsModuleProps {
    hospital?: any;
    user?: any;
    onProfileUpdated?: () => void;
    onNavigateTab?: (tab: string) => void;
}

export default function HospitalSettingsModule({
    hospital: initialHospital,
    user,
    onProfileUpdated,
    onNavigateTab
}: HospitalSettingsModuleProps) {
    const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    // Main Data State from Backend
    const [settingsData, setSettingsData] = useState<any>(null);
    const [profileForm, setProfileForm] = useState<any>({});
    const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
    const [logoUploading, setLogoUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Section B: Staff & Doctors
    const [staffList, setStaffList] = useState<any[]>([]);
    const [doctorList, setDoctorList] = useState<any[]>([]);
    const [staffSubTab, setStaffSubTab] = useState<"doctors" | "staff" | "rbac">("doctors");
    const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
    const [showAddDoctorModal, setShowAddDoctorModal] = useState<boolean>(false);
    const [newStaff, setNewStaff] = useState({ name: "", email: "", phone: "", role: "receptionist", password: "" });
    const [newDoctor, setNewDoctor] = useState({
        name: "",
        specialty: "",
        department: "General Medicine",
        fee: 500,
        daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        startTime: "09:00",
        endTime: "17:00"
    });

    // Section C: Appointment Settings
    const [apptForm, setApptForm] = useState<any>({});

    // Section D: Payment & Bank Details
    const [showBankModal, setShowBankModal] = useState<boolean>(false);
    const [bankForm, setBankForm] = useState({
        accountHolderName: "",
        bankName: "",
        branchName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: "",
        upiId: ""
    });

    // Section E: Notification Preferences
    const [notifForm, setNotifForm] = useState<any>({});

    // Section F: Security State
    const [securityData, setSecurityData] = useState<any>(null);
    const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [pwdUpdating, setPwdUpdating] = useState(false);

    // Section G: Reports & Data Exports
    const [exportDateRange, setExportDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0]
    });
    const [exportingType, setExportingType] = useState<string | null>(null);

    // Section H: Support Tickets & Deactivation
    const [tickets, setTickets] = useState<any[]>([]);
    const [ticketForm, setTicketForm] = useState({
        subject: "",
        category: "Billing & Settlements",
        priority: "Medium",
        message: "",
        attachmentUrl: ""
    });
    const [submittingTicket, setSubmittingTicket] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [deactivateReason, setDeactivateReason] = useState("");
    const [deactivateAgreed, setDeactivateAgreed] = useState(false);
    const [submittingDeactivation, setSubmittingDeactivation] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);

    const showToastMsg = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // 1. Fetch All Settings Data from Backend
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/hospital/settings");
            if (res.data?.success) {
                const data = res.data;
                setSettingsData(data);
                
                // Populate Profile
                setProfileForm({
                    name: data.hospital?.name || "",
                    registrationNumber: data.hospital?.registrationNumber || "",
                    address: data.hospital?.address || "",
                    city: data.hospital?.city || "",
                    state: data.hospital?.state || "",
                    pincode: data.hospital?.pincode || "",
                    email: data.hospital?.email || "",
                    contactNumber: data.hospital?.contactNumber || "",
                    website: data.hospital?.website || "",
                    description: data.hospital?.description || "",
                    operatingHours: data.hospital?.operatingHours || "09:00 AM - 08:00 PM",
                    isOpen24Hours: Boolean(data.hospital?.isOpen24Hours),
                    ambulanceContact: data.hospital?.ambulanceContact || "",
                    consultationFee: data.hospital?.consultationFee || 500,
                    hospitalType: data.hospital?.hospitalType || "Private",
                    bedCapacity: data.hospital?.bedCapacity || 50,
                    lat: data.hospital?.location?.lat || 23.0225,
                    lng: data.hospital?.location?.lng || 72.5714
                });

                // Populate Appointment Settings
                setApptForm(data.appointmentSettings || {});

                // Populate Notifications
                setNotifForm(data.notificationPreferences || {});
            }
        } catch (err: any) {
            console.error("[FetchSettingsError]", err);
            showToastMsg("Failed to load hospital settings", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Fetch Staff & Doctors (Section B)
    const fetchStaffAndDoctors = useCallback(async () => {
        try {
            const res = await api.get("/hospital/settings/staff");
            if (res.data?.success) {
                setStaffList(res.data.staff || []);
                setDoctorList(res.data.doctors || []);
            }
        } catch (err) {
            console.error("Failed to load staff:", err);
        }
    }, []);

    // 3. Fetch Security Overview (Section F)
    const fetchSecurityOverview = useCallback(async () => {
        try {
            const res = await api.get("/hospital/settings/security");
            if (res.data?.success) {
                setSecurityData(res.data);
            }
        } catch (err) {
            console.error("Failed to load security overview:", err);
        }
    }, []);

    // 4. Fetch Support Tickets (Section H)
    const fetchSupportTickets = useCallback(async () => {
        try {
            const res = await api.get("/hospital/settings/support/tickets");
            if (res.data?.success) {
                setTickets(res.data.tickets || []);
            }
        } catch (err) {
            console.error("Failed to load tickets:", err);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        if (activeSection === "staff") fetchStaffAndDoctors();
        if (activeSection === "security") fetchSecurityOverview();
        if (activeSection === "support") fetchSupportTickets();
    }, [activeSection, fetchStaffAndDoctors, fetchSecurityOverview, fetchSupportTickets]);

    // Handle Profile Save
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...profileForm,
                location: { lat: Number(profileForm.lat), lng: Number(profileForm.lng) }
            };
            const res = await api.put("/hospital/settings/profile", payload);
            if (res.data?.success) {
                showToastMsg("Hospital profile saved successfully!");
                setIsEditingProfile(false);
                fetchSettings();
                if (onProfileUpdated) onProfileUpdated();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Logo Upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            showToastMsg("Only JPG, PNG, or WEBP images are supported", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToastMsg("Logo image size must be under 5MB", "error");
            return;
        }

        try {
            setLogoUploading(true);
            const formData = new FormData();
            formData.append("logo", file);
            const res = await api.post("/hospital/settings/profile/logo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data?.success) {
                showToastMsg("Hospital logo uploaded successfully!");
                fetchSettings();
                if (onProfileUpdated) onProfileUpdated();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to upload logo", "error");
        } finally {
            setLogoUploading(false);
        }
    };

    // Handle Appointment Settings Save
    const handleSaveAppointmentSettings = async () => {
        try {
            setSaving(true);
            const res = await api.put("/hospital/settings/appointments", apptForm);
            if (res.data?.success) {
                showToastMsg("Appointment settings saved successfully!");
                setApptForm(res.data.appointmentSettings);
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to save appointment settings", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Notification Preferences Save
    const handleSaveNotificationPreferences = async () => {
        try {
            setSaving(true);
            const res = await api.put("/hospital/settings/notifications", { preferences: notifForm });
            if (res.data?.success) {
                showToastMsg("Notification preferences saved successfully!");
                setNotifForm(res.data.notificationPreferences);
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to save notification preferences", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Bank Details Submission
    const handleSaveBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
            showToastMsg("Account numbers do not match", "error");
            return;
        }

        try {
            setSaving(true);
            const res = await api.put("/hospital/settings/bank-details", {
                accountHolderName: bankForm.accountHolderName,
                bankName: bankForm.bankName,
                branchName: bankForm.branchName,
                accountNumber: bankForm.accountNumber,
                ifscCode: bankForm.ifscCode,
                upiId: bankForm.upiId
            });

            if (res.data?.success) {
                showToastMsg(res.data.message || "Bank details submitted!");
                setShowBankModal(false);
                setBankForm({
                    accountHolderName: "",
                    bankName: "",
                    branchName: "",
                    accountNumber: "",
                    confirmAccountNumber: "",
                    ifscCode: "",
                    upiId: ""
                });
                fetchSettings();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to update bank details", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Add Doctor
    const handleAddDoctorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.post("/hospital/dashboard/doctors", {
                name: newDoctor.name,
                specialty: newDoctor.specialty,
                department: newDoctor.department,
                fee: Number(newDoctor.fee),
                availability: newDoctor.daysAvailable.map(day => ({
                    day,
                    startTime: newDoctor.startTime,
                    endTime: newDoctor.endTime
                }))
            });
            if (res.data) {
                showToastMsg(`Doctor ${newDoctor.name} added successfully!`);
                setShowAddDoctorModal(false);
                setNewDoctor({
                    name: "",
                    specialty: "",
                    department: "General Medicine",
                    fee: 500,
                    daysAvailable: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    startTime: "09:00",
                    endTime: "17:00"
                });
                fetchStaffAndDoctors();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to add doctor", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Add Staff
    const handleAddStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.post("/hospital/settings/staff", newStaff);
            if (res.data?.success) {
                showToastMsg(`Staff member ${newStaff.name} added as ${newStaff.role}!`);
                setShowAddStaffModal(false);
                setNewStaff({ name: "", email: "", phone: "", role: "receptionist", password: "" });
                fetchStaffAndDoctors();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to add staff member", "error");
        } finally {
            setSaving(false);
        }
    };

    // Handle Staff Status Toggle
    const handleToggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
        try {
            const res = await api.put(`/hospital/settings/staff/${staffId}`, { isActive: !currentStatus });
            if (res.data?.success) {
                showToastMsg(`Staff account ${!currentStatus ? 'activated' : 'deactivated'}`);
                fetchStaffAndDoctors();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to update staff status", "error");
        }
    };

    // Handle Staff Delete
    const handleDeleteStaff = async (staffId: string, staffName: string) => {
        if (!confirm(`Are you sure you want to remove staff member "${staffName}"? This action will revoke their login access.`)) return;
        try {
            const res = await api.delete(`/hospital/settings/staff/${staffId}`);
            if (res.data?.success) {
                showToastMsg("Staff account removed");
                fetchStaffAndDoctors();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to remove staff", "error");
        }
    };

    // Handle Change Password
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            showToastMsg("New passwords do not match", "error");
            return;
        }
        if (pwdForm.newPassword.length < 8) {
            showToastMsg("Password must be at least 8 characters long", "error");
            return;
        }

        try {
            setPwdUpdating(true);
            const res = await api.post("/hospital/settings/security/change-password", {
                currentPassword: pwdForm.currentPassword,
                newPassword: pwdForm.newPassword
            });
            if (res.data?.success) {
                showToastMsg("Password changed successfully!");
                setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to change password", "error");
        } finally {
            setPwdUpdating(false);
        }
    };

    // Handle 2FA Toggle
    const handleToggle2FA = async () => {
        try {
            const res = await api.post("/hospital/settings/security/2fa-toggle");
            if (res.data?.success) {
                showToastMsg(res.data.message);
                fetchSecurityOverview();
            }
        } catch (err: any) {
            showToastMsg("Failed to toggle Two-Factor Authentication", "error");
        }
    };

    // Handle Logout All Devices
    const handleLogoutAllDevices = async () => {
        if (!confirm("Are you sure you want to log out from all other devices? You will remain logged in on this browser.")) return;
        try {
            const res = await api.post("/hospital/settings/security/logout-all");
            if (res.data?.success) {
                showToastMsg("Logged out from all other devices!");
                fetchSecurityOverview();
            }
        } catch (err: any) {
            showToastMsg("Failed to revoke active sessions", "error");
        }
    };

    // Handle CSV Report Export
    const handleDownloadReport = async (type: "appointments" | "payments" | "doctors" | "settlements") => {
        try {
            setExportingType(type);
            const response = await api.get(`/hospital/settings/reports/export?type=${type}&startDate=${exportDateRange.startDate}&endDate=${exportDateRange.endDate}`, {
                responseType: "blob"
            });
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `pillora-${type}-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToastMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded!`);
            fetchSettings();
        } catch (err: any) {
            showToastMsg("Failed to download report", "error");
        } finally {
            setExportingType(null);
        }
    };

    // Handle Support Ticket Submit
    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmittingTicket(true);
            const res = await api.post("/hospital/settings/support/tickets", ticketForm);
            if (res.data?.success) {
                showToastMsg("Support ticket submitted! Ticket ID: #" + res.data.ticket?._id?.slice(-6));
                setTicketForm({
                    subject: "",
                    category: "Billing & Settlements",
                    priority: "Medium",
                    message: "",
                    attachmentUrl: ""
                });
                fetchSupportTickets();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to submit ticket", "error");
        } finally {
            setSubmittingTicket(false);
        }
    };

    // Handle Account Deactivation Request
    const handleDeactivationRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deactivateReason.trim()) {
            showToastMsg("Please specify the reason for deactivation", "error");
            return;
        }

        try {
            setSubmittingDeactivation(true);
            const res = await api.post("/hospital/settings/account/deactivate-request", { reason: deactivateReason });
            if (res.data?.success) {
                showToastMsg(res.data.message, "info");
                setShowDeactivateModal(false);
                fetchSettings();
            }
        } catch (err: any) {
            showToastMsg(err.response?.data?.message || "Failed to submit deactivation request", "error");
        } finally {
            setSubmittingDeactivation(false);
        }
    };

    const sectionsNav = [
        { id: "profile" as SettingsSection, label: "Hospital profile", icon: Building2, desc: "Name, branding, location, hours & identity" },
        { id: "staff" as SettingsSection, label: "Doctors & staff", icon: Users, desc: "Doctor roster, employee accounts & RBAC roles" },
        { id: "appointments" as SettingsSection, label: "Appointment settings", icon: CalendarClock, desc: "Durations, buffer times, booking rules & holidays" },
        { id: "payments" as SettingsSection, label: "Payment & bank", icon: Landmark, desc: "Masked bank account, payout ledger & 2.36% charges" },
        { id: "notifications" as SettingsSection, label: "Notifications", icon: BellRing, desc: "Channels & preference toggles for all 8 events" },
        { id: "security" as SettingsSection, label: "Security & login", icon: ShieldCheck, desc: "Password change, sessions, 2FA & login logs" },
        { id: "reports" as SettingsSection, label: "Reports & data", icon: FileSpreadsheet, desc: "One-click CSV/Excel downloads & export audit" },
        { id: "support" as SettingsSection, label: "Support & account", icon: LifeBuoy, desc: "Help tickets, subscription tier & account status" }
    ];

    if (loading) {
        return (
            <div className="ui-card flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                <RefreshCw className="mb-4 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-semibold text-slate-700">Loading Hospital Settings Module...</p>
                <p className="mt-1 text-sm text-slate-500">Retrieving profile, permissions, and configurable preferences</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast notification (same look as the dashboard toast) */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        role="status"
                        className={`fixed bottom-4 left-4 right-4 z-[9999] flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:bottom-6 sm:left-auto sm:right-6 ${
                            toast.type === "success"
                                ? "bg-emerald-600 text-white"
                                : toast.type === "error"
                                ? "bg-rose-600 text-white"
                                : "bg-blue-600 text-white"
                        }`}
                    >
                        {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="ui-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-500">Pillora Healthcare SaaS • Settings Center</p>
                            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                                Facility settings & configuration
                            </h2>
                            <p className="ui-subtitle">
                                Configure your hospital profile, doctors, appointment availability, notifications, security, and financial accounts.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
                        <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{planLabel(settingsData?.subscription?.plan)} plan</span>
                        </span>
                        {settingsData?.hospital?.is_verified ? (
                            <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Verified facility</span>
                            </span>
                        ) : (
                            <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Verification pending</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings navigation + active section */}
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">

                {/* 1. Section navigation: one scrollable row on phones and tablets, a compact list on computers */}
                <nav aria-label="Settings sections" className="min-w-0 xl:sticky xl:top-24 xl:w-56 xl:shrink-0">
                    <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 xl:flex-col xl:gap-0.5 xl:overflow-visible xl:rounded-2xl xl:border xl:border-slate-200/80 xl:bg-white xl:p-2 xl:shadow-sm">
                        <div className="hidden px-3 pb-1.5 pt-2 text-xs font-medium text-slate-500 xl:block">
                            Settings sections
                        </div>

                        {sectionsNav.map(sec => {
                            const Icon = sec.icon;
                            const isActive = activeSection === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    onClick={() => setActiveSection(sec.id)}
                                    title={sec.desc}
                                    aria-current={isActive ? "true" : undefined}
                                    className={`group flex min-h-[40px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition xl:w-full xl:gap-3 xl:rounded-xl xl:border-0 xl:px-3 xl:text-left ${
                                        isActive
                                            ? "border-blue-200 bg-blue-50 text-blue-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 xl:bg-transparent xl:hover:bg-slate-50"
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    <span className="xl:truncate">{sec.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* 2. Active section */}
                <div className="min-w-0 flex-1 space-y-6">

                    {/* ========================================================================= */}
                    {/* SECTION A: HOSPITAL PROFILE */}
                    {/* ========================================================================= */}
                    {activeSection === "profile" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    icon={<Building2 className="h-5 w-5" />}
                                    title="Hospital profile & branding"
                                    description="Manage public identity, registration details, location, and official emergency contacts."
                                />
                                <div className="flex items-center gap-2 sm:shrink-0">
                                    {!isEditingProfile ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(true)}
                                            className="ui-btn-primary w-full sm:w-auto"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            <span>Edit profile</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            className="ui-btn-secondary w-full sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Logo upload strip */}
                            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5">
                                        {settingsData?.hospital?.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={settingsData.hospital.image}
                                                alt="Hospital Logo"
                                                className="h-full w-full rounded-lg object-contain"
                                            />
                                        ) : (
                                            <Building2 className="h-7 w-7 text-slate-400" />
                                        )}
                                        {logoUploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                                                <RefreshCw className="h-5 w-5 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-900">Hospital facility logo</h4>
                                        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                                            PNG, JPG or WEBP under 5MB. Displayed on patient booking and receipts.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:shrink-0">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={logoUploading}
                                        className="ui-btn-secondary w-full sm:w-auto"
                                    >
                                        <Upload className="h-4 w-4 text-blue-600" />
                                        <span>{logoUploading ? "Uploading..." : "Change logo"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Verified notice */}
                            {settingsData?.hospital?.is_verified && (
                                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-800">
                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                                    <div>
                                        <span className="block font-semibold text-blue-900">Verified facility notice:</span>
                                        <span>
                                            Your hospital is officially verified by Pillora. Legal name and registration changes are recorded in the audit log and subject to Pillora Admin validation.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Profile form */}
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="ui-label">
                                            Hospital legal name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditingProfile}
                                            value={profileForm.name || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Registration / accreditation no.
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="e.g. NABH-2026-GUJ-1029"
                                            value={profileForm.registrationNumber || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="sm:col-span-2">
                                        <label className="ui-label">
                                            Facility address <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditingProfile}
                                            value={profileForm.address || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            City <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditingProfile}
                                            value={profileForm.city || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="ui-label">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="e.g. Gujarat"
                                            value={profileForm.state || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            PIN code
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="380009"
                                            value={profileForm.pincode || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Hospital type
                                        </label>
                                        <select
                                            disabled={!isEditingProfile}
                                            value={profileForm.hospitalType || "Private"}
                                            onChange={(e) => setProfileForm({ ...profileForm, hospitalType: e.target.value })}
                                            className={PROFILE_INPUT}
                                        >
                                            <option value="Private">Private Hospital</option>
                                            <option value="Government">Government / Public</option>
                                            <option value="Trust">Trust Hospital</option>
                                            <option value="Charitable">Charitable Clinic</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="ui-label">
                                            Official email
                                        </label>
                                        <input
                                            type="email"
                                            disabled={!isEditingProfile}
                                            value={profileForm.email || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Contact number
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            value={profileForm.contactNumber || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Emergency / ambulance line
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="+91 108"
                                            value={profileForm.ambulanceContact || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, ambulanceContact: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="ui-label">
                                            Website URL
                                        </label>
                                        <input
                                            type="url"
                                            disabled={!isEditingProfile}
                                            placeholder="https://examplehospital.in"
                                            value={profileForm.website || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                                            className={PROFILE_INPUT}
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Operating hours
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                disabled={!isEditingProfile || profileForm.isOpen24Hours}
                                                placeholder="09:00 AM - 08:00 PM"
                                                value={profileForm.operatingHours || ""}
                                                onChange={(e) => setProfileForm({ ...profileForm, operatingHours: e.target.value })}
                                                className={`${PROFILE_INPUT} min-w-0 flex-1`}
                                            />
                                            <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    disabled={!isEditingProfile}
                                                    checked={Boolean(profileForm.isOpen24Hours)}
                                                    onChange={(e) => setProfileForm({ ...profileForm, isOpen24Hours: e.target.checked })}
                                                    className="h-4 w-4 rounded border-slate-300 accent-blue-600 disabled:cursor-default"
                                                />
                                                <span>24/7 open</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="ui-label">
                                        Hospital description & facility overview
                                    </label>
                                    <textarea
                                        rows={3}
                                        disabled={!isEditingProfile}
                                        value={profileForm.description || ""}
                                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                        className={`${PROFILE_INPUT} h-24 resize-none`}
                                    />
                                </div>

                                {isEditingProfile && (
                                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            className="ui-btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="ui-btn-primary"
                                        >
                                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            <span>Save profile changes</span>
                                        </button>
                                    </div>
                                )}
                            </form>
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION B: DOCTORS & STAFF MANAGEMENT */}
                    {/* ========================================================================= */}
                    {activeSection === "staff" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    icon={<Users className="h-5 w-5" />}
                                    title="Doctors & staff management"
                                    description="Manage medical staff, receptionist accounts, and role-based permissions."
                                />
                                <div className="flex items-center gap-2 empty:hidden sm:shrink-0">
                                    {staffSubTab === "doctors" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddDoctorModal(true)}
                                            className="ui-btn-primary w-full sm:w-auto"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Add doctor</span>
                                        </button>
                                    )}
                                    {staffSubTab === "staff" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddStaffModal(true)}
                                            className="ui-btn-dark w-full sm:w-auto"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Add staff member</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sub-navigation (scrolls sideways on phones) */}
                            <div className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                                <div className="ui-segmented">
                                    <button
                                        onClick={() => setStaffSubTab("doctors")}
                                        className={`ui-segment whitespace-nowrap ${
                                            staffSubTab === "doctors" ? "ui-segment-active" : ""
                                        }`}
                                    >
                                        Doctors directory ({doctorList.length})
                                    </button>
                                    <button
                                        onClick={() => setStaffSubTab("staff")}
                                        className={`ui-segment whitespace-nowrap ${
                                            staffSubTab === "staff" ? "ui-segment-active" : ""
                                        }`}
                                    >
                                        Staff accounts ({staffList.length})
                                    </button>
                                    <button
                                        onClick={() => setStaffSubTab("rbac")}
                                        className={`ui-segment whitespace-nowrap ${
                                            staffSubTab === "rbac" ? "ui-segment-active" : ""
                                        }`}
                                    >
                                        Role permissions matrix
                                    </button>
                                </div>
                            </div>

                            {/* 1. Doctors Table */}
                            {staffSubTab === "doctors" && (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[640px] text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                                <th className="ui-th">Doctor name</th>
                                                <th className="ui-th">Specialty & dept</th>
                                                <th className="ui-th">Fee (₹)</th>
                                                <th className="ui-th">Availability</th>
                                                <th className="ui-th text-center">Status</th>
                                                <th className="ui-th text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {doctorList.map((doc: any) => (
                                                <tr key={doc._id} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="ui-td">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                                                                {doc.name.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-slate-900">{doc.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="ui-td">
                                                        <div className="font-medium text-slate-800">{doc.specialty}</div>
                                                        <div className="mt-0.5 text-xs text-slate-500">{doc.department || "General"}</div>
                                                    </td>
                                                    <td className="ui-td whitespace-nowrap font-semibold text-slate-900">
                                                        ₹{doc.fee}
                                                    </td>
                                                    <td className="ui-td max-w-[240px] text-xs leading-relaxed text-slate-500">
                                                        {(doc.availability || []).map((a: any) => a.day).join(", ") || "Mon - Fri"}
                                                    </td>
                                                    <td className="ui-td text-center">
                                                        <span className={`ui-badge ${
                                                            doc.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"
                                                        }`}>
                                                            {doc.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="ui-td text-center">
                                                        <button
                                                            onClick={async () => {
                                                                await api.put(`/hospital/dashboard/doctors/${doc._id}`, { is_active: !doc.is_active });
                                                                fetchStaffAndDoctors();
                                                            }}
                                                            className={`ui-btn ui-btn-sm min-h-[36px] ${
                                                                doc.is_active
                                                                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                            }`}
                                                        >
                                                            {doc.is_active ? "Deactivate" : "Activate"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 2. Staff Accounts Table */}
                            {staffSubTab === "staff" && (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full min-w-[600px] text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                                <th className="ui-th">Staff member</th>
                                                <th className="ui-th">Email & phone</th>
                                                <th className="ui-th">Assigned role</th>
                                                <th className="ui-th text-center">Status</th>
                                                <th className="ui-th text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {staffList.map((st: any) => (
                                                <tr key={st._id} className="transition-colors hover:bg-slate-50/60">
                                                    <td className="ui-td">
                                                        <div className="font-medium text-slate-900">{st.name}</div>
                                                        {st.isOwner && (
                                                            <span className="ui-badge mt-1 border-blue-200 bg-blue-50 text-blue-700">Primary owner</span>
                                                        )}
                                                    </td>
                                                    <td className="ui-td">
                                                        <div className="text-slate-700">{st.email}</div>
                                                        <div className="mt-0.5 text-xs text-slate-500">{st.phone || "No phone"}</div>
                                                    </td>
                                                    <td className="ui-td">
                                                        <span className="ui-badge border-slate-200 bg-slate-50 capitalize text-slate-700">
                                                            {st.role}
                                                        </span>
                                                    </td>
                                                    <td className="ui-td text-center">
                                                        <span className={`ui-badge ${
                                                            st.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                                                        }`}>
                                                            {st.isActive ? "Active" : "Disabled"}
                                                        </span>
                                                    </td>
                                                    <td className="ui-td text-right">
                                                        {!st.isOwner && (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleToggleStaffStatus(st._id, st.isActive)}
                                                                    className="ui-btn-soft ui-btn-sm min-h-[36px]"
                                                                >
                                                                    {st.isActive ? "Disable" : "Enable"}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStaff(st._id, st.name)}
                                                                    className="ui-btn ui-btn-sm min-h-[36px] text-rose-600 hover:bg-rose-50"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 3. Role Permissions Matrix */}
                            {staffSubTab === "rbac" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                                        <p className="mb-1 font-semibold text-slate-900">Role-based access control (RBAC) architecture</p>
                                        <p>Each staff login is strictly enforced server-side. Users cannot access modules beyond their granted role.</p>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full min-w-[600px] text-left">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                                    <th className="ui-th">Feature / area</th>
                                                    <th className="ui-th text-center">Owner</th>
                                                    <th className="ui-th text-center">Administrator</th>
                                                    <th className="ui-th text-center">Receptionist</th>
                                                    <th className="ui-th text-center">Doctor</th>
                                                    <th className="ui-th text-center">Accounts</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {[
                                                    { area: "Full Facility Settings & Bank Details", roles: [true, false, false, false, false] },
                                                    { area: "Doctor & Staff Account Management", roles: [true, true, false, false, false] },
                                                    { area: "Slot Generation & Availability Rules", roles: [true, true, false, true, false] },
                                                    { area: "Appointments & Walk-in Check-in", roles: [true, true, true, false, false] },
                                                    { area: "Patient Clinical Notes & Prescriptions", roles: [true, true, false, true, false] },
                                                    { area: "Cash / Online Balance Collection at Clinic", roles: [true, true, true, false, true] },
                                                    { area: "Financial Reports & Settlement Approval", roles: [true, true, false, false, true] },
                                                    { area: "Support Tickets & Closure Requests", roles: [true, true, false, false, false] }
                                                ].map((row, i) => (
                                                    <tr key={i} className="transition-colors hover:bg-slate-50/60">
                                                        <td className="ui-td align-middle font-medium text-slate-900">{row.area}</td>
                                                        {row.roles.map((granted, j) => (
                                                            <td key={j} className="ui-td text-center align-middle">
                                                                {granted ? (
                                                                    <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    </span>
                                                                ) : (
                                                                    <X className="mx-auto h-4 w-4 text-slate-300" />
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION C: APPOINTMENT SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "appointments" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    icon={<CalendarClock className="h-5 w-5" />}
                                    title="Appointment & slot preferences"
                                    description="Configure appointment durations, buffer times, advance booking windows, and cancellation rules."
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveAppointmentSettings}
                                    disabled={saving}
                                    className="ui-btn-primary w-full sm:w-auto sm:shrink-0"
                                >
                                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span>Save appointment settings</span>
                                </button>
                            </div>

                            {/* Booking Channels */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300">
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-slate-900">Online booking via Pillora</span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">Accept appointments from Pillora.in</span>
                                    </span>
                                    <span className="relative inline-flex shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(apptForm.isOnlineBookingEnabled)}
                                            onChange={(e) => setApptForm({ ...apptForm, isOnlineBookingEnabled: e.target.checked })}
                                            className="peer sr-only"
                                        />
                                        <SwitchVisual />
                                    </span>
                                </label>

                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300">
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-slate-900">Offline walk-in booking</span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">Allow receptionist counter bookings</span>
                                    </span>
                                    <span className="relative inline-flex shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(apptForm.isOfflineBookingEnabled)}
                                            onChange={(e) => setApptForm({ ...apptForm, isOfflineBookingEnabled: e.target.checked })}
                                            className="peer sr-only"
                                        />
                                        <SwitchVisual />
                                    </span>
                                </label>

                                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition-colors hover:border-slate-300">
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-slate-900">Same-day appointments</span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">Allow patients to book on current date</span>
                                    </span>
                                    <span className="relative inline-flex shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(apptForm.allowSameDayBooking)}
                                            onChange={(e) => setApptForm({ ...apptForm, allowSameDayBooking: e.target.checked })}
                                            className="peer sr-only"
                                        />
                                        <SwitchVisual />
                                    </span>
                                </label>
                            </div>

                            {/* Durations & Buffer Times */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <div>
                                    <label className="ui-label">
                                        Default appointment duration (minutes)
                                    </label>
                                    <div className="ui-segmented grid w-full grid-cols-4 gap-1">
                                        {[10, 15, 20, 30].map(dur => (
                                            <button
                                                key={dur}
                                                type="button"
                                                onClick={() => setApptForm({ ...apptForm, defaultSlotDuration: dur })}
                                                className={`ui-segment min-h-[40px] px-2 ${
                                                    apptForm.defaultSlotDuration === dur
                                                        ? "ui-segment-active"
                                                        : ""
                                                }`}
                                            >
                                                {dur} mins
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="ui-label">
                                        Buffer time between appointments
                                    </label>
                                    <div className="ui-segmented grid w-full grid-cols-4 gap-1">
                                        {[0, 5, 10, 15].map(buf => (
                                            <button
                                                key={buf}
                                                type="button"
                                                onClick={() => setApptForm({ ...apptForm, bufferTimeBetweenSlots: buf })}
                                                className={`ui-segment min-h-[40px] px-2 ${
                                                    apptForm.bufferTimeBetweenSlots === buf
                                                        ? "ui-segment-active"
                                                        : ""
                                                }`}
                                            >
                                                {buf === 0 ? "None" : `${buf} mins`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Booking Notice & Windows (the window select gets extra room for its long option text) */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
                                <div>
                                    <label className="ui-label">
                                        Max patients per slot
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={apptForm.maxAppointmentsPerSlot || 1}
                                        onChange={(e) => setApptForm({ ...apptForm, maxAppointmentsPerSlot: Number(e.target.value) })}
                                        className="ui-input"
                                    />
                                    <span className="ui-hint block">Usually 1 to avoid overlapping</span>
                                </div>

                                <div>
                                    <label className="ui-label">
                                        Advance booking window
                                    </label>
                                    <select
                                        value={apptForm.advanceBookingWindowDays || 30}
                                        onChange={(e) => setApptForm({ ...apptForm, advanceBookingWindowDays: Number(e.target.value) })}
                                        className="ui-input"
                                    >
                                        <option value={7}>Up to 7 Days Ahead</option>
                                        <option value={14}>Up to 14 Days Ahead</option>
                                        <option value={30}>Up to 30 Days Ahead (Default)</option>
                                        <option value={60}>Up to 60 Days Ahead</option>
                                        <option value={90}>Up to 90 Days Ahead</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="ui-label">
                                        Minimum notice required
                                    </label>
                                    <select
                                        value={apptForm.minBookingNoticeHours ?? 1}
                                        onChange={(e) => setApptForm({ ...apptForm, minBookingNoticeHours: Number(e.target.value) })}
                                        className="ui-input"
                                    >
                                        <option value={0}>Immediate (0 Hours)</option>
                                        <option value={1}>At least 1 Hour prior</option>
                                        <option value={2}>At least 2 Hours prior</option>
                                        <option value={4}>At least 4 Hours prior</option>
                                        <option value={24}>At least 24 Hours prior</option>
                                    </select>
                                </div>
                            </div>

                            {/* Policies: Cancellation & Rescheduling */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                    <label className="block text-sm font-semibold text-slate-900">
                                        Patient cancellation window
                                    </label>
                                    <p className="mb-3 mt-0.5 text-xs leading-relaxed text-slate-500">How many hours before appointment can patient cancel?</p>
                                    <select
                                        value={apptForm.cancellationPolicyHours ?? 2}
                                        onChange={(e) => setApptForm({ ...apptForm, cancellationPolicyHours: Number(e.target.value) })}
                                        className="ui-input"
                                    >
                                        <option value={1}>Up to 1 hour before</option>
                                        <option value={2}>Up to 2 hours before</option>
                                        <option value={4}>Up to 4 hours before</option>
                                        <option value={12}>Up to 12 hours before</option>
                                        <option value={24}>Up to 24 hours before</option>
                                    </select>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                    <label className="block text-sm font-semibold text-slate-900">
                                        Patient rescheduling window
                                    </label>
                                    <p className="mb-3 mt-0.5 text-xs leading-relaxed text-slate-500">How many hours before appointment can patient reschedule?</p>
                                    <select
                                        value={apptForm.reschedulePolicyHours ?? 2}
                                        onChange={(e) => setApptForm({ ...apptForm, reschedulePolicyHours: Number(e.target.value) })}
                                        className="ui-input"
                                    >
                                        <option value={1}>Up to 1 hour before</option>
                                        <option value={2}>Up to 2 hours before</option>
                                        <option value={4}>Up to 4 hours before</option>
                                        <option value={12}>Up to 12 hours before</option>
                                        <option value={24}>Up to 24 hours before</option>
                                    </select>
                                </div>
                            </div>

                            {/* Weekly Holidays */}
                            <div>
                                <label className="ui-label">
                                    Standard weekly closed days (facility holidays)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                                        const isClosed = (apptForm.weeklyHolidays || []).includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const cur = apptForm.weeklyHolidays || [];
                                                    const updated = isClosed ? cur.filter((d: string) => d !== day) : [...cur, day];
                                                    setApptForm({ ...apptForm, weeklyHolidays: updated });
                                                }}
                                                aria-pressed={isClosed}
                                                className={`inline-flex min-h-[40px] items-center rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                                                    isClosed
                                                        ? "border-rose-200 bg-rose-50 text-rose-700"
                                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                }`}
                                            >
                                                {day} {isClosed && "(Closed)"}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION D: PAYMENT & BANK SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "payments" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    icon={<Landmark className="h-5 w-5" />}
                                    title="Payment & bank account settings"
                                    description="Configure bank accounts for automatic payouts and review transaction fee architecture."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowBankModal(true)}
                                    className="ui-btn-dark w-full sm:w-auto sm:shrink-0"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    <span>Update bank account</span>
                                </button>
                            </div>

                            {/* Masked Bank Account Card */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 ring-1 ring-slate-200">
                                            <Landmark className="h-4 w-4" />
                                        </span>
                                        <span className="text-sm font-semibold text-slate-900">
                                            Designated settlement bank account
                                        </span>
                                    </div>
                                    <span className={`ui-badge ${
                                        settingsData?.hospital?.bankDetails?.verificationStatus === "Verified"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-amber-200 bg-amber-50 text-amber-700"
                                    }`}>
                                        {settingsData?.hospital?.bankDetails?.verificationStatus || "Pending Verification"}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <p className="text-xs font-medium text-slate-500">Account number</p>
                                    <p className="mt-1 break-all font-mono text-xl font-semibold tracking-wider text-slate-900 sm:text-2xl">
                                        {settingsData?.hospital?.bankDetails?.accountNumberMasked || "•••• •••• ••••"}
                                    </p>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-4">
                                    <div className="min-w-0">
                                        <span className="block text-xs font-medium text-slate-500">Account holder</span>
                                        <span className="mt-0.5 block truncate text-sm font-medium text-slate-900">
                                            {settingsData?.hospital?.bankDetails?.accountHolderName || "Not Configured"}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-xs font-medium text-slate-500">Bank name</span>
                                        <span className="mt-0.5 block truncate text-sm font-medium text-slate-900">
                                            {settingsData?.hospital?.bankDetails?.bankName || "Not Configured"}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-xs font-medium text-slate-500">IFSC code</span>
                                        <span className="mt-0.5 block truncate font-mono text-sm font-medium text-slate-900">
                                            {settingsData?.hospital?.bankDetails?.ifscCode || "Not Configured"}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-xs font-medium text-slate-500">UPI ID (optional)</span>
                                        <span className="mt-0.5 block truncate font-mono text-sm font-medium text-slate-900">
                                            {settingsData?.hospital?.bankDetails?.upiId || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Bank Review Alert */}
                            {settingsData?.bankDetailsPendingApproval?.status === "pending" && (
                                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                                        <Clock className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 text-sm leading-relaxed text-amber-800">
                                        <span className="block font-semibold text-amber-900">Bank update under review:</span>
                                        <span>
                                            You submitted an update for bank account ending in{" "}
                                            <strong className="font-semibold text-amber-900">{settingsData.bankDetailsPendingApproval.accountNumber?.slice(-4)}</strong>. Pillora Admin is verifying this account for settlement compliance.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Platform Charges Explainer (2.36%) */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                                        <CreditCard className="h-4 w-4 shrink-0" />
                                        <span>Pillora zero commission policy</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Pillora operates on a transparent model. <strong className="font-semibold text-slate-800">100% of doctor consultation fees belong to your hospital.</strong> We do not take commissions on consultations.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                                        <Landmark className="h-4 w-4 shrink-0" />
                                        <span>Gateway deduction (2.36%)</span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Online advance payments incur <strong className="font-semibold text-slate-800">2.00% Razorpay processing fee + 18% GST (2.36% total)</strong>. This is deducted directly by the banking switch before payout.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION E: NOTIFICATION SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "notifications" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    icon={<BellRing className="h-5 w-5" />}
                                    title="Notification channel preferences"
                                    description="Configure individual delivery channels (Email, SMS, WhatsApp, and In-Dashboard) for every operational event."
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveNotificationPreferences}
                                    disabled={saving}
                                    className="ui-btn-primary w-full sm:w-auto sm:shrink-0"
                                >
                                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span>Save notification rules</span>
                                </button>
                            </div>

                            {/* Phones: one card per event with the four channels in a row. md and up: a regular table. */}
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="block w-full text-left md:table">
                                    <thead className="hidden md:table-header-group">
                                        <tr className="border-b border-slate-100 bg-slate-50/80">
                                            <th className="ui-th">Notification event</th>
                                            <th className="ui-th text-center">Email</th>
                                            <th className="ui-th text-center">SMS</th>
                                            <th className="ui-th text-center">WhatsApp</th>
                                            <th className="ui-th text-center">In-Dashboard</th>
                                        </tr>
                                    </thead>
                                    <tbody className="block divide-y divide-slate-100 md:table-row-group">
                                        {[
                                            { key: "newAppointment", label: "New Appointment Booked", desc: "Instant alert when patient reserves a slot" },
                                            { key: "appointmentCancellation", label: "Appointment Cancellation", desc: "When a patient or doctor cancels" },
                                            { key: "appointmentRescheduled", label: "Appointment Rescheduled", desc: "Slot time or doctor changes" },
                                            { key: "paymentReceived", label: "Patient Payment Received", desc: "Advance or clinic collection confirmations" },
                                            { key: "patientArrival", label: "Patient Arrival at Clinic", desc: "Check-in at reception counter" },
                                            { key: "doctorAvailability", label: "Doctor Availability Changes", desc: "Schedule or emergency leaves" },
                                            { key: "dailySummary", label: "Daily Operations Summary", desc: "Morning summary of scheduled appointments" },
                                            { key: "settlementUpdates", label: "Settlement & Payout Payouts", desc: "Mandatory compliance notices", mandatory: true }
                                        ].map(item => {
                                            const channels = notifForm[item.key] || { email: true, sms: true, whatsapp: true, inApp: true };
                                            return (
                                                <tr key={item.key} className="grid grid-cols-4 gap-x-1.5 gap-y-3 p-4 transition-colors hover:bg-slate-50/60 md:table-row md:p-0">
                                                    <td className="col-span-4 md:table-cell md:px-4 md:py-3.5 md:align-middle">
                                                        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                                                            <span>{item.label}</span>
                                                            {item.mandatory && (
                                                                <span className="ui-badge border-blue-200 bg-blue-50 text-blue-700">
                                                                    Required
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 text-xs text-slate-500">{item.desc}</div>
                                                    </td>
                                                    {(["email", "sms", "whatsapp", "inApp"] as const).map(ch => (
                                                        <td key={ch} className="md:table-cell md:px-4 md:py-3.5 md:text-center md:align-middle">
                                                            <label className="flex h-full min-h-[52px] cursor-pointer flex-col items-center justify-start gap-1 rounded-lg border border-slate-200 bg-white px-0.5 pb-1.5 pt-2.5 has-[:disabled]:cursor-not-allowed md:inline-flex md:h-10 md:min-h-0 md:w-10 md:justify-center md:border-0 md:bg-transparent md:p-0">
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={item.mandatory}
                                                                    checked={Boolean(channels[ch])}
                                                                    onChange={(e) => {
                                                                        const updated = {
                                                                            ...notifForm,
                                                                            [item.key]: {
                                                                                ...channels,
                                                                                [ch]: e.target.checked
                                                                            }
                                                                        };
                                                                        setNotifForm(updated);
                                                                    }}
                                                                    aria-label={`${item.label}: ${CHANNEL_LABELS[ch]}`}
                                                                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                                                                />
                                                                <span aria-hidden="true" className="text-center text-[11px] font-medium leading-tight text-slate-500 md:hidden">
                                                                    {CHANNEL_LABELS[ch]}
                                                                </span>
                                                            </label>
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION F: SECURITY & LOGIN SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "security" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="border-b border-slate-100 pb-5">
                                <SectionHeading
                                    icon={<ShieldCheck className="h-5 w-5" />}
                                    title="Security & login sessions"
                                    description="Manage password, authorized devices, and active login credentials."
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                                {/* Change Password Form */}
                                <form onSubmit={handleChangePassword} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <Key className="h-4 w-4 text-blue-600" />
                                        <span>Change password</span>
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Current password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPwd ? "text" : "password"}
                                                required
                                                value={pwdForm.currentPassword}
                                                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                                className="ui-input pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                                aria-label="Toggle password visibility"
                                                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                            >
                                                {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            New password (min 8 chars)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPwd ? "text" : "password"}
                                                required
                                                minLength={8}
                                                value={pwdForm.newPassword}
                                                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                                className="ui-input pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPwd(!showNewPwd)}
                                                aria-label="Toggle password visibility"
                                                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                            >
                                                {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Confirm new password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={pwdForm.confirmPassword}
                                            onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                                            className="ui-input"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={pwdUpdating}
                                        className="ui-btn-primary w-full"
                                    >
                                        {pwdUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        <span>Update password</span>
                                    </button>
                                </form>

                                {/* 2FA & Active Sessions */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-semibold text-slate-900">Two-factor authentication (2FA)</h4>
                                            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Require additional security code upon login</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleToggle2FA}
                                            className={`shrink-0 ${
                                                securityData?.twoFactorAuthEnabled
                                                    ? "ui-btn-success"
                                                    : "ui-btn-secondary"
                                            }`}
                                        >
                                            {securityData?.twoFactorAuthEnabled ? "Enabled" : "Disabled"}
                                        </button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-semibold text-slate-900">Active login sessions</h4>
                                            <button
                                                type="button"
                                                onClick={handleLogoutAllDevices}
                                                className="ui-btn ui-btn-sm min-h-[36px] bg-rose-50 text-rose-700 hover:bg-rose-100"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                <span>Logout all other devices</span>
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {(securityData?.activeSessions || []).slice(0, 3).map((sess: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-slate-900">{sess.ipAddress}</div>
                                                        <div className="truncate text-xs text-slate-500">{sess.userAgent?.slice(0, 35)}...</div>
                                                    </div>
                                                    <span className="shrink-0 text-xs font-medium text-slate-500">
                                                        {new Date(sess.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION G: REPORTS & DATA MANAGEMENT */}
                    {/* ========================================================================= */}
                    {activeSection === "reports" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="space-y-4 border-b border-slate-100 pb-5">
                                <SectionHeading
                                    icon={<FileSpreadsheet className="h-5 w-5" />}
                                    title="Reports & data exports"
                                    description="One-click CSV downloads for appointments, financial payments, doctors, and settlement history."
                                />

                                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex">
                                    <input
                                        type="date"
                                        value={exportDateRange.startDate}
                                        onChange={(e) => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                                        aria-label="Start date"
                                        className="ui-input min-w-0 sm:w-44"
                                    />
                                    <span className="text-sm text-slate-500">to</span>
                                    <input
                                        type="date"
                                        value={exportDateRange.endDate}
                                        onChange={(e) => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                                        aria-label="End date"
                                        className="ui-input min-w-0 sm:w-44"
                                    />
                                </div>
                            </div>

                            {/* Download Action Cards */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                                {[
                                    { type: "appointments" as const, title: "Appointments report", desc: "Tokens, patient details, status, fees" },
                                    { type: "payments" as const, title: "Payments ledger", desc: "Advances, clinic collections & status" },
                                    { type: "doctors" as const, title: "Doctor directory", desc: "Specialties, fees, schedules & status" },
                                    { type: "settlements" as const, title: "Settlement payouts", desc: "Payout records, UTRs & 2.36% charges" }
                                ].map(rep => (
                                    <div key={rep.type} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 sm:p-5">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <FileSpreadsheet className="h-5 w-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-slate-900">{rep.title}</h4>
                                                <p className="mt-0.5 text-sm leading-snug text-slate-500">{rep.desc}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={exportingType === rep.type}
                                            onClick={() => handleDownloadReport(rep.type)}
                                            className="ui-btn-secondary mt-4 w-full"
                                        >
                                            {exportingType === rep.type ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                            <span>Export CSV</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION H: SUPPORT & ACCOUNT MANAGEMENT */}
                    {/* ========================================================================= */}
                    {activeSection === "support" && (
                        <section className="ui-card space-y-6 p-5 sm:p-6">
                            <div className="border-b border-slate-100 pb-5">
                                <SectionHeading
                                    icon={<LifeBuoy className="h-5 w-5" />}
                                    title="Support & account management"
                                    description="Raise support tickets, view platform agreement, and manage facility subscription."
                                />
                            </div>

                            {/* Hotline & Contact strip */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-4 md:flex-col md:items-start">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Mail className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-medium text-slate-500">Support email</div>
                                        <div className="break-all text-sm font-semibold text-slate-900">support@pillora.in</div>
                                    </div>
                                </div>

                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-4 md:flex-col md:items-start">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <Phone className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-medium text-slate-500">Partner hotline</div>
                                        <div className="text-sm font-semibold text-slate-900">{SUPPORT_PHONE.display}</div>
                                    </div>
                                </div>

                                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-4 md:flex-col md:items-start">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <FileText className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-medium text-slate-500">Hospital agreement</div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAgreementModal(true)}
                                            className="text-left text-sm font-semibold text-indigo-700 hover:underline"
                                        >
                                            View Terms & Privacy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Raise Support Ticket Form */}
                            <form onSubmit={handleCreateTicket} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <LifeBuoy className="h-4 w-4 text-blue-600" />
                                    <span>Raise a support ticket with Pillora</span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="sm:col-span-2">
                                        <label className="ui-label">
                                            Ticket subject <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Query regarding settlement UTR reference"
                                            value={ticketForm.subject}
                                            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                            className="ui-input"
                                        />
                                    </div>

                                    <div>
                                        <label className="ui-label">
                                            Category
                                        </label>
                                        <select
                                            value={ticketForm.category}
                                            onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                                            className="ui-input"
                                        >
                                            <option value="Billing & Settlements">Billing & Settlements</option>
                                            <option value="Appointments & Slots">Appointments & Slots</option>
                                            <option value="Doctor Management">Doctor Management</option>
                                            <option value="Technical Issue">Technical Issue</option>
                                            <option value="General Support">General Support</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="ui-label">
                                        Issue description <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Please provide details about your issue..."
                                        value={ticketForm.message}
                                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                                        className="ui-input h-24 resize-none"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submittingTicket}
                                        className="ui-btn-primary w-full sm:w-auto"
                                    >
                                        {submittingTicket ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
                                        <span>Submit ticket</span>
                                    </button>
                                </div>
                            </form>

                            {/* Ticket History */}
                            {tickets.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-900">Your submitted tickets</h4>
                                    <div className="space-y-2">
                                        {tickets.map(t => (
                                            <div key={t._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-slate-900">{t.subject}</div>
                                                    <div className="mt-0.5 text-xs text-slate-500">
                                                        Category: {t.category || t.type} • {new Date(t.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                    </div>
                                                </div>
                                                <span className={`ui-badge shrink-0 ${
                                                    t.status === "Resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Danger Zone: Account Deactivation */}
                            <div className="border-t border-slate-100 pt-6">
                                <div className="flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                    <div className="min-w-0">
                                        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-rose-700">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>Facility account closure & deactivation</span>
                                        </div>
                                        <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                                            Account deactivations are reviewed by Pillora Admin to ensure all past patient consultations and financial settlements are cleared per data retention guidelines.
                                        </p>
                                    </div>

                                    {settingsData?.deactivationRequest?.requested ? (
                                        <span className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-800">
                                            Request pending review
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeactivateModal(true)}
                                            className="ui-btn-danger w-full shrink-0 sm:w-auto"
                                        >
                                            Request deactivation
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Modal: Update Bank Account */}
            <AnimatePresence>
                {showBankModal && (
                    <SettingsModal
                        title="Update settlement bank account"
                        icon={<Landmark className="h-5 w-5" />}
                        onClose={() => setShowBankModal(false)}
                    >
                        <form onSubmit={handleSaveBankDetails} className="space-y-4">
                            <div>
                                <label className="ui-label">Account holder name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={bankForm.accountHolderName}
                                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                                    className="ui-input"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="ui-label">Bank name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={bankForm.bankName}
                                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                                <div>
                                    <label className="ui-label">Branch name</label>
                                    <input
                                        type="text"
                                        value={bankForm.branchName}
                                        onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="ui-label">Bank account number <span className="text-rose-500">*</span></label>
                                <input
                                    type="password"
                                    required
                                    value={bankForm.accountNumber}
                                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                    className="ui-input font-mono"
                                />
                            </div>

                            <div>
                                <label className="ui-label">Confirm account number <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={bankForm.confirmAccountNumber}
                                    onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                                    className="ui-input font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="ui-label">IFSC code <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={bankForm.ifscCode}
                                        onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                                        className="ui-input font-mono uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="ui-label">UPI ID (optional)</label>
                                    <input
                                        type="text"
                                        value={bankForm.upiId}
                                        onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                                        className="ui-input font-mono"
                                    />
                                </div>
                            </div>

                            <ModalActions>
                                <button
                                    type="button"
                                    onClick={() => setShowBankModal(false)}
                                    className="ui-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="ui-btn-primary"
                                >
                                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                                    <span>Submit for verification</span>
                                </button>
                            </ModalActions>
                        </form>
                    </SettingsModal>
                )}
            </AnimatePresence>

            {/* Modal: Add Doctor */}
            <AnimatePresence>
                {showAddDoctorModal && (
                    <SettingsModal
                        title="Add new doctor to facility"
                        icon={<Stethoscope className="h-5 w-5" />}
                        onClose={() => setShowAddDoctorModal(false)}
                    >
                        <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
                            <div>
                                <label className="ui-label">Doctor name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Dr. Rajesh Patel"
                                    value={newDoctor.name}
                                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                    className="ui-input"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="ui-label">Specialty <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Cardiology"
                                        value={newDoctor.specialty}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                                <div>
                                    <label className="ui-label">Consultation fee (₹) <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        required
                                        min={50}
                                        value={newDoctor.fee}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, fee: Number(e.target.value) })}
                                        className="ui-input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="ui-label">Daily start time</label>
                                    <input
                                        type="time"
                                        value={newDoctor.startTime}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, startTime: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                                <div>
                                    <label className="ui-label">Daily end time</label>
                                    <input
                                        type="time"
                                        value={newDoctor.endTime}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, endTime: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                            </div>

                            <ModalActions>
                                <button
                                    type="button"
                                    onClick={() => setShowAddDoctorModal(false)}
                                    className="ui-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="ui-btn-primary"
                                >
                                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                                    <span>Add doctor profile</span>
                                </button>
                            </ModalActions>
                        </form>
                    </SettingsModal>
                )}
            </AnimatePresence>

            {/* Modal: Add Staff */}
            <AnimatePresence>
                {showAddStaffModal && (
                    <SettingsModal
                        title="Add staff account & set permissions"
                        icon={<Users className="h-5 w-5" />}
                        onClose={() => setShowAddStaffModal(false)}
                    >
                        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
                            <div>
                                <label className="ui-label">Employee full name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    className="ui-input"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="ui-label">Email (login ID) <span className="text-rose-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                                <div>
                                    <label className="ui-label">Phone number</label>
                                    <input
                                        type="text"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="ui-label">Assigned role <span className="text-rose-500">*</span></label>
                                    <select
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className="ui-input"
                                    >
                                        <option value="receptionist">Receptionist (Appointments & Check-in)</option>
                                        <option value="administrator">Administrator (Operations & Staff)</option>
                                        <option value="doctor">Doctor (Patient Care & Notes)</option>
                                        <option value="accounts">Accounts Staff (Billing & Reports)</option>
                                        <option value="owner">Hospital Owner (Full Access)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="ui-label">Login password <span className="text-rose-500">*</span></label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newStaff.password}
                                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        className="ui-input"
                                    />
                                </div>
                            </div>

                            <ModalActions>
                                <button
                                    type="button"
                                    onClick={() => setShowAddStaffModal(false)}
                                    className="ui-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="ui-btn-dark"
                                >
                                    {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                                    <span>Create staff account</span>
                                </button>
                            </ModalActions>
                        </form>
                    </SettingsModal>
                )}
            </AnimatePresence>

            {/* Modal: Deactivate Account */}
            <AnimatePresence>
                {showDeactivateModal && (
                    <SettingsModal
                        title="Request account deactivation"
                        icon={<AlertTriangle className="h-5 w-5" />}
                        tone="rose"
                        onClose={() => setShowDeactivateModal(false)}
                    >
                        <form onSubmit={handleDeactivationRequest} className="space-y-4">
                            <p className="text-sm leading-relaxed text-slate-600">
                                Submitting this request sends a formal closure notice to Pillora Admin. In accordance with healthcare data retention requirements, past patient records and confirmed financial settlements will be archived safely.
                            </p>

                            <div>
                                <label className="ui-label">Reason for deactivation <span className="text-rose-500">*</span></label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="e.g. Facility restructuring or closure..."
                                    value={deactivateReason}
                                    onChange={(e) => setDeactivateReason(e.target.value)}
                                    className="ui-input h-24 resize-none"
                                />
                            </div>

                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                                <input
                                    type="checkbox"
                                    required
                                    checked={deactivateAgreed}
                                    onChange={(e) => setDeactivateAgreed(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-rose-600"
                                />
                                <span>I understand that this request will be sent to Pillora Admin for review and settlement reconciliation.</span>
                            </label>

                            <ModalActions>
                                <button
                                    type="button"
                                    onClick={() => setShowDeactivateModal(false)}
                                    className="ui-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingDeactivation || !deactivateAgreed}
                                    className="ui-btn-danger"
                                >
                                    {submittingDeactivation && <RefreshCw className="h-4 w-4 animate-spin" />}
                                    <span>Submit closure request</span>
                                </button>
                            </ModalActions>
                        </form>
                    </SettingsModal>
                )}
            </AnimatePresence>

            {/* Modal: View Agreement */}
            <AnimatePresence>
                {showAgreementModal && (
                    <SettingsModal
                        title="Pillora Healthcare SaaS Partner Agreement"
                        icon={<FileText className="h-5 w-5" />}
                        maxWidth="sm:max-w-2xl"
                        onClose={() => setShowAgreementModal(false)}
                    >
                        <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                            <div>
                                <h4 className="font-semibold text-slate-900">1. Zero Commission Business Model</h4>
                                <p className="mt-1">Pillora does not take commissions from consultation fees charged by medical practitioners. Online advances belong entirely to the hospital minus 2.36% banking gateway fees.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-900">2. Patient Data & Clinical Privacy</h4>
                                <p className="mt-1">Hospital staff are bound by HIPAA & Indian Digital Personal Data Protection Act compliance. Patient consultation records must remain strictly confidential.</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-900">3. Settlement Protocol</h4>
                                <p className="mt-1">All online advances transferred via NEFT/IMPS/UPI require mutual receipt verification to ensure complete transparency between Pillora and your facility.</p>
                            </div>
                        </div>
                        <ModalActions>
                            <button
                                type="button"
                                onClick={() => setShowAgreementModal(false)}
                                className="ui-btn-dark"
                            >
                                Close
                            </button>
                        </ModalActions>
                    </SettingsModal>
                )}
            </AnimatePresence>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Presentational helpers (same patterns as the hospital dashboard)            */
/* -------------------------------------------------------------------------- */

/** Profile fields stay disabled until "Edit profile" is pressed, so keep their values easy to read while disabled. */
const PROFILE_INPUT = "ui-input disabled:cursor-default disabled:text-slate-700 disabled:opacity-100";

/** Channel names shown under each checkbox on phones (the table header is hidden there). */
const CHANNEL_LABELS = { email: "Email", sms: "SMS", whatsapp: "WhatsApp", inApp: "In-Dashboard" } as const;

/** Icon chip + title + description used at the top of every settings section. */
function SectionHeading({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</span>
            <div className="min-w-0">
                <h3 className="ui-title">{title}</h3>
                <p className="ui-subtitle">{description}</p>
            </div>
        </div>
    );
}

/** Track and knob drawn after a `peer sr-only` checkbox (both inside a `relative` wrapper) so it looks like a switch. */
function SwitchVisual() {
    return (
        <>
            <span
                aria-hidden="true"
                className="block h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-500/20"
            />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
            />
        </>
    );
}

/** Dialog shell: bottom sheet on phones, centred card on larger screens (same look as the dashboard dialogs). */
function SettingsModal({
    title,
    icon,
    tone = "blue",
    maxWidth = "sm:max-w-lg",
    onClose,
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    tone?: "blue" | "rose";
    maxWidth?: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // !mt-0: the module root is `space-y-6`, which would otherwise push this fixed backdrop 24px down.
            className="ui-overlay !mt-0"
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
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        {icon && (
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"}`}>
                                {icon}
                            </span>
                        )}
                        <h3 className="text-lg font-semibold leading-tight text-slate-900">{title}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="-mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            </motion.div>
        </motion.div>
    );
}

/** Keeps a dialog's buttons visible at the bottom while its body scrolls. */
function ModalActions({ children }: { children: React.ReactNode }) {
    return (
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
            {children}
        </div>
    );
}

