"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Loader2, ArrowLeft, Share2, Clock, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export default function HealthTipDetailPage() {
    const params = useParams();
    const [tip, setTip] = useState<HealthTip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTip = async () => {
            if (!params.id) return;
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/health-hub/${params.id}`);
                setTip(response.data);
            } catch (err) {
                console.error('Error fetching tip details:', err);
                setError('Failed to load article details.');
            } finally {
                setLoading(false);
            }
        };

        fetchTip();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error || !tip) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Article not found'}</h2>
                <Link href="/health-hub" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Health Hub
                </Link>
            </div>
        );
    }

    const showTitleBelow = tip.mediaType === 'video' || tip.mediaType === 'url' || !tip.imageUrl;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/health-hub" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Health Hub
                </Link>

                <article className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                    {tip.mediaType === 'video' && tip.videoUrl ? (
                        <div className="relative w-full bg-black flex items-center justify-center border-b border-gray-100">
                            <video
                                src={tip.videoUrl}
                                controls
                                className="w-full max-h-[480px] object-contain"
                            />
                        </div>
                    ) : tip.imageUrl ? (
                        <div className="relative h-[400px] w-full">
                            <Image
                                src={tip.imageUrl}
                                alt={tip.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                                <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-tight shadow-sm">
                                    {tip.title}
                                </h1>
                                <div className="flex items-center gap-6 text-sm font-medium opacity-90">
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(tip.date).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                        <Clock className="w-4 h-4" />
                                        Around 5 min read
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {showTitleBelow && (
                        <div className="p-8 md:p-12 border-b border-gray-100">
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 leading-tight">
                                {tip.title}
                            </h1>
                            <div className="flex items-center gap-6 text-sm font-medium text-gray-500 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    {new Date(tip.date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    Around 5 min read
                                </div>
                                {tip.mediaType === 'url' && tip.linkUrl && (
                                    <a href={tip.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold ml-2">
                                        <ExternalLink className="w-4 h-4" /> Visit External Link
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        <div className="prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed space-y-6">
                            {tip.description.split('\n').map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-sm text-gray-400 font-medium">
                                Published by Pillora Medical Team
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                                <Share2 className="w-4 h-4" />
                                Share Article
                            </button>
                        </div>
                    </div>
                </article>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 italic mb-4">Was this article helpful?</p>
                    <div className="flex items-center justify-center gap-4">
                        <button className="px-6 py-2 border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors font-medium">
                            Yes, it was helpful
                        </button>
                        <button className="px-6 py-2 border border-gray-200 rounded-full hover:border-gray-400 hover:text-gray-700 transition-colors font-medium">
                            Not really
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
