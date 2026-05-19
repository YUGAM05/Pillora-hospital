"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Phone, LogOut, LayoutDashboard, ShoppingBag, Heart } from "lucide-react";
import { getUser, clearAuth } from "@/lib/tokenStorage";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = getUser();
        if (!storedUser) {
            router.replace("/login");
        } else {
            setUser(storedUser);
        }
    }, [router]);

    const handleLogout = () => {
        clearAuth();
        router.replace("/login");
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <LayoutDashboard className="w-10 h-10 text-primary" />
                        Welcome, {user.name}
                    </h1>
                    <p className="text-gray-500">Manage your orders and blood connect profile from here.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Stats / Quick Info */}
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Status</p>
                            <p className="text-xl font-bold text-gray-900">Verified</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                            <Phone className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Mobile Number</p>
                            <p className="text-xl font-bold text-gray-900">{user.phoneNumber || "N/A"}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                            <Heart className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Blood Connect</p>
                            <p className="text-xl font-bold text-gray-900">Active</p>
                        </div>
                    </motion.div>
                </div>

                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <ShoppingBag className="w-6 h-6 text-primary" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-800">Login Successful</p>
                                    <p className="text-sm text-gray-500">Today at {new Date().toLocaleTimeString()}</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Completed</span>
                            </div>
                            <p className="text-center text-gray-400 py-8 italic">No other recent activities found.</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <User className="w-6 h-6 text-primary" />
                            Profile Details
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                                <p className="font-medium text-gray-800">{user.name || "—"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                                <p className="font-medium text-gray-800">{user.email || "—"}</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="mt-4 flex items-center gap-2 text-red-600 font-bold hover:text-red-700 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out from all devices
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
