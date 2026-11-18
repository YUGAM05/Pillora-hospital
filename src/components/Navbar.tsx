"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { getUser, clearAuth } from "@/lib/tokenStorage";

/**
 * Hospital portal header.
 * The portal's sections live in the dashboard's own tab bar, so the header only
 * needs branding plus who is signed in and Log Out — on every screen size.
 * (The old mobile drawer contained no links at all.)
 */
export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkAuth = () => setUser(getUser() || null);
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname]);

    const handleLogout = () => {
        clearAuth();
        setUser(null);
        router.replace("/login");
    };

    // Don't show navbar on login/register pages
    if (pathname === '/login' || pathname === '/register' || pathname === '/auth/change-password') return null;

    const homeHref = user ? "/hospital/dashboard" : "/login";

    return (
        <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 sm:h-20 gap-3">

                    {/* Logo → dashboard */}
                    <Link href={homeHref} className="flex-shrink-0 flex items-center" aria-label="Pillora hospital dashboard">
                        <Image
                            src="/logo-sm.png"
                            alt="Pillora"
                            priority
                            width={72}
                            height={72}
                            className="w-10 h-10 sm:w-14 sm:h-14 xl:w-16 xl:h-16 object-contain object-right"
                            unoptimized
                        />
                        <Image
                            src="/pillora-text-sm.png"
                            alt=""
                            priority
                            width={240}
                            height={80}
                            className="block h-10 sm:h-14 xl:h-[4.5rem] w-auto object-contain object-left -ml-1 sm:-ml-2 xl:-ml-3"
                            unoptimized
                        />
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            {/* Name: full on larger screens, initial on phones */}
                            <div className="hidden sm:flex flex-col items-end min-w-0">
                                <p className="text-sm font-black text-slate-900 leading-none truncate max-w-[220px]">{user.name}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 tracking-tight">Hospital Management</p>
                            </div>
                            <div
                                className="sm:hidden w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm"
                                title={user.name}
                                aria-hidden="true"
                            >
                                {user.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors min-h-[44px] min-w-[44px] justify-center font-bold text-sm"
                                aria-label="Log out"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="hidden md:inline">Log Out</span>
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 min-h-[44px] flex items-center justify-center">
                            Partner Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
