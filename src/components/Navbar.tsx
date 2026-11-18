"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { getUser, clearAuth } from "@/lib/tokenStorage";
import { NAV_LINKS } from "@/content/marketing";

/**
 * Hospital portal header.
 * - Public/marketing pages: product links, Login and "Request a demo".
 * - Dashboard (/hospital/*): branding plus who is signed in and Log Out; the
 *   dashboard's own tab bar handles navigation there.
 */
export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname() || "/";
    const [user, setUser] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => setUser(getUser() || null);
        checkAuth();
        setMenuOpen(false);
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

    const inDashboard = pathname.startsWith('/hospital');
    const homeHref = inDashboard && user ? "/hospital/dashboard" : "/";

    return (
        <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 w-full" aria-label="Main">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 sm:h-20 gap-3">

                    <Link href={homeHref} className="flex-shrink-0 flex items-center" aria-label="Pillora for Hospitals home">
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

                    {/* Product links (public pages only) */}
                    {!inDashboard && (
                        <ul className="hidden lg:flex items-center gap-6">
                            {NAV_LINKS.map((l) => (
                                <li key={l.href}>
                                    <Link
                                        href={l.href}
                                        className={`text-sm font-semibold transition-colors ${pathname === l.href || pathname.startsWith(`${l.href}/`) ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {user ? (
                            <>
                                {!inDashboard && (
                                    <Link href="/hospital/dashboard" className="hidden sm:flex px-4 min-h-[44px] items-center rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
                                        Dashboard
                                    </Link>
                                )}
                                <div className="hidden sm:flex flex-col items-end min-w-0">
                                    <p className="text-sm font-black text-slate-900 leading-none truncate max-w-[200px]">{user.name}</p>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 tracking-tight">Hospital Management</p>
                                </div>
                                <div className="sm:hidden w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm" title={user.name} aria-hidden="true">
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
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:flex px-4 min-h-[44px] items-center rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
                                    Hospital login
                                </Link>
                                <Link href="/get-a-quote#request" className="hidden sm:flex px-5 min-h-[44px] items-center bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                                    Request a demo
                                </Link>
                            </>
                        )}
                        {!inDashboard && (
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                className="lg:hidden p-2 text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label={menuOpen ? "Close menu" : "Open menu"}
                                aria-expanded={menuOpen}
                                aria-controls="hospital-mobile-menu"
                            >
                                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu (public pages) */}
            {!inDashboard && menuOpen && (
                <>
                    <div className="fixed inset-x-0 top-16 sm:top-20 bottom-0 bg-black/30 lg:hidden -z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                    <div id="hospital-mobile-menu" className="lg:hidden absolute top-full inset-x-0 bg-white border-t border-slate-100 shadow-lg p-4">
                        <ul className="space-y-1">
                            {NAV_LINKS.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} className="block px-4 py-3 rounded-lg font-semibold text-slate-700 hover:bg-slate-50">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                            {user ? (
                                <Link href="/hospital/dashboard" className="col-span-2 text-center px-4 py-3 rounded-xl font-bold bg-slate-900 text-white">Open dashboard</Link>
                            ) : (
                                <>
                                    <Link href="/login" className="text-center px-4 py-3 rounded-xl font-bold border border-slate-200 text-slate-700">Hospital login</Link>
                                    <Link href="/get-a-quote#request" className="text-center px-4 py-3 rounded-xl font-bold bg-blue-600 text-white">Request a demo</Link>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </nav>
    );
}
