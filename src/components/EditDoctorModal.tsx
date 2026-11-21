"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, RefreshCw, X } from "lucide-react";
import api from "@/lib/api";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Edit a doctor or specialty group (PUT /hospital/dashboard/doctors/:id).
 * Used by the dashboard "Staff & Groups" list and Settings → Doctors & staff.
 * Availability is only sent when the user changes days or times, so a doctor's
 * existing per-day schedule is left alone otherwise.
 */
export default function EditDoctorModal({
    doctor,
    onClose,
    onSaved,
}: {
    doctor: any;
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const isGroup = Boolean(doctor?.isSpecialtyGroup);
    const firstSlot = (doctor?.availability || [])[0];

    const [form, setForm] = useState({
        name: doctor?.name || "",
        specialty: doctor?.specialty || "",
        department: doctor?.department || "",
        email: doctor?.email || "",
        phone: doctor?.phone || "",
        fee: doctor?.fee ?? 0,
        maxAppointmentsPerSlot: doctor?.maxAppointmentsPerSlot || 1,
        doctorsCount: doctor?.doctorsCount || 1,
        description: doctor?.description || "",
    });
    const [days, setDays] = useState<string[]>((doctor?.availability || []).map((a: any) => a.day));
    const [startTime, setStartTime] = useState<string>(firstSlot?.startTime || "09:00");
    const [endTime, setEndTime] = useState<string>(firstSlot?.endTime || "17:00");
    const [scheduleTouched, setScheduleTouched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key: keyof typeof form, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const mixedTimes = (doctor?.availability || []).some(
        (a: any) => a.startTime !== firstSlot?.startTime || a.endTime !== firstSlot?.endTime
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (scheduleTouched && days.length > 0 && startTime >= endTime) {
            setError("End time must be after start time.");
            return;
        }
        const body: any = {
            name: form.name,
            specialty: form.specialty,
            department: form.department,
            fee: Number(form.fee),
            maxAppointmentsPerSlot: Number(form.maxAppointmentsPerSlot),
            description: form.description,
        };
        if (isGroup) {
            body.doctorsCount = Number(form.doctorsCount);
        } else {
            body.email = form.email;
            body.phone = form.phone;
        }
        if (scheduleTouched) {
            body.availability = WEEK_DAYS.filter((d) => days.includes(d)).map((day) => ({ day, startTime, endTime }));
        }

        try {
            setSaving(true);
            const res = await api.put(`/hospital/dashboard/doctors/${doctor._id}`, body);
            const updated = Number(res.data?.slotsUpdated) || 0;
            onSaved(
                `${isGroup ? "Specialty group" : "Doctor"} updated` +
                    (updated > 0 ? `. ${updated} upcoming slot${updated === 1 ? "" : "s"} now use the new limit.` : ".")
            );
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not save the changes. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ui-overlay !mt-0"
        >
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                role="dialog"
                aria-modal="true"
                aria-label={isGroup ? "Edit specialty group" : "Edit doctor"}
                className="ui-dialog sm:max-w-lg"
            >
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Pencil className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-lg font-semibold leading-tight text-slate-900">
                                {isGroup ? "Edit specialty group" : "Edit doctor"}
                            </h3>
                            <p className="mt-0.5 truncate text-sm text-slate-500">{doctor?.name}</p>
                        </div>
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

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                        <Field label={isGroup ? "Group name" : "Doctor name"}>
                            <input required type="text" maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} className="ui-input" />
                        </Field>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Specialty">
                                <input required type="text" maxLength={120} value={form.specialty} onChange={(e) => set("specialty", e.target.value)} className="ui-input" />
                            </Field>
                            <Field label="Department">
                                <input type="text" maxLength={160} placeholder="Optional" value={form.department} onChange={(e) => set("department", e.target.value)} className="ui-input" />
                            </Field>
                        </div>

                        {!isGroup && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Email">
                                    <input type="email" maxLength={160} placeholder="Optional" value={form.email} onChange={(e) => set("email", e.target.value)} className="ui-input" />
                                </Field>
                                <Field label="Phone">
                                    <input type="tel" maxLength={30} placeholder="Optional" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="ui-input" />
                                </Field>
                            </div>
                        )}

                        <div className={`grid grid-cols-1 gap-4 ${isGroup ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                            <Field label="Fee (₹)">
                                <input required type="number" min={0} value={form.fee} onChange={(e) => set("fee", e.target.value)} className="ui-input" />
                            </Field>
                            <Field label="Max per slot">
                                <input required type="number" min={1} max={100} step={1} value={form.maxAppointmentsPerSlot} onChange={(e) => set("maxAppointmentsPerSlot", e.target.value)} className="ui-input" />
                            </Field>
                            {isGroup && (
                                <Field label="Doctors count">
                                    <input required type="number" min={1} step={1} value={form.doctorsCount} onChange={(e) => set("doctorsCount", e.target.value)} className="ui-input" />
                                </Field>
                            )}
                        </div>
                        <p className="-mt-1 text-xs leading-relaxed text-slate-500">
                            Max per slot: how many patients can book the same time slot. Leave it at 1 to use the hospital setting
                            (Settings → Appointment settings). Upcoming slots are updated when you save.
                        </p>

                        <fieldset>
                            <legend className="ui-label">Available days</legend>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {WEEK_DAYS.map((day) => {
                                    const checked = days.includes(day);
                                    return (
                                        <label
                                            key={day}
                                            className={`flex min-h-[40px] cursor-pointer select-none items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                checked ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    setScheduleTouched(true);
                                                    setDays(e.target.checked ? [...days, day] : days.filter((d) => d !== day));
                                                }}
                                                aria-label={day}
                                                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                                            />
                                            <span className="font-medium" aria-hidden="true">{day.slice(0, 3)}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Start time">
                                <input type="time" value={startTime} onChange={(e) => { setScheduleTouched(true); setStartTime(e.target.value); }} className="ui-input" />
                            </Field>
                            <Field label="End time">
                                <input type="time" value={endTime} onChange={(e) => { setScheduleTouched(true); setEndTime(e.target.value); }} className="ui-input" />
                            </Field>
                        </div>
                        {mixedTimes && !scheduleTouched && (
                            <p className="-mt-1 text-xs leading-relaxed text-amber-700">
                                This schedule has different times on different days. Changing days or times here sets the same hours for every selected day.
                            </p>
                        )}

                        <Field label="Description / notes">
                            <textarea maxLength={2000} placeholder="Optional" value={form.description} onChange={(e) => set("description", e.target.value)} className="ui-input h-20 resize-none" />
                        </Field>

                        {error && (
                            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <button type="button" onClick={onClose} className="ui-btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="ui-btn-primary">
                            {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                            <span>Save changes</span>
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="ui-label">{label}</span>
            {children}
        </label>
    );
}
