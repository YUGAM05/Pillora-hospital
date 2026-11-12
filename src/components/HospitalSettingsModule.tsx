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
        { id: "profile" as SettingsSection, label: "Hospital Profile", icon: Building2, desc: "Name, branding, location, hours & identity" },
        { id: "staff" as SettingsSection, label: "Doctors & Staff", icon: Users, desc: "Doctor roster, employee accounts & RBAC roles" },
        { id: "appointments" as SettingsSection, label: "Appointment Settings", icon: CalendarClock, desc: "Durations, buffer times, booking rules & holidays" },
        { id: "payments" as SettingsSection, label: "Payment & Bank", icon: Landmark, desc: "Masked bank account, payout ledger & 2.36% charges" },
        { id: "notifications" as SettingsSection, label: "Notifications", icon: BellRing, desc: "Channels & preference toggles for all 8 events" },
        { id: "security" as SettingsSection, label: "Security & Login", icon: ShieldCheck, desc: "Password change, sessions, 2FA & login logs" },
        { id: "reports" as SettingsSection, label: "Reports & Data", icon: FileSpreadsheet, desc: "One-click CSV/Excel downloads & export audit" },
        { id: "support" as SettingsSection, label: "Support & Account", icon: LifeBuoy, desc: "Help tickets, subscription tier & account status" }
    ];

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-700">Loading Hospital Settings Module...</p>
                <p className="text-xs text-slate-400 mt-1">Retrieving profile, permissions, and configurable preferences</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black border ${
                            toast.type === "success" 
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20" 
                                : toast.type === "error"
                                ? "bg-rose-600 text-white border-rose-500 shadow-rose-900/20"
                                : "bg-blue-600 text-white border-blue-500 shadow-blue-900/20"
                        }`}
                    >
                        {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider mb-2 border border-blue-400/20">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span>Pillora Healthcare SaaS • Settings Center</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Facility Settings & Configuration
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                            Configure your hospital profile, doctors, appointment availability, notifications, security, and financial accounts.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/10 text-xs font-black text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{settingsData?.subscription?.plan || "Standard"} Tier</span>
                        </div>
                        {settingsData?.hospital?.is_verified ? (
                            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Verified Facility</span>
                            </div>
                        ) : (
                            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Verification Pending</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Settings Grid: Navigation Sidebar + Active Section Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* 1. Sections Sidebar Navigation (3 cols) */}
                <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-3xl p-3 sm:p-4 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-1.5 sticky top-24">
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Settings Sections
                    </div>

                    {sectionsNav.map(sec => {
                        const Icon = sec.icon;
                        const isActive = activeSection === sec.id;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => setActiveSection(sec.id)}
                                className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 relative group ${
                                    isActive 
                                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/15" 
                                        : "hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                                <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                                    isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600"
                                }`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                    <h4 className={`text-xs font-black leading-tight ${isActive ? "text-white" : "text-slate-900"}`}>
                                        {sec.label}
                                    </h4>
                                    <p className={`text-[10px] font-medium leading-snug truncate mt-0.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                                        {sec.desc}
                                    </p>
                                </div>
                                <ChevronRight className={`w-4 h-4 shrink-0 self-center transition-transform ${
                                    isActive ? "text-white translate-x-0.5" : "text-slate-300 opacity-0 group-hover:opacity-100"
                                }`} />
                            </button>
                        );
                    })}
                </div>

                {/* 2. Active Section Main Canvas (9 cols) */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">

                    {/* ========================================================================= */}
                    {/* SECTION A: HOSPITAL PROFILE */}
                    {/* ========================================================================= */}
                    {activeSection === "profile" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Hospital Profile & Branding</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Manage public identity, registration details, location, and official emergency contacts.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isEditingProfile ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(true)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span>Edit Profile</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Logo Upload Strip */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                        {settingsData?.hospital?.image ? (
                                            <img
                                                src={settingsData.hospital.image}
                                                alt="Hospital Logo"
                                                className="w-full h-full object-contain rounded-xl"
                                            />
                                        ) : (
                                            <Building2 className="w-8 h-8 text-slate-400" />
                                        )}
                                        {logoUploading && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                <RefreshCw className="w-5 h-5 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900">Hospital Facility Logo</h4>
                                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                            PNG, JPG or WEBP under 5MB. Displayed on patient booking and receipts.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
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
                                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                                        <span>{logoUploading ? "Uploading..." : "Change Logo"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Verified Warning */}
                            {settingsData?.hospital?.is_verified && (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
                                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold block">Verified Facility Notice:</span>
                                        <span>
                                            Your hospital is officially verified by Pillora. Legal name and registration changes are recorded in the audit log and subject to Pillora Admin validation.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Profile Form */}
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Hospital Legal Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditingProfile}
                                            value={profileForm.name || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Registration / Accreditation No.
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="e.g. NABH-2026-GUJ-1029"
                                            value={profileForm.registrationNumber || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Facility Address <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditingProfile}
                                            value={profileForm.address || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            City <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isEditingProfile}
                                            value={profileForm.city || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="e.g. Gujarat"
                                            value={profileForm.state || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            PIN Code
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="380009"
                                            value={profileForm.pincode || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Hospital Type
                                        </label>
                                        <select
                                            disabled={!isEditingProfile}
                                            value={profileForm.hospitalType || "Private"}
                                            onChange={(e) => setProfileForm({ ...profileForm, hospitalType: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Private">Private Hospital</option>
                                            <option value="Government">Government / Public</option>
                                            <option value="Trust">Trust Hospital</option>
                                            <option value="Charitable">Charitable Clinic</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Official Email
                                        </label>
                                        <input
                                            type="email"
                                            disabled={!isEditingProfile}
                                            value={profileForm.email || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Contact Number
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            value={profileForm.contactNumber || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Emergency / Ambulance Line
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!isEditingProfile}
                                            placeholder="+91 108"
                                            value={profileForm.ambulanceContact || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, ambulanceContact: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Website URL
                                        </label>
                                        <input
                                            type="url"
                                            disabled={!isEditingProfile}
                                            placeholder="https://examplehospital.in"
                                            value={profileForm.website || ""}
                                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                            Operating Hours
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                disabled={!isEditingProfile || profileForm.isOpen24Hours}
                                                placeholder="09:00 AM - 08:00 PM"
                                                value={profileForm.operatingHours || ""}
                                                onChange={(e) => setProfileForm({ ...profileForm, operatingHours: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <label className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-slate-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    disabled={!isEditingProfile}
                                                    checked={Boolean(profileForm.isOpen24Hours)}
                                                    onChange={(e) => setProfileForm({ ...profileForm, isOpen24Hours: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                                <span>24/7 Open</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Hospital Description & Facility Overview
                                    </label>
                                    <textarea
                                        rows={3}
                                        disabled={!isEditingProfile}
                                        value={profileForm.description || ""}
                                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 disabled:opacity-70 disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {isEditingProfile && (
                                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                            <span>Save Profile Changes</span>
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION B: DOCTORS & STAFF MANAGEMENT */}
                    {/* ========================================================================= */}
                    {activeSection === "staff" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Doctors & Staff Management</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Manage medical staff, receptionist accounts, and role-based permissions.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {staffSubTab === "doctors" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddDoctorModal(true)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Doctor</span>
                                        </button>
                                    )}
                                    {staffSubTab === "staff" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddStaffModal(true)}
                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Add Staff Member</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sub-Navigation */}
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <button
                                    onClick={() => setStaffSubTab("doctors")}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                        staffSubTab === "doctors" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    Doctors Directory ({doctorList.length})
                                </button>
                                <button
                                    onClick={() => setStaffSubTab("staff")}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                        staffSubTab === "staff" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    Staff Accounts ({staffList.length})
                                </button>
                                <button
                                    onClick={() => setStaffSubTab("rbac")}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                        staffSubTab === "rbac" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    Role Permissions Matrix
                                </button>
                            </div>

                            {/* 1. Doctors Table */}
                            {staffSubTab === "doctors" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="py-3 px-4">Doctor Name</th>
                                                <th className="py-3 px-4">Specialty & Dept</th>
                                                <th className="py-3 px-4">Fee (₹)</th>
                                                <th className="py-3 px-4">Availability</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 px-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {doctorList.map((doc: any) => (
                                                <tr key={doc._id} className="hover:bg-slate-50">
                                                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                                                            {doc.name.charAt(0)}
                                                        </div>
                                                        <span>{doc.name}</span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600">
                                                        <div className="font-bold">{doc.specialty}</div>
                                                        <div className="text-[10px] text-slate-400">{doc.department || "General"}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-black text-slate-900">
                                                        ₹{doc.fee}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                                                        {(doc.availability || []).map((a: any) => a.day).join(", ") || "Mon - Fri"}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            doc.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                                                        }`}>
                                                            {doc.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <button
                                                            onClick={async () => {
                                                                await api.put(`/hospital/dashboard/doctors/${doc._id}`, { is_active: !doc.is_active });
                                                                fetchStaffAndDoctors();
                                                            }}
                                                            className="text-xs font-bold text-blue-600 hover:underline"
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
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="py-3 px-4">Staff Member</th>
                                                <th className="py-3 px-4">Email & Phone</th>
                                                <th className="py-3 px-4">Assigned Role</th>
                                                <th className="py-3 px-4 text-center">Status</th>
                                                <th className="py-3 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {staffList.map((st: any) => (
                                                <tr key={st._id} className="hover:bg-slate-50">
                                                    <td className="py-3.5 px-4 font-bold text-slate-900">
                                                        <div>{st.name}</div>
                                                        {st.isOwner && (
                                                            <span className="text-[10px] font-black text-blue-600 uppercase">Primary Owner</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600">
                                                        <div>{st.email}</div>
                                                        <div className="text-[10px] text-slate-400">{st.phone || "No phone"}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                                            {st.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            st.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                                        }`}>
                                                            {st.isActive ? "Active" : "Disabled"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right space-x-2">
                                                        {!st.isOwner && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleToggleStaffStatus(st._id, st.isActive)}
                                                                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                                                                >
                                                                    {st.isActive ? "Disable" : "Enable"}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStaff(st._id, st.name)}
                                                                    className="text-xs font-bold text-rose-600 hover:underline"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
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
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                                        <p className="font-bold text-slate-900 mb-1">Role-Based Access Control (RBAC) Architecture</p>
                                        <p>Each staff login is strictly enforced server-side. Users cannot access modules beyond their granted role.</p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                                            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                                                <tr>
                                                    <th className="py-3 px-4">Feature / Area</th>
                                                    <th className="py-3 px-4 text-center">Owner</th>
                                                    <th className="py-3 px-4 text-center">Administrator</th>
                                                    <th className="py-3 px-4 text-center">Receptionist</th>
                                                    <th className="py-3 px-4 text-center">Doctor</th>
                                                    <th className="py-3 px-4 text-center">Accounts</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 font-medium">
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
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-bold text-slate-900">{row.area}</td>
                                                        {row.roles.map((granted, j) => (
                                                            <td key={j} className="py-3 px-4 text-center">
                                                                {granted ? (
                                                                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                                                                ) : (
                                                                    <X className="w-4 h-4 text-slate-300 mx-auto" />
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
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION C: APPOINTMENT SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "appointments" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Appointment & Slot Preferences</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Configure appointment durations, buffer times, advance booking windows, and cancellation rules.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveAppointmentSettings}
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Save Appointment Settings</span>
                                </button>
                            </div>

                            {/* Booking Channels */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900">Online Booking via Pillora</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Accept appointments from Pillora.in</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(apptForm.isOnlineBookingEnabled)}
                                        onChange={(e) => setApptForm({ ...apptForm, isOnlineBookingEnabled: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900">Offline Walk-in Booking</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Allow receptionist counter bookings</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(apptForm.isOfflineBookingEnabled)}
                                        onChange={(e) => setApptForm({ ...apptForm, isOfflineBookingEnabled: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-900">Same-Day Appointments</h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Allow patients to book on current date</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(apptForm.allowSameDayBooking)}
                                        onChange={(e) => setApptForm({ ...apptForm, allowSameDayBooking: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded"
                                    />
                                </div>
                            </div>

                            {/* Durations & Buffer Times */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-900 mb-2">
                                        Default Appointment Duration (Minutes)
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[10, 15, 20, 30].map(dur => (
                                            <button
                                                key={dur}
                                                type="button"
                                                onClick={() => setApptForm({ ...apptForm, defaultSlotDuration: dur })}
                                                className={`py-3 px-2 rounded-xl text-xs font-black transition-all border ${
                                                    apptForm.defaultSlotDuration === dur
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {dur} Mins
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-900 mb-2">
                                        Buffer Time Between Appointments
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[0, 5, 10, 15].map(buf => (
                                            <button
                                                key={buf}
                                                type="button"
                                                onClick={() => setApptForm({ ...apptForm, bufferTimeBetweenSlots: buf })}
                                                className={`py-3 px-2 rounded-xl text-xs font-black transition-all border ${
                                                    apptForm.bufferTimeBetweenSlots === buf
                                                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {buf === 0 ? "None" : `${buf} Mins`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Booking Notice & Windows */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Max Patients Per Slot
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={apptForm.maxAppointmentsPerSlot || 1}
                                        onChange={(e) => setApptForm({ ...apptForm, maxAppointmentsPerSlot: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Usually 1 to avoid overlapping</span>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Advance Booking Window
                                    </label>
                                    <select
                                        value={apptForm.advanceBookingWindowDays || 30}
                                        onChange={(e) => setApptForm({ ...apptForm, advanceBookingWindowDays: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                                    >
                                        <option value={7}>Up to 7 Days Ahead</option>
                                        <option value={14}>Up to 14 Days Ahead</option>
                                        <option value={30}>Up to 30 Days Ahead (Default)</option>
                                        <option value={60}>Up to 60 Days Ahead</option>
                                        <option value={90}>Up to 90 Days Ahead</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                                        Minimum Notice Required
                                    </label>
                                    <select
                                        value={apptForm.minBookingNoticeHours ?? 1}
                                        onChange={(e) => setApptForm({ ...apptForm, minBookingNoticeHours: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                    <label className="block text-xs font-black text-slate-900 mb-1">
                                        Patient Cancellation Window
                                    </label>
                                    <p className="text-[11px] text-slate-500 mb-2">How many hours before appointment can patient cancel?</p>
                                    <select
                                        value={apptForm.cancellationPolicyHours ?? 2}
                                        onChange={(e) => setApptForm({ ...apptForm, cancellationPolicyHours: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                    >
                                        <option value={1}>Up to 1 hour before</option>
                                        <option value={2}>Up to 2 hours before</option>
                                        <option value={4}>Up to 4 hours before</option>
                                        <option value={12}>Up to 12 hours before</option>
                                        <option value={24}>Up to 24 hours before</option>
                                    </select>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                    <label className="block text-xs font-black text-slate-900 mb-1">
                                        Patient Rescheduling Window
                                    </label>
                                    <p className="text-[11px] text-slate-500 mb-2">How many hours before appointment can patient reschedule?</p>
                                    <select
                                        value={apptForm.reschedulePolicyHours ?? 2}
                                        onChange={(e) => setApptForm({ ...apptForm, reschedulePolicyHours: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
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
                                <label className="block text-xs font-black text-slate-900 mb-2">
                                    Standard Weekly Closed Days (Facility Holidays)
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
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                    isClosed
                                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                {day} {isClosed && "(Closed)"}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION D: PAYMENT & BANK SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "payments" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Payment & Bank Account Settings</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Configure bank accounts for automatic payouts and review transaction fee architecture.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowBankModal(true)}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Update Bank Account</span>
                                </button>
                            </div>

                            {/* Masked Bank Account Card */}
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="w-5 h-5 text-blue-400" />
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                                            Designated Settlement Bank Account
                                        </span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                                        {settingsData?.hospital?.bankDetails?.verificationStatus || "Pending Verification"}
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Account Number</p>
                                    <p className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-white mt-1">
                                        {settingsData?.hospital?.bankDetails?.accountNumberMasked || "•••• •••• ••••"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Holder</span>
                                        <span className="font-bold text-white mt-0.5 block truncate">
                                            {settingsData?.hospital?.bankDetails?.accountHolderName || "Not Configured"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Name</span>
                                        <span className="font-bold text-white mt-0.5 block truncate">
                                            {settingsData?.hospital?.bankDetails?.bankName || "Not Configured"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">IFSC Code</span>
                                        <span className="font-mono font-bold text-white mt-0.5 block">
                                            {settingsData?.hospital?.bankDetails?.ifscCode || "Not Configured"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">UPI ID (Optional)</span>
                                        <span className="font-mono font-bold text-white mt-0.5 block truncate">
                                            {settingsData?.hospital?.bankDetails?.upiId || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Bank Review Alert */}
                            {settingsData?.bankDetailsPendingApproval?.status === "pending" && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold block">Bank Update Under Review:</span>
                                        <span>
                                            You submitted an update for bank account ending in{" "}
                                            <strong>{settingsData.bankDetailsPendingApproval.accountNumber?.slice(-4)}</strong>. Pillora Admin is verifying this account for settlement compliance.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Platform Charges Explainer (2.36%) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
                                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase mb-1">
                                        <CreditCard className="w-4 h-4" />
                                        <span>Pillora Zero Commission Policy</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                        Pillora operates on a transparent model. <strong>100% of doctor consultation fees belong to your hospital.</strong> We do not take commissions on consultations.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100">
                                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase mb-1">
                                        <Landmark className="w-4 h-4" />
                                        <span>Gateway Deduction (2.36%)</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                        Online advance payments incur <strong>2.00% Razorpay processing fee + 18% GST (2.36% total)</strong>. This is deducted directly by the banking switch before payout.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION E: NOTIFICATION SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "notifications" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Notification Channel Preferences</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Configure individual delivery channels (Email, SMS, WhatsApp, and In-Dashboard) for every operational event.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveNotificationPreferences}
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                    <span>Save Notification Rules</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                                    <thead className="bg-slate-900 text-white text-[10px] font-black uppercase">
                                        <tr>
                                            <th className="py-3 px-4">Notification Event</th>
                                            <th className="py-3 px-4 text-center">Email</th>
                                            <th className="py-3 px-4 text-center">SMS</th>
                                            <th className="py-3 px-4 text-center">WhatsApp</th>
                                            <th className="py-3 px-4 text-center">In-Dashboard</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-medium">
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
                                                <tr key={item.key} className="hover:bg-slate-50">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            <span>{item.label}</span>
                                                            {item.mandatory && (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-700">
                                                                    Required
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                                                    </td>
                                                    {(["email", "sms", "whatsapp", "inApp"] as const).map(ch => (
                                                        <td key={ch} className="py-3.5 px-4 text-center">
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
                                                                className="w-4 h-4 text-blue-600 rounded disabled:opacity-60 cursor-pointer"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION F: SECURITY & LOGIN SETTINGS */}
                    {/* ========================================================================= */}
                    {activeSection === "security" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="border-b border-slate-100 pb-5">
                                <h3 className="text-xl font-black text-slate-900">Security & Login Sessions</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Manage password, authorized devices, and active login credentials.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Change Password Form */}
                                <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase">
                                        <Key className="w-4 h-4 text-blue-600" />
                                        <span>Change Password</span>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPwd ? "text" : "password"}
                                                required
                                                value={pwdForm.currentPassword}
                                                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                            >
                                                {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            New Password (Min 8 Chars)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPwd ? "text" : "password"}
                                                required
                                                minLength={8}
                                                value={pwdForm.newPassword}
                                                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPwd(!showNewPwd)}
                                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                            >
                                                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={pwdForm.confirmPassword}
                                            onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={pwdUpdating}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {pwdUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                        <span>Update Password</span>
                                    </button>
                                </form>

                                {/* 2FA & Active Sessions */}
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-black text-slate-900">Two-Factor Authentication (2FA)</h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5">Require additional security code upon login</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleToggle2FA}
                                            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                securityData?.twoFactorAuthEnabled 
                                                    ? "bg-emerald-600 text-white" 
                                                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                            }`}
                                        >
                                            {securityData?.twoFactorAuthEnabled ? "Enabled" : "Disabled"}
                                        </button>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-black text-slate-900">Active Login Sessions</h4>
                                            <button
                                                type="button"
                                                onClick={handleLogoutAllDevices}
                                                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                                            >
                                                <LogOut className="w-3 h-3" />
                                                <span>Logout All Other Devices</span>
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {(securityData?.activeSessions || []).slice(0, 3).map((sess: any, idx: number) => (
                                                <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{sess.ipAddress}</div>
                                                        <div className="text-[10px] text-slate-400">{sess.userAgent?.slice(0, 35)}...</div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {new Date(sess.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION G: REPORTS & DATA MANAGEMENT */}
                    {/* ========================================================================= */}
                    {activeSection === "reports" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Reports & Data Exports</h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        One-click CSV downloads for appointments, financial payments, doctors, and settlement history.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={exportDateRange.startDate}
                                        onChange={(e) => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                    />
                                    <span className="text-xs text-slate-400">to</span>
                                    <input
                                        type="date"
                                        value={exportDateRange.endDate}
                                        onChange={(e) => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                                    />
                                </div>
                            </div>

                            {/* Download Action Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { type: "appointments" as const, title: "Appointments Report", desc: "Tokens, patient details, status, fees" },
                                    { type: "payments" as const, title: "Payments Ledger", desc: "Advances, clinic collections & status" },
                                    { type: "doctors" as const, title: "Doctor Directory", desc: "Specialties, fees, schedules & status" },
                                    { type: "settlements" as const, title: "Settlement Payouts", desc: "Payout records, UTRs & 2.36% charges" }
                                ].map(rep => (
                                    <div key={rep.type} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-blue-200 transition-all">
                                        <div>
                                            <FileSpreadsheet className="w-5 h-5 text-blue-600 mb-2" />
                                            <h4 className="text-xs font-black text-slate-900">{rep.title}</h4>
                                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">{rep.desc}</p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={exportingType === rep.type}
                                            onClick={() => handleDownloadReport(rep.type)}
                                            className="mt-4 w-full py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {exportingType === rep.type ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                            <span>Export CSV</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SECTION H: SUPPORT & ACCOUNT MANAGEMENT */}
                    {/* ========================================================================= */}
                    {activeSection === "support" && (
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-blue-900/5 space-y-6">
                            <div className="border-b border-slate-100 pb-5">
                                <h3 className="text-xl font-black text-slate-900">Support & Account Management</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Raise support tickets, view platform agreement, and manage facility subscription.
                                </p>
                            </div>

                            {/* Hotline & Contact strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-blue-600 uppercase">Support Email</div>
                                        <div className="text-xs font-black text-slate-900">support@pillora.in</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Partner Hotline</div>
                                        <div className="text-xs font-black text-slate-900">+91 98765 43210</div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-indigo-600 uppercase">Hospital Agreement</div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAgreementModal(true)}
                                            className="text-xs font-black text-indigo-700 hover:underline"
                                        >
                                            View Terms & Privacy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Raise Support Ticket Form */}
                            <form onSubmit={handleCreateTicket} className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase">
                                    <LifeBuoy className="w-4 h-4 text-blue-600" />
                                    <span>Raise a Support Ticket with Pillora</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Ticket Subject <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Query regarding settlement UTR reference"
                                            value={ticketForm.subject}
                                            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={ticketForm.category}
                                            onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
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
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                        Issue Description <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        placeholder="Please provide details about your issue..."
                                        value={ticketForm.message}
                                        onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submittingTicket}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {submittingTicket ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LifeBuoy className="w-3.5 h-3.5" />}
                                        <span>Submit Ticket</span>
                                    </button>
                                </div>
                            </form>

                            {/* Ticket History */}
                            {tickets.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Your Submitted Tickets</h4>
                                    <div className="space-y-2">
                                        {tickets.map(t => (
                                            <div key={t._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                                <div>
                                                    <div className="font-bold text-slate-900">{t.subject}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                                        Category: {t.category || t.type} • {new Date(t.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    t.status === "Resolved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Danger Zone: Account Deactivation */}
                            <div className="pt-6 border-t border-slate-100">
                                <div className="p-5 rounded-2xl bg-rose-50/40 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase mb-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Facility Account Closure & Deactivation</span>
                                        </div>
                                        <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                                            Account deactivations are reviewed by Pillora Admin to ensure all past patient consultations and financial settlements are cleared per data retention guidelines.
                                        </p>
                                    </div>

                                    {settingsData?.deactivationRequest?.requested ? (
                                        <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200">
                                            Request Pending Review
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowDeactivateModal(true)}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all shrink-0 active:scale-95"
                                        >
                                            Request Deactivation
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Update Bank Account */}
            {showBankModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-black text-slate-900">Update Settlement Bank Account</h3>
                            <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBankDetails} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Account Holder Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={bankForm.accountHolderName}
                                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Bank Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={bankForm.bankName}
                                        onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Branch Name</label>
                                    <input
                                        type="text"
                                        value={bankForm.branchName}
                                        onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Bank Account Number *</label>
                                <input
                                    type="password"
                                    required
                                    value={bankForm.accountNumber}
                                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Confirm Account Number *</label>
                                <input
                                    type="text"
                                    required
                                    value={bankForm.confirmAccountNumber}
                                    onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">IFSC Code *</label>
                                    <input
                                        type="text"
                                        required
                                        value={bankForm.ifscCode}
                                        onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">UPI ID (Optional)</label>
                                    <input
                                        type="text"
                                        value={bankForm.upiId}
                                        onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBankModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md flex items-center gap-1.5"
                                >
                                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Submit for Verification</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Doctor */}
            {showAddDoctorModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-black text-slate-900">Add New Doctor to Facility</h3>
                            <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddDoctorSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Doctor Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Dr. Rajesh Patel"
                                    value={newDoctor.name}
                                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Specialty *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Cardiology"
                                        value={newDoctor.specialty}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Consultation Fee (₹) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={50}
                                        value={newDoctor.fee}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, fee: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Daily Start Time</label>
                                    <input
                                        type="time"
                                        value={newDoctor.startTime}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, startTime: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Daily End Time</label>
                                    <input
                                        type="time"
                                        value={newDoctor.endTime}
                                        onChange={(e) => setNewDoctor({ ...newDoctor, endTime: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddDoctorModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md flex items-center gap-1.5"
                                >
                                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Add Doctor Profile</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Staff */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-black text-slate-900">Add Staff Account & Set Permissions</h3>
                            <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Employee Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Email (Login ID) *</label>
                                    <input
                                        type="email"
                                        required
                                        value={newStaff.email}
                                        onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Role *</label>
                                    <select
                                        value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    >
                                        <option value="receptionist">Receptionist (Appointments & Check-in)</option>
                                        <option value="administrator">Administrator (Operations & Staff)</option>
                                        <option value="doctor">Doctor (Patient Care & Notes)</option>
                                        <option value="accounts">Accounts Staff (Billing & Reports)</option>
                                        <option value="owner">Hospital Owner (Full Access)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Login Password *</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={newStaff.password}
                                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddStaffModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shadow-md flex items-center gap-1.5"
                                >
                                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Create Staff Account</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Deactivate Account */}
            {showDeactivateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2 text-rose-600">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="text-lg font-black text-slate-900">Request Account Deactivation</h3>
                            </div>
                            <button onClick={() => setShowDeactivateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDeactivationRequest} className="space-y-4 text-xs">
                            <p className="text-slate-600 leading-relaxed">
                                Submitting this request sends a formal closure notice to Pillora Admin. In accordance with healthcare data retention requirements, past patient records and confirmed financial settlements will be archived safely.
                            </p>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Reason for Deactivation *</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="e.g. Facility restructuring or closure..."
                                    value={deactivateReason}
                                    onChange={(e) => setDeactivateReason(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                                />
                            </div>

                            <label className="flex items-start gap-2 text-[11px] text-slate-600 font-medium cursor-pointer">
                                <input
                                    type="checkbox"
                                    required
                                    checked={deactivateAgreed}
                                    onChange={(e) => setDeactivateAgreed(e.target.checked)}
                                    className="w-4 h-4 text-rose-600 rounded mt-0.5 shrink-0"
                                />
                                <span>I understand that this request will be sent to Pillora Admin for review and settlement reconciliation.</span>
                            </label>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeactivateModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingDeactivation || !deactivateAgreed}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-md flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {submittingDeactivation && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Submit Closure Request</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View Agreement */}
            {showAgreementModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-black text-slate-900">Pillora Healthcare SaaS Partner Agreement</h3>
                            <button onClick={() => setShowAgreementModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                            <h4 className="font-bold text-slate-900">1. Zero Commission Business Model</h4>
                            <p>Pillora does not take commissions from consultation fees charged by medical practitioners. Online advances belong entirely to the hospital minus 2.36% banking gateway fees.</p>

                            <h4 className="font-bold text-slate-900">2. Patient Data & Clinical Privacy</h4>
                            <p>Hospital staff are bound by HIPAA & Indian Digital Personal Data Protection Act compliance. Patient consultation records must remain strictly confidential.</p>

                            <h4 className="font-bold text-slate-900">3. Settlement Protocol</h4>
                            <p>All online advances transferred via NEFT/IMPS/UPI require mutual receipt verification to ensure complete transparency between Pillora and your facility.</p>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowAgreementModal(false)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
