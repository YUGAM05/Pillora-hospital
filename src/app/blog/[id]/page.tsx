"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Clock,
    User,
    ArrowLeft,
    Calendar,
    Share2,
    Heart,
    Bookmark,
    Loader2,
    BookOpen,
    Droplets,
    Pill,
    Cpu,
    MapPin,
    Building2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Blog {
    _id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    imageUrl?: string;
    author: string;
    authorRole?: string;
    readTime: string;
    date: string;
}

export default function BlogPostDetail() {
    const params = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlogDetail = async () => {
            try {
                const response = await api.get(`/blogs/${params.id}`);
                setBlog(response.data);
            } catch (error) {
                console.error('Error fetching blog detail:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchBlogDetail();
        }
    }, [params.id]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Life-Saver Series": return <Droplets className="w-5 h-5" />;
            case "Pharmacy Guides": return <Pill className="w-5 h-5" />;
            case "Tech & Innovation": return <Cpu className="w-5 h-5" />;
            case "Local Focus": return <MapPin className="w-5 h-5" />;
            default: return <BookOpen className="w-5 h-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Life-Saver Series": return "bg-red-50 text-red-600";
            case "Pharmacy Guides": return "bg-blue-50 text-blue-600";
            case "Tech & Innovation": return "bg-purple-50 text-purple-600";
            case "Local Focus": return "bg-emerald-50 text-emerald-600";
            default: return "bg-blue-50 text-blue-600";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-bold animate-pulse">Loading story...</p>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <h2 className="text-2xl font-black text-gray-900 mb-4">Post Not Found</h2>
                <Link href="/blog" className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
                    <ArrowLeft className="w-4 h-4" /> Back to Blog
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            {/* 1. Header Navigation */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/blog" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm">
                        <ArrowLeft className="w-4 h-4" /> Back to Insights
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Hero Content */}
            <article className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-8 ${getCategoryColor(blog.category)}`}>
                        {getCategoryIcon(blog.category)} {blog.category}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-[1.1] tracking-tighter">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-8 border-y border-gray-100 py-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-100 rounded-[1.25rem] flex items-center justify-center text-gray-400 border border-gray-200">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-base font-black text-gray-900">{blog.author}</p>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{blog.authorRole || 'Contributor'}</p>
                            </div>
                        </div>

                        <div className="h-10 w-[1px] bg-gray-100 hidden md:block" />

                        <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {new Date(blog.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {blog.readTime}
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* 3. Main Image */}
                {blog.imageUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl border border-gray-100"
                    >
                        <Image 
                            src={blog.imageUrl} 
                            alt={blog.title} 
                            fill 
                            className="object-cover" 
                            unoptimized
                        />
                    </motion.div>
                )}

                {/* 4. Body Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="prose prose-lg max-w-none prose-slate"
                >
                    <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed mb-12 italic border-l-4 border-blue-600 pl-8">
                        {blog.description}
                    </p>

                    <div className="whitespace-pre-wrap text-gray-800 leading-loose text-lg font-medium space-y-6" dangerouslySetInnerHTML={{ __html: blog.content }} />
                </motion.div>

                {/* 5. Footer Navigation */}
                <footer className="mt-20 pt-12 border-t border-gray-100">
                    <div className="bg-slate-50 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h4 className="text-lg font-black text-gray-900 mb-2">Did you find this insightful?</h4>
                            <p className="text-gray-500 font-medium">Share this article with your community to spread correct healthcare knowledge.</p>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-8 py-4 bg-white border border-gray-200 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
                                <Share2 className="w-4 h-4" /> Share Post
                            </button>
                            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
                                <Bookmark className="w-4 h-4" /> Save Later
                            </button>
                        </div>
                    </div>
                </footer>
            </article>
        </main>
    );
}
