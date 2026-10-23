"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
    Play, 
    Pause, 
    Volume2, 
    VolumeX, 
    Maximize2, 
    Minimize2,
    RotateCcw,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AboutVideoPlayerProps {
    src?: string;
    cdnSrc?: string;
    poster?: string;
    title?: string;
    subtitle?: string;
    badgeText?: string;
    accentColor?: "rose" | "blue";
}

export default function AboutVideoPlayer({
    src = "/PILLORA.mp4",
    cdnSrc,
    poster,
    title = "Experience Pillora in Motion",
    subtitle = "Discover how Pillora bridges medical institutions and patients with next-generation appointment scheduling, doctor management, and transparent healthcare coordination.",
    badgeText = "Official Intro Film",
    accentColor = "blue"
}: AboutVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [duration, setDuration] = useState("0:00");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isRose = accentColor === "rose";

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current && !videoRef.current) return;
        const isCurrentlyFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);

        try {
            if (!isCurrentlyFullscreen) {
                // Request fullscreen on container or fallback to video element (iOS Safari)
                if (containerRef.current?.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
                    await (containerRef.current as any).webkitRequestFullscreen();
                } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
                    (videoRef.current as any).webkitEnterFullscreen();
                    setIsFullscreen(true);
                    return;
                }
                setIsFullscreen(true);

                // Lock orientation to landscape on mobile / tablet devices
                if (typeof window !== "undefined" && window.screen?.orientation && typeof (window.screen.orientation as any).lock === "function") {
                    try {
                        await (window.screen.orientation as any).lock("landscape");
                    } catch (err) {
                        // Browsers may restrict orientation lock outside user gestures or installed PWAs
                    }
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                }
                setIsFullscreen(false);

                // Unlock orientation back to normal
                if (typeof window !== "undefined" && window.screen?.orientation && typeof (window.screen.orientation as any).unlock === "function") {
                    try {
                        (window.screen.orientation as any).unlock();
                    } catch (err) {
                        // Ignore
                    }
                }
            }
        } catch (e) {
            console.error("Fullscreen error", e);
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        setCurrentTime(formatTime(current));
        if (dur) {
            setProgress((current / dur) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (!videoRef.current) return;
        setDuration(formatTime(videoRef.current.duration));
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clickPos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = clickPos * videoRef.current.duration;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
            setIsFullscreen(isFull);
            if (!isFull && typeof window !== "undefined" && window.screen?.orientation && typeof (window.screen.orientation as any).unlock === "function") {
                try {
                    (window.screen.orientation as any).unlock();
                } catch (e) {}
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const restartVideo = () => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
    };

    return (
        <section className="relative py-16 md:py-24 px-4 sm:px-6 overflow-hidden">
            {/* Header info */}
            <div className="max-w-4xl mx-auto text-center mb-10 sm:mb-14">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border ${
                        isRose
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : "bg-blue-50 text-blue-600 border-blue-200"
                    }`}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    {badgeText}
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4"
                >
                    {title}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed"
                >
                    {subtitle}
                </motion.p>
            </div>

            {/* Video Container with Premium Glowing Frame */}
            <div className="max-w-5xl mx-auto relative">
                {/* Ambient glow halos */}
                <div 
                    className={`absolute -inset-4 sm:-inset-6 rounded-[3rem] blur-3xl opacity-30 transition-all duration-700 pointer-events-none ${
                        isRose 
                            ? "bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500" 
                            : "bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400"
                    }`} 
                />

                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.96, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => isPlaying && setShowControls(false)}
                    className={`relative w-full overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl shadow-slate-950/40 group select-none transition-all duration-300 ${
                        isFullscreen 
                            ? "rounded-none border-none aspect-auto h-screen flex items-center justify-center" 
                            : "aspect-video rounded-[2rem] sm:rounded-[2.5rem]"
                    }`}
                >
                    <video
                        ref={videoRef}
                        className={`w-full h-full cursor-pointer transition-all ${
                            isFullscreen ? "object-contain" : "object-cover"
                        }`}
                        onClick={togglePlay}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        poster={poster}
                        playsInline
                        preload="metadata"
                    >
                        {cdnSrc && <source src={cdnSrc} type="video/mp4" />}
                        <source src={src} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* Big Center Play/Pause Overlay */}
                    <AnimatePresence>
                        {(!isPlaying || showControls) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                {!isPlaying && (
                                    <button
                                        onClick={togglePlay}
                                        className={`pointer-events-auto relative group/btn w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                                            isRose
                                                ? "bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/50"
                                                : "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-600/50"
                                        }`}
                                        aria-label="Play Video"
                                    >
                                        {/* Ripple rings */}
                                        <span className="absolute -inset-3 rounded-full border border-white/30 animate-ping opacity-60 pointer-events-none" />
                                        <span className="absolute -inset-6 rounded-full border border-white/10 pointer-events-none" />
                                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom Control Bar */}
                    <div 
                        className={`absolute bottom-0 inset-x-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
                            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                    >
                        {/* Progress Bar */}
                        <div 
                            onClick={handleSeek}
                            className="relative h-1.5 sm:h-2 w-full bg-white/20 hover:h-2.5 rounded-full cursor-pointer mb-3 sm:mb-4 transition-all overflow-hidden group/bar"
                        >
                            <div 
                                className={`h-full rounded-full transition-all duration-100 ${
                                    isRose
                                        ? "bg-gradient-to-r from-rose-500 to-red-500"
                                        : "bg-gradient-to-r from-blue-500 to-indigo-500"
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button
                                    onClick={togglePlay}
                                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                                    )}
                                </button>

                                <button
                                    onClick={restartVideo}
                                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    title="Replay from start"
                                    aria-label="Replay"
                                >
                                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                <button
                                    onClick={toggleMute}
                                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    aria-label={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                                    ) : (
                                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>

                                <div className="font-mono text-[11px] sm:text-xs text-white/70 tracking-wider">
                                    <span className="text-white font-bold">{currentTime}</span> / {duration}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Landscape"}
                                    aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                >
                                    {isFullscreen ? (
                                        <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
