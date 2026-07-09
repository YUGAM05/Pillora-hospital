"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu, X, LayoutDashboard, Users, Calendar, Bell } from "lucide-react";
import { getUser, clearAuth } from "@/lib/tokenStorage";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

function formatTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const res = await api.get("/notifications");
                setNotifications(res.data || []);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    useEffect(() => {
        setMounted(true);
        setIsMounted(true);
        const checkAuth = () => {
            const storedUser = getUser();
            if (storedUser) setUser(storedUser);
            else setUser(null);
        };
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [pathname]);

    // Lock body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleLogout = () => {
        clearAuth();
        setUser(null);
        router.replace("/login");
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
    <>
        <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    
                    {/* Mobile Menu Button (Left) */}
                    <div className="flex items-center lg:hidden gap-2">
                        <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <Menu className="w-6 h-6" />
                        </button>
                        
                        {/* Mobile Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center group">
                            <Image
                                src="/logo.png"
                                alt="Pillora"
                                width={72}
                                height={72}
                                className="w-12 h-12 object-contain object-right"
                                unoptimized
                            />
                            <Image
                                src="/pillora-text.png"
                                alt="Pillora"
                                width={240}
                                height={80}
                                className="block h-12 w-auto object-contain object-left -ml-1"
                                unoptimized
                            />
                        </Link>
                    </div>

                    {/* Desktop Logo */}
                    <Link href="/" className="hidden lg:flex-shrink-0 lg:flex items-center group">
                        <Image
                            src="/logo.png"
                            alt="Pillora"
                            width={72}
                            height={72}
                            className="w-14 h-14 xl:w-16 xl:h-16 object-contain object-right"
                            unoptimized
                        />
                        <Image
                            src="/pillora-text.png"
                            alt="Pillora"
                            width={240}
                            height={80}
                            className="block h-14 sm:h-16 xl:h-[4.5rem] w-auto object-contain object-left -ml-1 sm:-ml-2 xl:-ml-3"
                            unoptimized
                        />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden lg:flex items-center gap-8">
                        {user && (
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
                        )}

                        {user ? (
                            <div className="flex items-center gap-4 border-l border-slate-100 pl-8">
                                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center">
                                    <Bell className="w-5 h-5" />
                                    {notifications.some(n => !n.read) && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                                    )}
                                </button>

                                <div className="flex flex-col items-end">
                                    <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Hospital Management</p>
                                </div>
                                <button onClick={handleLogout} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors shadow-sm shadow-rose-100 min-h-[44px] min-w-[44px] flex items-center justify-center">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 min-h-[44px] flex items-center justify-center">
                                Partner Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Notification Bell */}
                    {user && (
                        <div className="lg:hidden relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 hover:text-slate-900 transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center">
                                <Bell className="w-6 h-6" />
                                {notifications.some(n => !n.read) && (
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute left-0 right-0 lg:left-auto lg:right-6 top-20 w-full lg:w-80 bg-white border-b lg:border border-slate-100 lg:rounded-2xl shadow-2xl z-50 p-4"
                        >
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest">Notifications</h4>
                                {notifications.some(n => !n.read) && (
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await api.put('/notifications/read-all');
                                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                            } catch (err) {
                                                console.error("Failed to mark all as read:", err);
                                            }
                                        }}
                                        className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold cursor-pointer"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div 
                                            key={notif._id} 
                                            onClick={() => handleMarkAsRead(notif._id)}
                                            className={`p-2.5 rounded-xl transition-colors cursor-pointer flex flex-col gap-0.5 text-left ${
                                                notif.read ? 'hover:bg-slate-50 opacity-70' : 'bg-blue-50/50 hover:bg-blue-50 font-bold border-l-2 border-blue-500 pl-2'
                                            }`}
                                        >
                                            <p className="text-xs text-slate-800 leading-snug">{notif.message}</p>
                                            <span className="text-[9px] font-semibold text-slate-400">{formatTimeAgo(notif.createdAt)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </nav>

        {/* Mobile Sidebar — portaled to document.body to escape nav's stacking context */}
        {isMounted && createPortal(
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Full-page backdrop — z-[9998] at root level */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            style={{ zIndex: 9998 }}
                            onClick={() => setIsOpen(false)}
                        />
                        {/* Sidebar panel — z-[9999] at root level */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[280px] bg-white flex flex-col shadow-2xl"
                            style={{ zIndex: 9999 }}
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Image
                                        src="/logo.png"
                                        alt="Pillora"
                                        width={72}
                                        height={72}
                                        className="w-12 h-12 object-contain object-right"
                                        unoptimized
                                    />
                                    <Image
                                        src="/pillora-text.png"
                                        alt="Pillora"
                                        width={240}
                                        height={80}
                                        className="block h-12 w-auto object-contain object-left -ml-1"
                                        unoptimized
                                    />
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-3 flex-1 overflow-y-auto">
                                {user && navLinks.map((link) => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 min-h-[44px] rounded-2xl font-bold transition-all ${
                                            pathname === link.href
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {link.icon}
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            {user && (
                                <div className="p-6 border-t border-slate-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-none">{user.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{user.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 min-h-[44px] bg-rose-50 text-rose-500 rounded-xl font-bold hover:bg-rose-100 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        )}
    </>
    );
}
