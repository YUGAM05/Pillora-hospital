"use client";

// Plan usage for the hospital dashboard: WhatsApp messages and AI call minutes
// this month, add-on packs (carry over 6 months), delivery reports, and
// buying more packs with Razorpay.  Data: GET /hospital/dashboard/usage

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { MessageCircle, PhoneCall, Package, CheckCircle2, AlertTriangle, Loader2, Stethoscope } from "lucide-react";

type Usage = {
    plan: { code: string; label: string; priceMonthly: number; maxDoctors: number | null; doctorsUsed: number };
    month: string;
    whatsapp: {
        planLimit: number; planUsed: number; graceUsed: number; packUsedThisMonth: number;
        byKind: { confirmation: number; reminder: number; followup: number; other: number };
        skipped: number; packRemaining: number; available: number; lowWarning: boolean;
        delivery30d: Record<string, number>;
    };
    ai: {
        planMinutes: number; planUsedMinutes: number; packUsedMinutesThisMonth: number; overageMinutes: number;
        calls: number; packRemainingMinutes: number; availableMinutes: number; lowWarning: boolean;
    };
    packs: { id: string; kind: "whatsapp" | "ai_minutes"; label: string; quantity: number; remaining: number; status: string; source: string; expiresAt?: string }[];
    catalog: { code: string; kind: "whatsapp" | "ai_minutes"; quantity: number; price: number; gst: number; total: number; label: string }[];
};

