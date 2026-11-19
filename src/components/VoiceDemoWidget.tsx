"use client";

// Floating "try our AI receptionist" button (bottom-right on every page).
// Visitors talk to the Pillora AI calling agent in Gujarati or Hindi, as if
// they were a patient phoning a hospital. It uses a demo hospital, so nothing
// is really booked.
//
// Hidden unless NEXT_PUBLIC_VOICE_DEMO_URL is set (the voice server's
// WebSocket, e.g. wss://voice.pillorahospital.in/ws).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, PhoneOff, X, Mic, CheckCircle2, Headphones, Sparkles } from "lucide-react";
import { VOICE_DEMO_EVENT } from "@/lib/voiceDemo";

// GA4 event if Google Analytics is on the page; silently does nothing otherwise.
// No personal data is sent, only the language.
function trackEvent(name: "voice_demo_start" | "voice_demo_booked", params: Record<string, string>) {
    try {
        const w = window as unknown as { gtag?: (...args: unknown[]) => void };
        if (typeof w.gtag === "function") w.gtag("event", name, params);
    } catch {
        /* never break the page for analytics */
    }
}

const VOICE_URL = process.env.NEXT_PUBLIC_VOICE_DEMO_URL;
// Logged-in areas where the marketing demo would get in the way.
const HIDDEN_ON = ["/hospital", "/dashboard", "/login", "/register", "/forgot-password", "/reset-password", "/auth", "/checkout"];

type Lang = "gu" | "hi";
type Phase = "idle" | "connecting" | "live" | "ended";
type Status = "listening" | "processing" | "thinking" | "speaking" | "agent_done" | "";
type Line = { who: "you" | "agent" | "note"; text: string };
type Booking = { booking_id: string; doctor: string; weekday: string; date: string; time: string; patient_name: string };

const STATUS_TEXT: Record<Status, string> = {
    "": "Connecting…",
    listening: "Listening…",
    processing: "Got it…",
    thinking: "Thinking…",
    speaking: "Speaking…",
    agent_done: "Your turn, speak now",
};

const TRY_SAY: Record<Lang, string> = {
    gu: "“મારે કાલે ડૉક્ટર શાહની એપોઈન્ટમેન્ટ જોઈએ છે”",
    hi: "“मुझे कल डॉक्टर शाह की अपॉइंटमेंट चाहिए”",
};

