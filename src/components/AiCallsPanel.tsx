"use client";

// Dashboard > AI calls: every call the AI phone receptionist answered, whether it
// ended in a booking, and a call-back list for reception.
//   GET   /hospital/dashboard/voice-calls?filter=all|booked|not_booked&before=&limit=
//   PATCH /hospital/dashboard/voice-calls/:id/called-back { done }

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { PhoneCall, PhoneOutgoing, CheckCircle2, RefreshCw, Loader2, CalendarCheck } from "lucide-react";
import { formatAiNumber } from "@/lib/aiNumber";
import { SUPPORT_PHONE } from "@/content/marketing";

type Call = {
    id: string;
    at: string;
    from: string | null;
    durationSeconds: number;
    billedSeconds: number;
    outcome: "booked" | "no_booking" | "ended_early" | "unavailable";
    language: string | null;
    appointment: { patientName: string; doctorName: string; date: string; time: string; status: string } | null;
    calledBackAt: string | null;
    calledBackBy: string | null;
    bookedLater: boolean;
};
type Summary = { month: string; calls: number; booked: number; notBooked: number; waitingForCallBack: number; minutesUsed: number };
type Filter = "all" | "booked" | "not_booked";

const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All calls" },
    { id: "booked", label: "Booked" },
    { id: "not_booked", label: "Not booked" },
];
const LANG: Record<string, string> = { gu: "Gujarati", hi: "Hindi" };

const fmt = (n: number) => n.toLocaleString("en-IN");
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const timeIN = (d: Date) => d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });

