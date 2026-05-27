"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Siren, Clock, MapPin, CheckCircle, AlertOctagon, ArrowLeft, Loader2, Droplet, User, ShieldCheck, Trash2 } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/api';

interface BloodRequest {
    _id: string;
    patientName: string;
    bloodGroup: string;
    units: number;
    city: string;
    area: string;
    hospitalAddress: string;
    status: string;
    isUrgent: boolean;
    createdAt: string;
    aiVerificationStatus?: string;
    aiVerificationRemarks?: string;
}

export default function MyBloodRequestsPage() {
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blood request?')) {
            return;
        }
        setDeletingId(id);
        try {
            await api.delete(`/blood-bank/requests/${id}`);
            setRequests(prev => prev.filter(req => req._id !== id));
        } catch (error: any) {
            const errMsg = error.response?.data?.message || error.message || 'Failed to delete request';
            alert(`Error: ${errMsg}`);
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        const fetchMyRequests = async () => {
            try {
                if (!api) {
                    console.warn('API instance is not initialized yet');
                    return;
                }
                const response = await api.get('/blood-bank/my-requests');
                setRequests(response.data);
            } catch (error) {
                console.error('Error fetching blood requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyRequests();

        // Optional: Polling to see background status update
        const interval = setInterval(fetchMyRequests, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <Link href="/" className="p-2 hover:bg-white rounded-full transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Blood Requests</h1>
                        <p className="text-sm text-gray-500">History of blood requests you&apos;ve broadcasted</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading your requests...</p>
                    </div>
                ) : requests.length > 0 ? (
                    <div className="space-y-6">
                        {requests.map((request, index) => (
                            <motion.div
                                key={request._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`bg-white rounded-3xl p-6 md:p-8 shadow-sm border transition-all ${request.aiVerificationStatus === 'Rejected' ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}`}
                            >
                                {request.aiVerificationStatus === 'Rejected' && (
                                    <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                                        <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-red-900 text-sm">KYC Verification Rejected</h4>
                                            <p className="text-red-700 text-xs mt-1 italic">
                                                &quot;{request.aiVerificationRemarks || 'Your identity document could not be verified by our AI agent. Your contact details will not be shared with donors until this is resolved.'}&quot;
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${request.isUrgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <Droplet className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-gray-900 text-xl">{request.patientName}</h3>
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-full">
                                                    {request.bloodGroup}
                                                </span>
                                                {request.isUrgent && (
                                                    <span className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase rounded-full">
                                                        <Siren className="w-3 h-3" /> Urgent
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    {request.city}, {request.area}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {new Date(request.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-gray-400" />
                                                    {request.units} Units Required
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-colors ${request.status === 'Open' ? 'bg-green-50 text-green-700 border-green-200' :
                                            request.status === 'Urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-gray-100 text-gray-600 border-gray-300'
                                            }`}>
                                            {request.status}
                                        </div>
                                        {request.aiVerificationStatus === 'Verified' && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                                                <ShieldCheck className="w-3 h-3" /> KYC Verified
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="font-medium text-gray-900 shrink-0">Hospital:</span>
                                        <span className="truncate">{request.hospitalAddress}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(request._id)}
                                        disabled={deletingId === request._id}
                                        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-bold transition-colors border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-xl disabled:opacity-50 shrink-0"
                                    >
                                        {deletingId === request._id ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Siren className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Requests Found</h2>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                            You haven&apos;t submitted any blood requests yet.
                        </p>
                        <Link href="/blood-bank" className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-100">
                            Request Blood Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
