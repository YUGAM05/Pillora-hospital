"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Loader2, Play, ExternalLink, Video, FileText } from 'lucide-react';

interface HealthTip {
    _id: string;
    title: string;
    description: string;
    date: string;
    mediaType?: 'image' | 'video' | 'url';
    imageUrl?: string;
    videoUrl?: string;
    linkUrl?: string;
}

export default function HealthHubPage() {
    const [tips, setTips] = useState<HealthTip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health-hub`);
                setTips(response.data);
            } catch (error) {
                console.error('Error fetching tips:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTips();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-2xl sm:text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Health Hub</h1>
                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                        Stay informed with the latest medical news, health tips, and wellness advice from our experts.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                    {/* Featured Static Health Tips */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full cursor-pointer hover:border-blue-200">
                        <div className="relative h-48 w-full bg-gray-100">
                            <Image src="/tip1.png" alt="Hydration is Key" fill className="object-cover" />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-3">
                                <Calendar className="w-4 h-4" /> Today
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">Hydration is Key</h3>
                            <p className="text-gray-600 line-clamp-3 mb-4 flex-1">
                                Starting your day with a glass of warm water helps kickstart your metabolism and flushes out toxins from your body.
                            </p>
                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                                Read Full Article &rarr;
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full cursor-pointer hover:border-blue-200">
                        <div className="relative h-48 w-full bg-gray-100">
                            <Image src="/tip2.png" alt="Eat the Rainbow" fill className="object-cover" />
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-3">
                                <Calendar className="w-4 h-4" /> Yesterday
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">Eat the Rainbow</h3>
                            <p className="text-gray-600 line-clamp-3 mb-4 flex-1">
                                Incorporate a variety of colorful fruits and vegetables into your meals to ensure you get a wide spectrum of essential vitamins.
                            </p>
                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700">
                                Read Full Article &rarr;
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Tips from DB */}
                    {tips.map((tip) => {
                        const CardContent = (
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full cursor-pointer hover:border-blue-200 group">
                                <div className="relative h-48 w-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {tip.mediaType === 'video' && tip.videoUrl ? (
                                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                                            <video src={tip.videoUrl} className="w-full h-full object-cover" muted playsInline loop autoPlay />
                                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                                <div className="w-10 h-10 bg-white/20 group-hover:bg-white/45 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
                                                    <Play className="w-5 h-5 text-white fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : tip.imageUrl ? (
                                        <Image
                                            src={tip.imageUrl}
                                            alt={tip.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <FileText className="w-12 h-12 text-slate-200" />
                                        </div>
                                    )}

                                    {/* Media Type Ribbon overlay */}
                                    {tip.mediaType && (
                                        <div className="absolute top-3 left-3 z-10">
                                            {tip.mediaType === 'video' ? (
                                                <span className="px-2.5 py-1 bg-rose-500 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-md">
                                                    <Video className="w-2.5 h-2.5" /> Video
                                                </span>
                                            ) : tip.mediaType === 'url' ? (
                                                <span className="px-2.5 py-1 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-md">
                                                    <ExternalLink className="w-2.5 h-2.5" /> Link
                                                </span>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-3">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(tip.date).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {tip.title}
                                    </h3>
                                    <p className="text-gray-600 line-clamp-3 mb-4 flex-1">
                                        {tip.description}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-blue-600 font-semibold group-hover:text-blue-700">
                                        {tip.mediaType === 'url' ? (
                                            <>
                                                <span>Visit Resource</span>
                                                <ExternalLink className="w-4 h-4 text-emerald-600" />
                                            </>
                                        ) : (
                                            <>
                                                <span>Read Full Article</span>
                                                <span>&rarr;</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );

                        if (tip.mediaType === 'url' && tip.linkUrl) {
                            return (
                                <a href={tip.linkUrl} key={tip._id} target="_blank" rel="noopener noreferrer" className="block h-full">
                                    {CardContent}
                                </a>
                            );
                        } else {
                            return (
                                <Link href={`/health-hub/${tip._id}`} key={tip._id} className="block h-full">
                                    {CardContent}
                                </Link>
                            );
                        }
                    })}
                </div>
            </div>
        </div>
    );
}
