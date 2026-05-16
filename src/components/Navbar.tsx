"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X, Activity, LayoutDashboard, Users, Calendar, Settings } from "lucide-react";
import { getUser, clearAuth } from "@/lib/tokenStorage";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkAuth = () => {
            const storedUser = getUser();
            if (storedUser) setUser(storedUser);
            else setUser(null);
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname]);

    const handleLogout = () => {
        clearAuth();
        setUser(null);
        router.push("/login");
        setIsOpen(false);
    };

    // Don't show navbar on login/register pages
    if (pathname === '/login' || pathname === '/register' || pathname === '/auth/change-password') return null;

    const navLinks = [
        { href: "/hospital/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { href: "/hospital/dashboard", label: "Doctors", icon: <Users className="w-4 h-4" /> },
        { href: "/hospital/dashboard", label: "Appointments", icon: <Calendar className="w-4 h-4" /> },
    ];

    return (
        <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight text-slate-900 leading-none">Pillora <span className="text-blue-600">Hospital</span></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Partner Portal</span>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden lg:flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                                        pathname === link.href 
                                        ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
                                        : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {user ? (
                            <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Hospital Management</p>
                                </div>
                                <button onClick={handleLogout} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors shadow-sm shadow-rose-100">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                                Partner Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-slate-500">
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden bg-white border-t border-slate-100 p-6 space-y-4"
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                                    pathname === link.href 
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                                    : 'bg-slate-50 text-slate-500'
                                }`}
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        ))}
                        {user && (
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-rose-50 text-rose-500 rounded-2xl font-bold">
                                <LogOut className="w-5 h-5" />
                                Log Out
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
