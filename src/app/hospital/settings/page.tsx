"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HospitalSettingsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/hospital/dashboard?tab=settings");
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 font-bold text-slate-500 animate-pulse text-sm">Opening Hospital Settings...</p>
        </div>
    );
}
