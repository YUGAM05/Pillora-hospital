"use client";

// Settings > AI receptionist: what the AI phone receptionist says to callers.
//   GET/PUT /hospital/dashboard/ai-receptionist (owner and administrator)
// The voice server reads these settings at the start of every call.

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { PhoneCall, Info, Save, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { SUPPORT_PHONE } from "@/content/marketing";
import { formatAiNumber } from "@/lib/aiNumber";

type Lang = "gu" | "hi";
type Form = { spokenNameGu: string; spokenNameHi: string; firstLanguage: Lang; info: string };
type Data = {
    hospitalName: string;
    settings: Form & { updatedAt: string | null };
    numbers: { number: string; enabled: boolean }[];
    limits: { infoMax: number; nameMax: number };
};

const GUJARATI = /[઀-૿]/;
const DEVANAGARI = /[ऀ-ॿ]/;

const pick = (s: Data["settings"]): Form => ({
    spokenNameGu: s.spokenNameGu || "",
    spokenNameHi: s.spokenNameHi || "",
    firstLanguage: s.firstLanguage === "hi" ? "hi" : "gu",
    info: s.info || "",
});

// Same words as the voice server's greeting (voice-agent server/agent.js, greetingFor).
const greeting = (lang: Lang, name: string) =>
    lang === "gu"
        ? `નમસ્તે, ${name} માં આપનું સ્વાગત છે. હું તમારી એપોઈન્ટમેન્ટ બુક કરવામાં મદદ કરીશ. તમારે કયા ડૉક્ટરને બતાવવું છે?`
        : `नमस्ते, ${name} में आपका स्वागत है. मैं आपकी अपॉइंटमेंट बुक करने में मदद करूँगी. आपको किस डॉक्टर को दिखाना है?`;

const INFO_PLACEHOLDER = `For example:
Address: 2nd floor, Sun Plaza, near Iscon Cross Road, Satellite, Ahmedabad.
OPD: Monday to Saturday, 9 am to 1 pm and 5 pm to 8 pm. Sunday closed.
Consultation fee: ₹400. Follow-up within 7 days is free.
Services: X-ray, sonography, pathology lab, pharmacy.
Ayushman Bharat card accepted.
For reports and bills, call reception on 079 XXXX XXXX.`;

const fmt = (n: number) => n.toLocaleString("en-IN");
const dateTimeIN = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function AiReceptionistSettings() {
    const [data, setData] = useState<Data | null>(null);
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const res = await api.get("/hospital/dashboard/ai-receptionist");
            setData(res.data);
            setForm(pick(res.data.settings));
        } catch (e: any) {
            setLoadError(e.response?.data?.message || "Could not load the AI receptionist settings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const nameMax = data?.limits.nameMax ?? 60;
    const infoMax = data?.limits.infoMax ?? 1000;

    // Same checks as the server, shown while typing.
    const problems = useMemo(() => {
        const p: Partial<Record<keyof Form, string>> = {};
        if (!form) return p;
        if (DEVANAGARI.test(form.spokenNameGu)) p.spokenNameGu = "Use Gujarati script (ગુજરાતી) or English letters here.";
        else if (form.spokenNameGu.trim().length > nameMax) p.spokenNameGu = `Keep it under ${nameMax} characters.`;
        if (GUJARATI.test(form.spokenNameHi)) p.spokenNameHi = "Use Hindi script (हिन्दी) or English letters here.";
        else if (form.spokenNameHi.trim().length > nameMax) p.spokenNameHi = `Keep it under ${nameMax} characters.`;
        if (form.info.trim().length > infoMax) p.info = `Please shorten this to ${fmt(infoMax)} characters or less.`;
        return p;
    }, [form, nameMax, infoMax]);

    const hasProblems = Object.keys(problems).length > 0;
    const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(pick(data.settings));
    const set = (patch: Partial<Form>) => {
        setForm((f) => (f ? { ...f, ...patch } : f));
        setNotice(null);
    };

    const save = async () => {
        if (!form || hasProblems) return;
        setSaving(true);
        setNotice(null);
        try {
            const res = await api.put("/hospital/dashboard/ai-receptionist", form);
            setData(res.data);
            setForm(pick(res.data.settings));
            setNotice({ type: "success", text: "Saved. Your AI receptionist uses this from the next call." });
        } catch (e: any) {
            setNotice({ type: "error", text: e.response?.data?.message || "Could not save. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    const previewName = form && data ? (form.firstLanguage === "gu" ? form.spokenNameGu : form.spokenNameHi).trim() || data.hospitalName : "";

    return (
        <section className="ui-card space-y-6 p-5 sm:p-6">
            <div className="flex min-w-0 items-start gap-3 border-b border-slate-100 pb-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <PhoneCall className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <h3 className="ui-title">AI receptionist</h3>
                    <p className="ui-subtitle">How the AI greets patients who call your AI phone number, and what it can tell them.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
                </div>
            ) : loadError || !data || !form ? (
                <div className="ui-empty">
                    <p>{loadError || "Could not load the AI receptionist settings."}</p>
                    <button type="button" onClick={load} className="ui-btn-secondary mt-4">
                        <RefreshCw className="h-4 w-4" /> Try again
                    </button>
                </div>
            ) : (
                <>
                    {/* The hospital's AI phone number(s) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                        <p className="text-[13px] font-medium text-slate-500">Your AI phone number</p>
                        {data.numbers.length === 0 ? (
                            <>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="text-base font-semibold text-slate-900">Not set up yet</span>
                                    <span className="ui-badge border-slate-200 bg-white text-slate-600">Off</span>
                                </div>
                                <p className="ui-hint">
                                    Pillora sets up the phone number for you. To get one, call Pillora support on{" "}
                                    <a href={`tel:${SUPPORT_PHONE.tel}`} className="font-medium text-blue-700 hover:underline">
                                        {SUPPORT_PHONE.display}
                                    </a>
                                    . You can fill in the settings below already.
                                </p>
                            </>
                        ) : (
                            <>
                                <ul className="mt-1 space-y-1.5">
                                    {data.numbers.map((n) => (
                                        <li key={n.number} className="flex flex-wrap items-center gap-2">
                                            <a href={`tel:+${n.number}`} className="text-base font-semibold tabular-nums text-slate-900 hover:text-blue-700">
                                                {formatAiNumber(n.number)}
                                            </a>
                                            {n.enabled ? (
                                                <span className="ui-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> On
                                                </span>
                                            ) : (
                                                <span className="ui-badge border-amber-200 bg-amber-50 text-amber-700">Paused</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <p className="ui-hint">
                                    {data.numbers.some((n) => n.enabled)
                                        ? "Patients who call this number talk to your AI receptionist. To hear the greeting, call it yourself: a short test call uses half a minute or less. Minutes left are under Plan & usage."
                                        : "This number is paused, so the AI doesn't answer it. Call Pillora support to switch it back on."}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Spoken name */}
                    <fieldset className="space-y-3">
                        <legend className="ui-label">Hospital name, as the AI should say it</legend>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label htmlFor="ai-name-gu" className="text-xs font-medium text-slate-500">In Gujarati</label>
                                <input
                                    id="ai-name-gu"
                                    lang="gu"
                                    value={form.spokenNameGu}
                                    onChange={(e) => set({ spokenNameGu: e.target.value })}
                                    maxLength={nameMax + 20}
                                    placeholder="e.g. શ્રી સાઈ હોસ્પિટલ"
                                    aria-invalid={!!problems.spokenNameGu}
                                    className="ui-input mt-1"
                                />
                                {problems.spokenNameGu && <p className="mt-1 text-xs font-medium text-rose-600">{problems.spokenNameGu}</p>}
                            </div>
                            <div>
                                <label htmlFor="ai-name-hi" className="text-xs font-medium text-slate-500">In Hindi</label>
                                <input
                                    id="ai-name-hi"
                                    lang="hi"
                                    value={form.spokenNameHi}
                                    onChange={(e) => set({ spokenNameHi: e.target.value })}
                                    maxLength={nameMax + 20}
                                    placeholder="e.g. श्री साई हॉस्पिटल"
                                    aria-invalid={!!problems.spokenNameHi}
                                    className="ui-input mt-1"
                                />
                                {problems.spokenNameHi && <p className="mt-1 text-xs font-medium text-rose-600">{problems.spokenNameHi}</p>}
                            </div>
                        </div>
                        <p className="ui-hint">
                            Write the name the way it should sound. If you leave a box empty, the AI says “{data.hospitalName}”.
                        </p>
                    </fieldset>

                    {/* Greeting language */}
                    <div>
                        <span id="ai-lang-label" className="ui-label">Greeting language</span>
                        <div className="ui-segmented" role="radiogroup" aria-labelledby="ai-lang-label">
                            {(["gu", "hi"] as Lang[]).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    role="radio"
                                    aria-checked={form.firstLanguage === l}
                                    onClick={() => set({ firstLanguage: l })}
                                    className={`ui-segment min-w-[96px] ${form.firstLanguage === l ? "ui-segment-active" : ""}`}
                                >
                                    {l === "gu" ? "Gujarati" : "Hindi"}
                                </button>
                            ))}
                        </div>
                        <p className="ui-hint">The AI greets callers in this language. If a caller answers in the other language, it switches to theirs.</p>
                    </div>

                    {/* What callers hear first */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <p className="text-xs font-medium text-blue-700">Callers will hear</p>
                        <p lang={form.firstLanguage} className="mt-1 text-sm leading-relaxed text-slate-800">
                            “{greeting(form.firstLanguage, previewName)}”
                        </p>
                    </div>

                    {/* Information for the AI */}
                    <div>
                        <div className="flex items-end justify-between gap-3">
                            <label htmlFor="ai-info" className="ui-label">Information for your AI receptionist</label>
                            <span className={`mb-1.5 shrink-0 text-xs tabular-nums ${problems.info ? "font-semibold text-rose-600" : "text-slate-400"}`}>
                                {fmt(form.info.trim().length)} / {fmt(infoMax)}
                            </span>
                        </div>
                        <textarea
                            id="ai-info"
                            rows={8}
                            value={form.info}
                            onChange={(e) => set({ info: e.target.value })}
                            placeholder={INFO_PLACEHOLDER}
                            aria-invalid={!!problems.info}
                            aria-describedby="ai-info-hint"
                            className="ui-input min-h-[200px] resize-y leading-relaxed"
                        />
                        {problems.info && <p className="mt-1 text-xs font-medium text-rose-600">{problems.info}</p>}
                        <p id="ai-info-hint" className="ui-hint">
                            Address and landmark, OPD timings and holidays, fees, services, Ayushman or insurance, and a number for reports or
                            bills. The AI uses it to answer questions like “what is the fee?”, then goes back to booking. English, Gujarati or
                            Hindi are all fine. Keep it short: the AI reads it before every reply.
                        </p>
                    </div>

                    <div className="flex gap-3 rounded-xl border border-slate-200 p-4 text-xs leading-relaxed text-slate-600">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <p>
                            Some rules never change: the AI only books free slots, books one appointment per call, never gives medical advice,
                            and tells callers with an emergency to call 108. If the answer to a question isn&apos;t written here, it says it
                            doesn&apos;t know instead of guessing.
                        </p>
                    </div>

                    {notice && (
                        <div
                            role="status"
                            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                                notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
                            }`}
                        >
                            {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                            <span>{notice.text}</span>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            {data.settings.updatedAt
                                ? `Last changed ${dateTimeIN(data.settings.updatedAt)}`
                                : "Not changed yet: the AI uses your hospital name and the standard greeting."}
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            {dirty && (
                                <button type="button" onClick={() => { setForm(pick(data.settings)); setNotice(null); }} className="ui-btn-secondary">
                                    Undo changes
                                </button>
                            )}
                            <button type="button" onClick={save} disabled={!dirty || saving || hasProblems} className="ui-btn-primary">
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? "Saving…" : "Save changes"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
