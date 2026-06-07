"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Phone, Clock, CreditCard, Star, ChevronLeft, ChevronRight, User, ExternalLink, Building2, Share2, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Doctor {
    name: string;
    specialization?: string;
    daysAvailable?: string[];
    timing?: string;
}

interface Hospital {
    _id: string;
    slug: string;
    name: string;
    address: string;
    mapLink?: string;
    city: string;
    image: string;
    images?: string[];
    isOpen24Hours: boolean;
    consultationFee: number;
    governmentSchemes: string[];
    isOnlinePaymentAvailable: boolean;
    ambulanceContact: string;
    contactNumber?: string;
    phoneNumbers?: string[];
    description: string;
    rating: number;
    doctors?: Doctor[];
    is_verified: boolean;
    management_type: 'SELF' | 'PILLORA';
}

// ─── Image Slideshow ──────────────────────────────────────────────────────────
function ImageSlideshow({ images, alt }: { images: string[]; alt: string }) {
    const [idx, setIdx] = useState(0);
    const fallback = '/premium-hospital.png';

    const prev = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }, [images.length]);
    const next = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }, [images.length]);

    useEffect(() => {
        if (images.length <= 1) return;
        const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
        return () => clearInterval(t);
    }, [images.length]);

    return (
        <div className="absolute inset-0">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                >
                    <Image
                        src={images[idx] || fallback}
                        alt={`${alt} – image ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
                    />
                </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors z-10">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm transition-colors z-10">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {images.map((_, i) => (
                            <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                                className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-3' : 'bg-white/50 w-1.5'}`} />
                        ))}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full z-10 font-medium">
                        {idx + 1}/{images.length}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="h-44 bg-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3.5 bg-gray-100 rounded w-full" />
                <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                <div className="border-t pt-3 flex justify-between">
                    <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                    <div className="h-3.5 bg-gray-200 rounded w-1/4" />
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HospitalsPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<Hospital[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = React.useRef<HTMLDivElement>(null);

    const fallbackImage = '/premium-hospital.png';

    const resolveSrc = (s?: string) => {
        if (!s) return fallbackImage;
        if (s.startsWith('/uploads/')) return `http://localhost:5000${s}`;
        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
        return fallbackImage;
    };

    const getImages = (h: Hospital): string[] => {
        if (h.images && h.images.length > 0) return h.images.map(resolveSrc);
        if (h.image) return [resolveSrc(h.image)];
        return [fallbackImage];
    };

    const getMapUrl = (h: Hospital) =>
        h.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.address}, ${h.city}`)}`;

    // Autocomplete
    useEffect(() => {
        const t = setTimeout(async () => {
            if (searchTerm.trim().length < 2) { setSuggestions([]); return; }
            try {
                const res = await api.get(`/hospitals/search?q=${searchTerm}`);
                setSuggestions(res.data);
            } catch { /* ignore */ }
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { fetchHospitals(); }, []);

    const fetchHospitals = async () => {
        try {
            const res = await api.get('/hospitals');
            if (res.data.length === 0) {
                await api.post('/hospitals/seed');
                const r2 = await api.get('/hospitals');
                setHospitals(r2.data);
            } else {
                setHospitals(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch hospitals', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const phoneList = (h: Hospital) => {
        const list = [];
        if (h.contactNumber) list.push(h.contactNumber);
        if (h.phoneNumbers && h.phoneNumbers.length > 0) {
            list.push(...h.phoneNumbers);
        }
        return Array.from(new Set(list)).filter(Boolean);
    };

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Hero Banner ── */}
            <div className="relative bg-slate-950 text-white border-b border-white/10 z-20">
                {/* Premium Grid & Glow Background (clamped to prevent page overflow, while allowing content dropdown to escape) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdHRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-[800px] h-[400px] bg-blue-600/15 rounded-full blur-[100px]" />
                    <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
                </div>
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 z-10">
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6 text-blue-200">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            <span>{hospitals.length > 0 ? `${hospitals.length} Premium Hospitals Listed` : 'Hospital Directory'}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                            Trusted Healthcare<br className="hidden sm:block" /> When You Need It Most
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-10 leading-relaxed">
                            Access emergency services, accepted government schemes, consultation costs, and more across all top-rated facilities.
                        </p>

                        {/* Search */}
                        <div className="relative max-w-lg mx-auto" ref={searchRef}>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3.5 sm:py-4 bg-white border border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 text-sm sm:text-base shadow-xl"
                                placeholder="Search by hospital name or city..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            {/* Suggestions dropdown */}
                            {showSuggestions && (suggestions.length > 0 || searchTerm.length >= 2) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60] py-2 text-left">
                                    {suggestions.length > 0 ? (
                                        <>
                                            <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">Top Matches</div>
                                            {suggestions.map(h => (
                                                <button key={h._id} onClick={() => { setSearchTerm(h.name); setShowSuggestions(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                                        <Image src={resolveSrc(h.images?.[0] ?? h.image)} alt={h.name} fill className="object-cover" unoptimized />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600">{h.name}</p>
                                                        <div className="flex items-center text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                                                            <MapPin className="w-2.5 h-2.5 mr-1" />{h.city}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] font-bold bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md shrink-0">
                                                        <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />{h.rating}
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="px-4 py-6 text-center text-gray-400">
                                            <p className="text-sm font-medium">No hospitals found matching &quot;{searchTerm}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">

                {/* Results count */}
                {!loading && (
                    <div className="flex items-center justify-between mb-5 sm:mb-8">
                        <p className="text-sm text-gray-500">
                            {searchTerm
                                ? <><span className="font-semibold text-gray-800">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''} for &quot;{searchTerm}&quot;</>
                                : <><span className="font-semibold text-gray-800">{filtered.length}</span> hospitals available</>
                            }
                        </p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-xs text-blue-600 hover:text-blue-800 font-medium underline-offset-2 hover:underline">
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-semibold text-gray-500">No hospitals found</p>
                        <p className="text-sm mt-1">Try a different search term.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {filtered.map((hospital, index) => {
                            const imgs = getImages(hospital);
                            const phones = phoneList(hospital);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    key={hospital._id}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col cursor-pointer group"
                                    onClick={() => router.push(`/hospitals/${hospital.slug}`)}
                                >
                                    {/* ── Image ── */}
                                    <div className="relative h-44 sm:h-48 w-full overflow-hidden flex-shrink-0 bg-gray-100">
                                        <ImageSlideshow images={imgs} alt={hospital.name} />
                                        {/* Rating */}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm z-10">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="font-bold text-gray-800 text-xs sm:text-sm">{hospital.rating}</span>
                                        </div>
                                        {/* Verified badge */}
                                        {hospital.is_verified && (
                                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                                <div className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" /> Verified
                                                </div>
                                                {hospital.isOpen24Hours && (
                                                    <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> 24/7
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {!hospital.is_verified && hospital.isOpen24Hours && (
                                            <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1 z-10">
                                                <Clock className="w-3 h-3" /> 24/7
                                            </div>
                                        )}

                                        {/* Management Badge */}
                                        <div className={`absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider z-10 backdrop-blur-md shadow-sm border ${
                                            hospital.management_type === 'SELF' 
                                                ? 'bg-emerald-50/90 text-emerald-700 border-emerald-200' 
                                                : 'bg-blue-50/90 text-blue-700 border-blue-200'
                                        }`}>
                                            {hospital.management_type === 'SELF' ? '🏥 Self Managed' : '⚙️ Managed'}
                                        </div>

                                        {/* Online pay badge */}
                                        <div className={`absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold z-10 ${hospital.isOnlinePaymentAvailable ? 'bg-white/90 text-gray-900' : 'bg-gray-700 text-gray-200'}`}>
                                            {hospital.isOnlinePaymentAvailable ? '💳 Online Pay' : 'Cash Only'}
                                        </div>
                                    </div>

                                    {/* ── Content ── */}
                                    <div className="p-4 sm:p-5 flex-1 flex flex-col bg-white">
                                        {/* Name */}
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                                            {hospital.name}
                                        </h3>

                                        {/* Clickable address */}
                                        <a
                                            href={getMapUrl(hospital)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-start gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 mb-4 transition-colors group/addr"
                                            title="Open in Google Maps"
                                        >
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                                            <span className="line-clamp-2 leading-snug">{hospital.address}, {hospital.city}</span>
                                            <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 opacity-0 group-hover/addr:opacity-100 transition-opacity" />
                                        </a>

                                        {/* Details */}
                                        <div className="mt-auto space-y-2 border-t pt-3">
                                            {/* Consultation fee */}
                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                <span className="text-gray-500 flex items-center gap-1">
                                                    <CreditCard className="w-3.5 h-3.5" /> Consultation
                                                </span>
                                                <span className="font-bold text-gray-900">₹{hospital.consultationFee} <span className="text-[10px] font-normal text-gray-400">/ Visit</span></span>
                                            </div>

                                            {/* Contact */}
                                            {phones.length > 0 && (
                                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5" /> Contact
                                                    </span>
                                                    <a
                                                        href={`tel:${phones[0]}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        {phones[0]}
                                                        {phones.length > 1 && (
                                                            <span className="ml-1 text-gray-400 font-normal">+{phones.length - 1}</span>
                                                        )}
                                                    </a>
                                                </div>
                                            )}

                                            {/* Doctors */}
                                            {hospital.doctors && hospital.doctors.length > 0 && (
                                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                                    <span className="text-gray-500 flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" /> Doctors
                                                    </span>
                                                    <span className="font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] sm:text-xs">
                                                        {hospital.doctors.length} Available
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-4 flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const url = `https://www.pillora.in/hospitals/${hospital.slug}`;
                                                    if (navigator.share) {
                                                        navigator.share({ title: hospital.name, url });
                                                    } else {
                                                        navigator.clipboard.writeText(url);
                                                        alert('Link copied to clipboard!');
                                                    }
                                                }}
                                                className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
                                                title="Share Hospital"
                                            >
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                            <div className="flex-1 text-center py-2 rounded-xl bg-blue-50 text-blue-700 text-xs sm:text-sm font-semibold group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                                                View Details →
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