const fmt = (n: number) => n.toLocaleString("en-IN");
const monthName = (m: string) => new Date(`${m}-01T00:00:00+05:30`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
const dateIN = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

declare global {
    interface Window { Razorpay?: any }
}

function loadRazorpay(): Promise<boolean> {
    if (typeof window === "undefined") return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);
    return new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

/** Fetches usage; shared by the panel and the small warning banner. */
export function useUsage() {
    const [usage, setUsage] = useState<Usage | null>(null);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        try {
            const res = await api.get("/hospital/dashboard/usage");
            setUsage(res.data);
            setError("");
        } catch (e: any) {
            setError(e.response?.data?.message || "Could not load usage");
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    return { usage, error, reload: load };
}

function Meter({ used, total, warn }: { used: number; total: number; warn?: boolean }) {
    const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : used > 0 ? 100 : 0;
    const color = pct >= 100 ? "bg-red-500" : warn || pct >= 80 ? "bg-amber-500" : "bg-blue-600";
    return (
        <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
        </div>
    );
}

/** Small banner shown on every tab when messages or AI minutes are running low. */
export function UsageWarningBanner({ onOpen }: { onOpen: () => void }) {
    const { usage } = useUsage();
    if (!usage) return null;
    const waOut = usage.whatsapp.available === 0;
    const aiOut = usage.ai.planMinutes + usage.ai.packRemainingMinutes > 0 && usage.ai.availableMinutes === 0;
    const items = [
        waOut ? "WhatsApp messages are used up; reminders are paused" : usage.whatsapp.lowWarning ? `Only ${fmt(usage.whatsapp.available)} WhatsApp messages left this month` : "",
        aiOut ? "AI call minutes are used up; calls go unanswered by the AI" : usage.ai.lowWarning ? `Only ${fmt(usage.ai.availableMinutes)} AI call minutes left` : "",
    ].filter(Boolean);
    if (!items.length) return null;
    return (
        <div className={`mb-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border p-4 ${waOut || aiOut ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold flex-1">{items.join(" · ")}</p>
            <button onClick={onOpen} className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-gray-50">
                Buy more
            </button>
        </div>
    );
}

export default function UsagePanel() {
    const { usage, error, reload } = useUsage();
    const [buying, setBuying] = useState<string | null>(null);
    const [notice, setNotice] = useState("");

    const buy = async (code: string) => {
        setNotice("");
        setBuying(code);
        try {
            if (!(await loadRazorpay())) throw new Error("Could not load the payment window. Check your internet connection.");
            const { data: order } = await api.post("/hospital/dashboard/packs/order", { packCode: code });
            await new Promise<void>((resolve) => {
                const rzp = new window.Razorpay({
                    key: order.keyId,
                    order_id: order.orderId,
                    amount: order.amount,
                    currency: order.currency,
                    name: "Pillora",
                    description: `${order.pack.label} (incl. GST)`,
                    prefill: { name: order.hospitalName, email: order.email, contact: order.phone },
                    theme: { color: "#2563eb" },
                    handler: async (resp: any) => {
                        try {
                            await api.post("/hospital/dashboard/packs/verify", resp);
                            setNotice(`✅ ${order.pack.label} added.`);
                        } catch (e: any) {
                            setNotice(e.response?.data?.message || "Payment received, but confirmation failed. The pack will appear within a few minutes.");
                        }
                        await reload();
                        resolve();
                    },
                    modal: { ondismiss: () => resolve() },
                });
                rzp.on("payment.failed", (resp: any) => {
                    setNotice(`Payment failed: ${resp?.error?.description || "please try again"}`);
                });
                rzp.open();
            });
        } catch (e: any) {
            setNotice(e.response?.data?.message || e.message || "Could not start the payment");
        } finally {
            setBuying(null);
        }
    };

    if (error) return <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
    if (!usage) return <div className="flex items-center gap-2 p-6 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading usage…</div>;

    const wa = usage.whatsapp;
    const ai = usage.ai;
    const delivered = (wa.delivery30d.delivered ?? 0) + (wa.delivery30d.read ?? 0);
    const failed = (wa.delivery30d.failed ?? 0) + (wa.delivery30d.send_error ?? 0);
    const activePacks = usage.packs.filter((p) => p.status === "active" && p.remaining > 0);
    const pendingPacks = usage.packs.filter((p) => p.status === "pending");

    return (
        <section className="space-y-5" aria-labelledby="usage-heading">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
                <h2 id="usage-heading" className="text-xl font-black text-gray-900">Usage & add-ons</h2>
                <p className="text-sm text-gray-500">{monthName(usage.month)} · resets on the 1st</p>
            </div>

            {notice && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-800">{notice}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plan */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><Stethoscope className="w-4 h-4" /> Your plan</div>
                    <p className="mt-2 text-2xl font-black text-gray-900">{usage.plan.label}</p>
                    <p className="text-sm text-gray-500">₹{fmt(usage.plan.priceMonthly)} / month + GST</p>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm font-semibold text-gray-700">
                            <span>Doctors</span>
                            <span>{usage.plan.doctorsUsed} / {usage.plan.maxDoctors ?? "unlimited"}</span>
                        </div>
                        {usage.plan.maxDoctors !== null && <div className="mt-2"><Meter used={usage.plan.doctorsUsed} total={usage.plan.maxDoctors} /></div>}
                    </div>
                </div>

                {/* WhatsApp */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp messages</div>
                    <p className="mt-2 text-2xl font-black text-gray-900">
                        {fmt(wa.planUsed)} <span className="text-base font-bold text-gray-400">/ {fmt(wa.planLimit)}</span>
                    </p>
                    <div className="mt-2"><Meter used={wa.planUsed} total={wa.planLimit} warn={wa.lowWarning} /></div>
                    <ul className="mt-3 space-y-1 text-xs text-gray-600">
                        <li>Confirmations {fmt(wa.byKind.confirmation)} · Reminders {fmt(wa.byKind.reminder)} · Follow-ups {fmt(wa.byKind.followup)}</li>
                        {wa.packRemaining > 0 && <li className="font-semibold text-gray-800">+ {fmt(wa.packRemaining)} from add-on packs</li>}
                        {wa.graceUsed > 0 && <li className="text-amber-700">{fmt(wa.graceUsed)} confirmations sent beyond the plan (grace)</li>}
                        {wa.skipped > 0 && <li className="text-red-700">{fmt(wa.skipped)} reminders not sent (messages used up)</li>}
                        {delivered + failed > 0 && (
                            <li>Last 30 days: <span className="text-green-700 font-semibold">{fmt(delivered)} delivered</span>{failed > 0 && <>, <span className="text-red-700 font-semibold">{fmt(failed)} failed</span></>}</li>
                        )}
                    </ul>
                </div>

                {/* AI minutes */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><PhoneCall className="w-4 h-4 text-violet-600" /> AI call minutes</div>
                    {ai.planMinutes === 0 && ai.packRemainingMinutes === 0 ? (
                        <>
                            <p className="mt-2 text-base font-bold text-gray-900">Not included in the {usage.plan.label} plan</p>
                            <p className="mt-1 text-sm text-gray-500">Add the AI phone receptionist with a minutes pack below, or upgrade to the Hospital plan (500 min/month included).</p>
                        </>
                    ) : (
                        <>
                            <p className="mt-2 text-2xl font-black text-gray-900">
                                {fmt(ai.planUsedMinutes)} <span className="text-base font-bold text-gray-400">/ {fmt(ai.planMinutes)} min</span>
                            </p>
                            {ai.planMinutes > 0 && <div className="mt-2"><Meter used={ai.planUsedMinutes} total={ai.planMinutes} warn={ai.lowWarning} /></div>}
                            <ul className="mt-3 space-y-1 text-xs text-gray-600">
                                <li>{fmt(ai.calls)} AI calls this month</li>
                                {ai.packRemainingMinutes > 0 && <li className="font-semibold text-gray-800">+ {fmt(ai.packRemainingMinutes)} min from add-on packs</li>}
                                {ai.overageMinutes > 0 && <li className="text-amber-700">{fmt(ai.overageMinutes)} min over the allowance</li>}
                            </ul>
                        </>
                    )}
                </div>
            </div>

            {/* Packs owned */}
            {(activePacks.length > 0 || pendingPacks.length > 0) && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500"><Package className="w-4 h-4" /> Your add-on packs</div>
                    <ul className="mt-3 divide-y divide-gray-50">
                        {activePacks.map((p) => (
                            <li key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 text-sm">
                                <span className="font-semibold text-gray-800">{p.label}</span>
                                <span className="text-gray-600">
                                    {fmt(p.remaining)} {p.kind === "whatsapp" ? "messages" : "min"} left · valid until {dateIN(p.expiresAt)}
                                </span>
                            </li>
                        ))}
                        {pendingPacks.map((p) => (
                            <li key={p.id} className="py-2 text-sm text-amber-700">{p.label}: payment being confirmed…</li>
                        ))}
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">Packs are used after your monthly plan allowance, oldest first, and carry over for 6 months.</p>
                </div>
            )}

            {/* Buy more */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="text-base font-black text-gray-900">Buy more</h3>
                <p className="text-sm text-gray-500">Prices include 18% GST. Added instantly after payment.</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {usage.catalog.map((p) => (
                        <div key={p.code} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                                    {p.kind === "whatsapp" ? <MessageCircle className="w-4 h-4 text-green-600 shrink-0" /> : <PhoneCall className="w-4 h-4 text-violet-600 shrink-0" />}
                                    {p.label}
                                </p>
                                <p className="text-xs text-gray-500">₹{fmt(p.price)} + GST = ₹{fmt(p.total)}</p>
                            </div>
                            <button
                                onClick={() => buy(p.code)}
                                disabled={!!buying}
                                className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 min-h-[40px]"
                            >
                                {buying === p.code ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buy"}
                            </button>
                        </div>
                    ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500"><CheckCircle2 className="w-3.5 h-3.5" /> Paying offline (UPI / bank)? Contact Pillora and we&apos;ll add the pack for you.</p>
            </div>
        </section>
    );
}