/** "Today, 11:42 am", "Yesterday, 6:05 pm" or "21 Nov, 9:30 am" (India time) */
function when(iso: string) {
    const d = new Date(iso);
    const k = dayKey(d);
    if (k === dayKey(new Date())) return `Today, ${timeIN(d)}`;
    if (k === dayKey(new Date(Date.now() - 864e5))) return `Yesterday, ${timeIN(d)}`;
    return `${d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })}, ${timeIN(d)}`;
}
const duration = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`);
const charged = (s: number) => (s === 0 ? "free" : `${fmt(Math.round((s / 60) * 10) / 10)} min charged`);
/** "2026-11-27" + "17:30" -> "Thu, 27 Nov, 5:30 pm" */
function apptWhen(date?: string, time?: string) {
    if (!date) return "";
    const d = new Date(`${date}T${time || "12:00"}:00+05:30`);
    const day = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
    return time ? `${day}, ${timeIN(d)}` : day;
}
const monthName = (m?: string) => (m ? new Date(`${m}-01T12:00:00+05:30`).toLocaleDateString("en-IN", { month: "long" }) : "");
const telOf = (from: string) => `tel:+${from.replace(/\D/g, "")}`;

export default function AiCallsPanel({ canSeePlan = false }: { canSeePlan?: boolean }) {
    const [filter, setFilter] = useState<Filter>("all");
    const [calls, setCalls] = useState<Call[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [numbers, setNumbers] = useState<{ number: string; enabled: boolean }[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [nextBefore, setNextBefore] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchPage = useCallback(async (f: Filter, before?: string | null) => {
        const params = new URLSearchParams({ filter: f, limit: "30" });
        if (before) params.set("before", before);
        return (await api.get(`/hospital/dashboard/voice-calls?${params.toString()}`)).data;
    }, []);

    const refresh = useCallback(
        async (f: Filter) => {
            setLoading(true);
            setError("");
            try {
                const d = await fetchPage(f);
                setCalls(d.calls);
                setSummary(d.summary);
                setNumbers(d.numbers || []);
                setHasMore(d.hasMore);
                setNextBefore(d.nextBefore);
            } catch (e: any) {
                setError(e.response?.data?.message || "Could not load AI calls.");
            } finally {
                setLoading(false);
            }
        },
        [fetchPage]
    );

    useEffect(() => {
        refresh(filter);
    }, [filter, refresh]);

    const loadMore = async () => {
        if (!nextBefore) return;
        setLoadingMore(true);
        try {
            const d = await fetchPage(filter, nextBefore);
            setCalls((cs) => [...cs, ...d.calls.filter((c: Call) => !cs.some((x) => x.id === c.id))]);
            setHasMore(d.hasMore);
            setNextBefore(d.nextBefore);
        } catch (e: any) {
            setError(e.response?.data?.message || "Could not load more calls.");
        } finally {
            setLoadingMore(false);
        }
    };

    const markCalledBack = async (c: Call, done: boolean) => {
        setBusyId(c.id);
        setError("");
        try {
            const res = await api.patch(`/hospital/dashboard/voice-calls/${c.id}/called-back`, { done });
            setCalls((cs) => cs.map((x) => (x.id === c.id ? { ...res.data.call, bookedLater: x.bookedLater } : x)));
            // This month's "waiting for a call-back" count changes with it.
            if (summary && !c.bookedLater && dayKey(new Date(c.at)).slice(0, 7) === summary.month) {
                setSummary({ ...summary, waitingForCallBack: Math.max(0, summary.waitingForCallBack + (done ? -1 : 1)) });
            }
        } catch (e: any) {
            setError(e.response?.data?.message || "Could not update the call.");
        } finally {
            setBusyId(null);
        }
    };

    const noAiYet = !loading && !error && numbers.length === 0 && (summary?.calls ?? 0) === 0 && calls.length === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="ui-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <PhoneCall className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="ui-title">AI calls</h2>
                            <p className="ui-subtitle">Every call your AI receptionist answered. Call back the patients who didn&apos;t book.</p>
                            {numbers.length > 0 && (
                                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                                    AI number
                                    {numbers.map((n) => (
                                        <span key={n.number} className="inline-flex items-center gap-1.5">
                                            <span className="font-semibold tabular-nums text-slate-900">{formatAiNumber(n.number)}</span>
                                            <span className={`ui-badge ${n.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                                {n.enabled ? "On" : "Paused"}
                                            </span>
                                        </span>
                                    ))}
                                </p>
                            )}
                        </div>
                    </div>
                    <button type="button" onClick={() => refresh(filter)} disabled={loading} className="ui-btn-secondary w-full shrink-0 sm:w-auto">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                </p>
            )}

            {loading && !summary ? (
                <div className="ui-card flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading AI calls…
                </div>
            ) : noAiYet ? (
                <div className="ui-card p-6 text-center sm:p-10">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                        <PhoneCall className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-900">Your AI receptionist isn&apos;t set up yet</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                        It answers patient calls 24×7 in Gujarati and Hindi, books appointments straight into this dashboard and sends a
                        WhatsApp confirmation. To get it for your hospital, call Pillora.
                    </p>
                    <a href={`tel:${SUPPORT_PHONE.tel}`} className="ui-btn-primary mt-5 inline-flex">
                        <PhoneOutgoing className="h-4 w-4" /> Call Pillora on {SUPPORT_PHONE.display}
                    </a>
                </div>
            ) : (
                <>
                    {/* This month */}
                    {summary && (
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <Stat label={`AI calls in ${monthName(summary.month)}`} value={fmt(summary.calls)} />
                            <Stat
                                label="Appointments booked"
                                value={fmt(summary.booked)}
                                hint={summary.calls ? `${Math.round((summary.booked / summary.calls) * 100)}% of calls` : undefined}
                                tone="emerald"
                            />
                            <Stat
                                label="Waiting for a call-back"
                                value={fmt(summary.waitingForCallBack)}
                                hint="Didn't book and not called back yet"
                                tone={summary.waitingForCallBack ? "amber" : undefined}
                            />
                            <Stat label="Minutes used" value={fmt(summary.minutesUsed)} hint={canSeePlan ? "Minutes left: see Plan & usage" : undefined} />
                        </div>
                    )}

                    {/* Call list */}
                    <div className="ui-card overflow-hidden">
                        <div className="no-scrollbar overflow-x-auto border-b border-slate-100 p-4 sm:px-5">
                            <div className="ui-segmented" role="tablist" aria-label="Filter calls">
                                {FILTERS.map((f) => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={filter === f.id}
                                        onClick={() => setFilter(f.id)}
                                        className={`ui-segment whitespace-nowrap ${filter === f.id ? "ui-segment-active" : ""}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                            </div>
                        ) : calls.length === 0 ? (
                            <div className="ui-empty m-4 sm:m-5">
                                {filter === "all"
                                    ? "No AI calls yet. Each call appears here a few seconds after it ends."
                                    : filter === "booked"
                                    ? "No calls ended in a booking yet."
                                    : "No calls without a booking. Nobody is waiting for a call-back."}
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {calls.map((c) => (
                                    <CallRow key={c.id} c={c} busy={busyId === c.id} onMark={markCalledBack} />
                                ))}
                            </ul>
                        )}

                        {hasMore && !loading && (
                            <div className="border-t border-slate-100 p-4 text-center">
                                <button type="button" onClick={loadMore} disabled={loadingMore} className="ui-btn-secondary">
                                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Load more calls
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "emerald" | "amber" }) {
    const color = tone === "emerald" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-900";
    return (
        <div className="ui-card p-4">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${color}`}>{value}</p>
            {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
        </div>
    );
}

function CallRow({ c, busy, onMark }: { c: Call; busy: boolean; onMark: (c: Call, done: boolean) => void }) {
    const booked = c.outcome === "booked";
    const cancelled = c.appointment?.status === "cancelled";
    return (
        <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    {c.from ? (
                        <a href={telOf(c.from)} className="text-sm font-semibold tabular-nums text-slate-900 hover:text-blue-700">
                            {formatAiNumber(c.from)}
                        </a>
                    ) : (
                        <span className="text-sm font-semibold text-slate-500">Number not shown</span>
                    )}
                    <span className={`ui-badge ${booked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {booked ? "Booked" : "Not booked"}
                    </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    {when(c.at)} · {duration(c.durationSeconds)} · {charged(c.billedSeconds)}
                    {c.language && LANG[c.language] ? ` · ${LANG[c.language]}` : ""}
                </p>
                {booked && c.appointment && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-700">
                        <CalendarCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                            {c.appointment.patientName} with {c.appointment.doctorName}, {apptWhen(c.appointment.date, c.appointment.time)}
                        </span>
                        {cancelled && <span className="ui-badge border-rose-200 bg-rose-50 text-rose-700">Cancelled</span>}
                    </p>
                )}
            </div>

            {!booked && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {c.bookedLater ? (
                        <span className="text-xs font-medium text-emerald-700">Booked on a later call</span>
                    ) : c.calledBackAt ? (
                        <>
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Called back{c.calledBackBy ? ` by ${c.calledBackBy}` : ""} · {when(c.calledBackAt)}
                            </span>
                            <button type="button" onClick={() => onMark(c, false)} disabled={busy} className="text-xs font-medium text-blue-700 hover:underline disabled:opacity-50">
                                Undo
                            </button>
                        </>
                    ) : (
                        <>
                            {c.from && (
                                <a href={telOf(c.from)} className="ui-btn-secondary ui-btn-sm min-h-[40px] flex-1 sm:min-h-[32px] sm:flex-none">
                                    <PhoneOutgoing className="h-3.5 w-3.5" /> Call back
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => onMark(c, true)}
                                disabled={busy}
                                className="ui-btn-soft ui-btn-sm min-h-[40px] flex-1 sm:min-h-[32px] sm:flex-none"
                            >
                                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark called back
                            </button>
                        </>
                    )}
                </div>
            )}
        </li>
    );
}
