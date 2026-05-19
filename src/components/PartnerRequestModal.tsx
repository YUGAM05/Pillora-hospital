"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    X, Building2, MapPin, Mail, Phone, User, FileText, 
    CheckCircle2, Stethoscope, Layers, Loader2, ArrowRight, ArrowLeft 
} from "lucide-react";
import api from "@/lib/api";

interface PartnerRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AVAILABLE_FACILITIES = [
    "ICU", "Emergency", "Pharmacy", "Ambulance", "Laboratory", "Radiology"
];

export default function PartnerRequestModal({ isOpen, onClose }: PartnerRequestModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [formData, setFormData] = useState({
        organizationName: "",
        city: "",
        area: "",
        address: "",
        facilityType: "Clinic",
        registrationNumber: "",
        contactPersonName: "",
        designation: "",
        phoneNumber: "",
        email: "",
        specializationsString: "",
        doctorCount: "",
        interestedPlan: "Standard Plan",
        selectedFacilities: [] as string[],
        message: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleFacilityToggle = (facility: string) => {
        setFormData(prev => {
            const alreadySelected = prev.selectedFacilities.includes(facility);
            return {
                ...prev,
                selectedFacilities: alreadySelected
                    ? prev.selectedFacilities.filter(f => f !== facility)
                    : [...prev.selectedFacilities, facility]
            };
        });
    };

    const validateStep1 = () => {
        if (!formData.organizationName.trim()) return "Organization Name is required";
        if (!formData.city.trim()) return "City is required";
        if (!formData.area.trim()) return "Area is required";
        if (!formData.address.trim()) return "Full Address is required";
        if (!formData.registrationNumber.trim()) return "Registration Number is required";
        return null;
    };

    const validateStep2 = () => {
        if (!formData.contactPersonName.trim()) return "Contact Person Name is required";
        if (!formData.designation.trim()) return "Designation is required";
        if (!formData.phoneNumber.trim()) return "Phone Number is required";
        if (!/^\d{10}$/.test(formData.phoneNumber.trim())) return "Phone Number must be exactly 10 digits";
        if (!formData.email.trim()) return "Email Address is required";
        if (!/\S+@\S+\.\S+/.test(formData.email.trim())) return "Email Address is invalid";
        if (!formData.doctorCount.trim() || isNaN(Number(formData.doctorCount)) || Number(formData.doctorCount) <= 0) {
            return "Doctor Count must be a valid positive number";
        }
        return null;
    };

    const handleNext = () => {
        const err = validateStep1();
        if (err) {
            setError(err);
            return;
        }
        setError(null);
        setStep(2);
    };

    const handlePrev = () => {
        setError(null);
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateStep2();
        if (err) {
            setError(err);
            return;
        }

        setLoading(true);
        setError(null);

        // Format specializations from comma-separated string to array
        const specializations = formData.specializationsString
            ? formData.specializationsString.split(",").map(s => s.trim()).filter(Boolean)
            : ["General Medicine"];

        const payload = {
            type: "hospital",
            organizationName: formData.organizationName.trim(),
            city: formData.city.trim(),
            area: formData.area.trim(),
            address: formData.address.trim(),
            facilityType: formData.facilityType,
            registrationNumber: formData.registrationNumber.trim(),
            contactPersonName: formData.contactPersonName.trim(),
            designation: formData.designation.trim(),
            phoneNumber: formData.phoneNumber.trim(),
            email: formData.email.trim(),
            specializations,
            doctorCount: Number(formData.doctorCount),
            facilities: formData.selectedFacilities,
            interestedPlan: formData.interestedPlan,
            message: formData.message.trim(),
            status: "pending"
        };

        try {
            await api.post("/partners/submit", payload);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit partnership request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setSuccess(false);
        setError(null);
        setFormData({
            organizationName: "",
            city: "",
            area: "",
            address: "",
            facilityType: "Clinic",
            registrationNumber: "",
            contactPersonName: "",
            designation: "",
            phoneNumber: "",
            email: "",
            specializationsString: "",
            doctorCount: "",
            interestedPlan: "Standard Plan",
            selectedFacilities: [],
            message: ""
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleReset}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Modal Window */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col md:flex-row max-h-[90vh] md:max-h-none"
                    >
                        {/* Side Branding Panel */}
                        <div className="md:w-1/3 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                            {/* Decorative background shapes */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-2xl -ml-8 -mb-8" />
                            
                            <div className="relative z-10">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-white/15 rounded-2xl mb-6 backdrop-blur-xl">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-black leading-tight mb-3">Pillora Partnership Program</h3>
                                <p className="text-blue-100 text-sm leading-relaxed">
                                    Join a network of over 500 verified healthcare institutions providing elite, smart healthcare delivery solutions.
                                </p>
                            </div>

                            <div className="relative z-10 pt-8 border-t border-white/10 mt-6 md:mt-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-4">Registration Flow</p>
                                <div className="space-y-4 text-xs font-bold">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 1 ? "bg-white text-blue-600 border-white" : "border-white/40 text-white/60"}`}>1</div>
                                        <span className={step === 1 ? "text-white" : "text-white/60"}>Facility Details</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step === 2 ? "bg-white text-blue-600 border-white" : "border-white/40 text-white/60"}`}>2</div>
                                        <span className={step === 2 ? "text-white" : "text-white/60"}>Contact & Operations</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Panel */}
                        <div className="flex-1 p-8 md:p-10 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-[85vh]">
                            {/* Close Button */}
                            <button 
                                onClick={handleReset}
                                className="absolute top-6 right-6 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {success ? (
                                /* ─── SUCCESS SCREEN ─── */
                                <div className="my-auto py-8 text-center space-y-6 flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center shadow-inner mb-2">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                    </div>
                                    <h4 className="text-3xl font-black text-slate-900">Application Submitted!</h4>
                                    <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                                        Thank you for your interest in partnering with Pillora. We have received your registration details. Our admin team will review it and contact you directly within 24 hours.
                                    </p>
                                    <button 
                                        onClick={handleReset}
                                        className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all"
                                    >
                                        Return Home
                                    </button>
                                </div>
                            ) : (
                                /* ─── FORM SCREEN ─── */
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 leading-tight">
                                            {step === 1 ? "Organization & Facility Details" : "Operational & Contact Info"}
                                        </h4>
                                        <p className="text-slate-400 text-xs font-semibold mt-1">
                                            {step === 1 ? "Provide essential business and operational licensing information." : "Provide administrative contact information and specialty profiles."}
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-xs flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {step === 1 ? (
                                        /* ── Step 1 Fields ── */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Hospital / Organization Name</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        name="organizationName"
                                                        value={formData.organizationName}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. City General Hospital"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">City</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. Mumbai"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Area / Locality</label>
                                                <input 
                                                    type="text"
                                                    name="area"
                                                    value={formData.area}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. Bandra West"
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Full Official Address</label>
                                                <textarea 
                                                    name="address"
                                                    rows={2}
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. 101 Medical Plaza, S.V. Road, Bandra West"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 resize-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Facility Type</label>
                                                <select 
                                                    name="facilityType"
                                                    value={formData.facilityType}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 appearance-none cursor-pointer"
                                                >
                                                    <option value="Clinic">Clinic / Diagnostic Center</option>
                                                    <option value="General Hospital">General Hospital</option>
                                                    <option value="Multi-specialty">Multi-specialty Hospital</option>
                                                    <option value="Super-specialty">Super-specialty Hospital</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Government Registration No.</label>
                                                <div className="relative">
                                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        name="registrationNumber"
                                                        value={formData.registrationNumber}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. REG-129381-HOSP"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── Step 2 Fields ── */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Contact Person Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        name="contactPersonName"
                                                        value={formData.contactPersonName}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. Dr. Rajesh Kumar"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Designation</label>
                                                <input 
                                                    type="text"
                                                    name="designation"
                                                    value={formData.designation}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. Medical Director / Chief Administrator"
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Phone Number (10 digits)</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="tel"
                                                        name="phoneNumber"
                                                        maxLength={10}
                                                        value={formData.phoneNumber}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. 9876543210"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. admin@cityhospital.com"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Doctor Count</label>
                                                <input 
                                                    type="number"
                                                    name="doctorCount"
                                                    min="1"
                                                    value={formData.doctorCount}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. 45"
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Interested Plan</label>
                                                <select 
                                                    name="interestedPlan"
                                                    value={formData.interestedPlan}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 appearance-none cursor-pointer"
                                                >
                                                    <option value="Standard Plan">Standard (Basic Directory & Queue)</option>
                                                    <option value="Premium Plan">Premium (Interactive Slots & Tele-health)</option>
                                                    <option value="Enterprise Plan">Enterprise (Fully Dedicated Domain & custom API)</option>
                                                </select>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Specializations (Comma-separated)</label>
                                                <div className="relative">
                                                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="text"
                                                        name="specializationsString"
                                                        value={formData.specializationsString}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g. Cardiology, Pediatrics, General Medicine, Orthopedics"
                                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Available In-house Facilities</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {AVAILABLE_FACILITIES.map(fac => (
                                                        <button
                                                            key={fac}
                                                            type="button"
                                                            onClick={() => handleFacilityToggle(fac)}
                                                            className={`p-3 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                                formData.selectedFacilities.includes(fac)
                                                                ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                                                                : "bg-white text-slate-600 border-slate-100 hover:border-slate-200"
                                                            }`}
                                                        >
                                                            <Layers className="w-3.5 h-3.5" />
                                                            {fac}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Additional comments / Message</label>
                                                <textarea 
                                                    name="message"
                                                    rows={2}
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    placeholder="Specify any special integration requirements or operational notes..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-8">
                                        {step === 2 ? (
                                            <button
                                                type="button"
                                                onClick={handlePrev}
                                                disabled={loading}
                                                className="px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 transition-colors"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Previous Step
                                            </button>
                                        ) : (
                                            <div />
                                        )}

                                        {step === 1 ? (
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-all ml-auto"
                                            >
                                                Next Step <ArrowRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 shadow-xl shadow-blue-100 hover:-translate-y-0.5 transition-all ml-auto"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        Submit Application <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