export default function VoiceDemoWidget() {
    const [open, setOpen] = useState(false);
    const [lang, setLang] = useState<Lang>("gu");
    const [phase, setPhase] = useState<Phase>("idle");
    const [status, setStatus] = useState<Status>("");
    const [lines, setLines] = useState<Line[]>([]);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [error, setError] = useState("");
    // Polite messages from the server (line busy, demo limit, time over, taking a break).
    const [notice, setNotice] = useState("");
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    // Audio plumbing lives in refs: it must not trigger re-renders.
    const ws = useRef<WebSocket | null>(null);
    const micCtx = useRef<AudioContext | null>(null);
    const playCtx = useRef<AudioContext | null>(null);
    const micStream = useRef<MediaStream | null>(null);
    const playRate = useRef(22050);
    const nextPlay = useRef(0);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const agentDone = useRef(false);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, [lines, booking]);

    const sendPlayed = () => {
        if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: "played" }));
        setStatus("agent_done");
    };

    const stopPlayback = () => {
        sources.current.forEach((s) => {
            s.onended = null;
            try {
                s.stop();
            } catch {}
        });
        sources.current.clear();
        nextPlay.current = 0;
    };

    const playPcm = (buf: ArrayBuffer) => {
        const ctx = playCtx.current;
        const pcm = new Int16Array(buf);
        if (!ctx || !pcm.length) return;
        const audio = ctx.createBuffer(1, pcm.length, playRate.current);
        const ch = audio.getChannelData(0);
        for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x8000;
        const src = ctx.createBufferSource();
        src.buffer = audio;
        src.connect(ctx.destination);
        const start = Math.max(ctx.currentTime + 0.03, nextPlay.current);
        src.start(start);
        nextPlay.current = start + audio.duration;
        sources.current.add(src);
        src.onended = () => {
            sources.current.delete(src);
            if (!sources.current.size && agentDone.current) sendPlayed();
        };
    };

    const cleanup = useCallback(() => {
        stopPlayback();
        micStream.current?.getTracks().forEach((t) => t.stop());
        micCtx.current?.close().catch(() => {});
        playCtx.current?.close().catch(() => {});
        if (ws.current && ws.current.readyState <= WebSocket.OPEN) {
            ws.current.onclose = null;
            ws.current.close();
        }
        if (timer.current) clearInterval(timer.current);
        ws.current = micCtx.current = playCtx.current = micStream.current = null;
        timer.current = null;
    }, []);

    useEffect(() => cleanup, [cleanup]); // hang up if the visitor navigates away

    // Buttons elsewhere on the page ("Hear it now") open this panel.
    useEffect(() => {
        const openPanel = () => setOpen(true);
        window.addEventListener(VOICE_DEMO_EVENT, openPanel);
        return () => window.removeEventListener(VOICE_DEMO_EVENT, openPanel);
    }, []);

    const endCall = useCallback(() => {
        cleanup();
        setPhase("ended");
        setSecondsLeft(null);
    }, [cleanup]);

    const startCall = async () => {
        if (!VOICE_URL) return;
        setError("");
        setNotice("");
        setLines([]);
        setBooking(null);
        setStatus("");
        setPhase("connecting");

        try {
            micStream.current = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
        } catch {
            setError("Microphone access is needed for the demo. Please allow it in your browser and try again.");
            setPhase("idle");
            return;
        }

        try {
            playCtx.current = new AudioContext();
            micCtx.current = new AudioContext();
            await micCtx.current.audioWorklet.addModule("/voice-demo/mic-worklet.js");
        } catch {
            setError("Your browser doesn't support this demo. Please try the latest Chrome, Edge or Safari.");
            cleanup();
            setPhase("idle");
            return;
        }
        const mic = micCtx.current.createMediaStreamSource(micStream.current);
        const worklet = new AudioWorkletNode(micCtx.current, "mic-processor");
        mic.connect(worklet);

        const socket = new WebSocket(VOICE_URL);
        socket.binaryType = "arraybuffer";
        ws.current = socket;
        worklet.port.onmessage = (e) => socket.readyState === WebSocket.OPEN && socket.send(e.data);

        socket.onopen = () => socket.send(JSON.stringify({ type: "start", lang }));
        socket.onerror = () => setNotice("Couldn't reach the demo line. Please try again in a moment.");
        socket.onclose = () => endCall();
        socket.onmessage = (e) => {
            if (typeof e.data !== "string") return playPcm(e.data);
            const m = JSON.parse(e.data);
            switch (m.type) {
                case "limits":
                    setSecondsLeft(m.maxSeconds);
                    timer.current = setInterval(() => setSecondsLeft((s) => (s && s > 0 ? s - 1 : 0)), 1000);
                    break;
                case "ready":
                    playRate.current = m.sampleRate;
                    setPhase("live");
                    trackEvent("voice_demo_start", { language: lang });
                    break;
                case "state":
                    if (m.state === "agent_done") {
                        agentDone.current = true;
                        if (!sources.current.size) sendPlayed();
                    } else {
                        if (m.state === "speaking") agentDone.current = false;
                        setStatus(m.state);
                    }
                    break;
                case "clear":
                    stopPlayback();
                    break;
                case "you":
                    if (!m.partial) setLines((l) => [...l, { who: "you", text: m.text }]);
                    break;
                case "agent":
                    // Sentences of one reply arrive separately: join them into one bubble.
                    setLines((l) =>
                        l.length && l[l.length - 1].who === "agent"
                            ? [...l.slice(0, -1), { who: "agent", text: `${l[l.length - 1].text} ${m.text}` }]
                            : [...l, { who: "agent", text: m.text }],
                    );
                    break;
                case "booked":
                    setBooking(m.booking);
                    trackEvent("voice_demo_booked", { language: lang });
                    break;
                case "refused":
                    setNotice(m.message);
                    break;
                case "error":
                    setLines((l) => [...l, { who: "note", text: "Something went wrong on the line. You can end the call and try again." }]);
                    break;
            }
        };
    };

    const pathname = usePathname() ?? "/";
    const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!VOICE_URL || (hidden && phase !== "live")) return null;

    const live = phase === "live" || phase === "connecting";
    const mmss = secondsLeft == null ? "" : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

    return (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[9998] flex flex-col items-end gap-3 print:hidden">
            {open && (
                <div
                    role="dialog"
                    aria-label="Pillora AI receptionist demo"
                    className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-white">
                        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20">
                            <Headphones className="h-5 w-5" />
                            {live && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-blue-600 bg-green-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold leading-tight">Pillora AI Receptionist</div>
                            <div className="text-xs text-blue-100">Live demo · Gujarati &amp; Hindi</div>
                        </div>
                        {mmss && live && <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-xs tabular-nums">{mmss}</span>}
                        <button
                            onClick={() => {
                                if (live) endCall();
                                setOpen(false);
                            }}
                            aria-label="Close"
                            className="rounded-full p-1 hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Before the call */}
                    {phase === "idle" && (
                        <div className="space-y-4 p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This is the AI that answers your hospital&apos;s phone and books appointments. Talk to it like a patient calling a hospital.
                            </p>
                            <ul className="space-y-1.5 text-sm">
                                <li className="flex gap-2"><Mic className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Speak in Gujarati or Hindi</li>
                                <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Try: <span className="text-gray-700 dark:text-gray-300">{TRY_SAY[lang]}</span></li>
                                <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Demo hospital and doctors. Nothing is really booked.</li>
                            </ul>
                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 text-sm dark:bg-gray-900">
                                {(["gu", "hi"] as Lang[]).map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => setLang(l)}
                                        className={`rounded-lg py-2 font-medium transition ${lang === l ? "bg-white shadow dark:bg-gray-800" : "text-gray-500"}`}
                                    >
                                        {l === "gu" ? "ગુજરાતી" : "हिन्दी"}
                                    </button>
                                ))}
                            </div>
                            {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
                            <button
                                onClick={startCall}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                            >
                                <Phone className="h-4 w-4" /> Start demo call
                            </button>
                            <p className="text-center text-xs text-gray-500">Uses your microphone. Headphones give the best result. Max 3 minutes.</p>
                        </div>
                    )}

                    {/* During the call */}
                    {live && (
                        <div className="flex flex-col">
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="relative grid h-16 w-16 place-items-center">
                                    <span
                                        className={`absolute inset-0 rounded-full ${
                                            status === "speaking" ? "animate-ping bg-blue-400/40" : status === "listening" ? "animate-pulse bg-green-400/40" : "bg-gray-200 dark:bg-gray-800"
                                        }`}
                                    />
                                    <span className="relative grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white">
                                        {status === "listening" ? <Mic className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                                    </span>
                                </div>
                                <div className="text-sm font-medium" aria-live="polite">
                                    {phase === "connecting" ? "Connecting…" : STATUS_TEXT[status]}
                                </div>
                            </div>
                            <div ref={logRef} className="max-h-60 min-h-[6rem] space-y-2 overflow-y-auto px-4 pb-2">
                                {lines.map((l, i) =>
                                    l.who === "note" ? (
                                        <p key={i} className="text-center text-xs text-gray-500">{l.text}</p>
                                    ) : (
                                        <div
                                            key={i}
                                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                                l.who === "you" ? "ml-auto bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-900"
                                            }`}
                                        >
                                            {l.text}
                                        </div>
                                    ),
                                )}
                                {booking && <BookingCard b={booking} />}
                            </div>
                            {error && <p className="mx-4 mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
                            <div className="p-4 pt-2">
                                <button
                                    onClick={endCall}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
                                >
                                    <PhoneOff className="h-4 w-4" /> End call
                                </button>
                            </div>
                        </div>
                    )}

                    {/* After the call */}
                    {phase === "ended" && (
                        <div className="space-y-3 p-4 text-center">
                            {booking && <BookingCard b={booking} />}
                            {notice ? (
                                <p className="rounded-xl bg-gray-100 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">{notice}</p>
                            ) : (
                                !booking && <p className="text-sm text-gray-600 dark:text-gray-400">Call ended.</p>
                            )}
                            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                            <p className="text-sm font-medium">Want this answering your hospital&apos;s phone?</p>
                            <Link
                                href="/#request-demo"
                                onClick={() => setOpen(false)}
                                className="block w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
                            >
                                Request a demo
                            </Link>
                            <button onClick={() => setPhase("idle")} className="text-sm text-blue-600 hover:underline">
                                Try again
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Floating button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="group flex items-center gap-2 rounded-full bg-blue-600 p-1.5 sm:py-2 sm:pl-2 sm:pr-4 text-white shadow-xl transition hover:bg-blue-700"
                    aria-label="Try the Pillora AI receptionist demo"
                >
                    {/* Phones: round icon only, so it doesn't cover page text. */}
                    <span className="relative grid h-11 w-11 sm:h-10 sm:w-10 place-items-center rounded-full bg-white/20">
                        <Headphones className="h-5 w-5" />
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-blue-600 bg-green-400" />
                    </span>
                    <span className="hidden text-left leading-tight sm:block">
                        <span className="block text-sm font-semibold">Talk to our AI</span>
                        <span className="block text-[11px] text-blue-100">Live call demo</span>
                    </span>
                </button>
            )}
        </div>
    );
}

function BookingCard({ b }: { b: Booking }) {
    return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-left text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
            <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Appointment booked (demo)
            </div>
            <div className="mt-1">
                {b.patient_name} · {b.doctor}
                <br />
                {b.weekday}, {b.date} at {b.time} · {b.booking_id}
            </div>
            <div className="mt-1 text-xs opacity-75">In the real service the patient now gets a WhatsApp confirmation.</div>
        </div>
    );
}
