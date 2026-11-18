"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { trackEvent } from "@/lib/analytics";

/**
 * "Request a demo" / "Get a quote" form.
 * Uses the existing contact mechanism (POST /api/support/guest), so requests
 * arrive as support tickets in the admin panel and trigger the team's
 * Telegram alert. No new backend endpoint.
 */
type Intent = "demo" | "quote";

const SUBJECT: Record<Intent, string> = {
    demo: "Demo request – Hospital portal",
    quote: "Quote request – Hospital portal",
};

export default function DemoRequestForm({ intent = "demo", source }: { intent?: Intent; source: string }) {
    const [form, setForm] = useState({
        name: "", email: "", phone: "", organisation: "", facilityType: "Clinic", city: "", doctors: "", message: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setError("");
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.organisation.trim() || !form.city.trim()) return setError("Please fill in your name, organisation and city.");
        if (!/\S+@\S+\.\S+/.test(form.email.trim())) return setError("Please enter a valid work email.");
        if (!/^\d{10}$/.test(form.phone.trim())) return setError("Please enter a 10-digit mobile number.");

        setSubmitting(true);
        try {
            await api.post("/support/guest", {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                subject: SUBJECT[intent],
                message: [
                    `Organisation: ${form.organisation.trim()}`,
                    `Type: ${form.facilityType}`,
                    `City: ${form.city.trim()}`,
                    `Number of doctors: ${form.doctors.trim() || "not given"}`,
                    `Source page: ${source}`,
                    "",
                    form.message.trim() || "(no message)",
                ].join("\n"),
            });
            // GA4 conversion: no personal data is sent
            trackEvent("demo_request", { intent, source });
            setDone(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || "We couldn't send your request. Please try again or call +91 94291 67856.");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-10 text-center" role="status">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" aria-hidden="true" />
                <p className="text-2xl font-black text-slate-900">Thank you, we have your request</p>
                <p className="text-slate-600 mt-2">The Pillora team will contact you on the email or phone number you shared.</p>
            </div>
        );
    }

    const input = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600";
    const label = "block text-sm font-bold text-slate-700 mb-1.5";

    return (
        <form onSubmit={submit} noValidate className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-10 shadow-xl shadow-blue-900/5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <label htmlFor={`${source}-name`} className={label}>Your name *</label>
                <input id={`${source}-name`} name="name" value={form.name} onChange={set} autoComplete="name" className={input} required />
            </div>
            <div>
                <label htmlFor={`${source}-org`} className={label}>Hospital or clinic name *</label>
                <input id={`${source}-org`} name="organisation" value={form.organisation} onChange={set} autoComplete="organization" className={input} required />
            </div>
            <div>
                <label htmlFor={`${source}-email`} className={label}>Work email *</label>
                <input id={`${source}-email`} type="email" name="email" value={form.email} onChange={set} autoComplete="email" className={input} required />
            </div>
            <div>
                <label htmlFor={`${source}-phone`} className={label}>Mobile number *</label>
                <input id={`${source}-phone`} type="tel" inputMode="numeric" name="phone" value={form.phone} onChange={set} autoComplete="tel-national" placeholder="10-digit number" className={input} required />
            </div>
            <div>
                <label htmlFor={`${source}-type`} className={label}>Type</label>
                <select id={`${source}-type`} name="facilityType" value={form.facilityType} onChange={set} className={input}>
                    <option>Clinic</option>
                    <option>Hospital</option>
                    <option>Multi-specialty hospital</option>
                    <option>Other</option>
                </select>
            </div>
            <div>
                <label htmlFor={`${source}-city`} className={label}>City *</label>
                <input id={`${source}-city`} name="city" value={form.city} onChange={set} autoComplete="address-level2" className={input} required />
            </div>
            <div>
                <label htmlFor={`${source}-doctors`} className={label}>Number of doctors</label>
                <input id={`${source}-doctors`} type="number" min={1} name="doctors" value={form.doctors} onChange={set} className={input} />
            </div>
            <div className="md:col-span-2">
                <label htmlFor={`${source}-msg`} className={label}>What would you like to see?</label>
                <textarea id={`${source}-msg`} name="message" rows={3} value={form.message} onChange={set} className={input} />
            </div>
            {error && <p className="md:col-span-2 text-sm font-bold text-rose-600" role="alert">{error}</p>}
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <p className="text-xs text-slate-500">
                    We use these details only to contact you about Pillora. See our{" "}
                    <a href="https://www.pillora.in/privacy" className="underline hover:text-blue-600">privacy policy</a>.
                </p>
                <button type="submit" disabled={submitting} className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black hover:bg-blue-700 disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2">
                    {submitting && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                    {intent === "quote" ? "Request a quote" : "Request a demo"}
                </button>
            </div>
        </form>
    );
}
