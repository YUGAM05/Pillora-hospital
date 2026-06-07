"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    MapPin, Phone, Clock, CreditCard, Ambulance, ShieldCheck,
    Star, ChevronLeft, ChevronRight, User, CheckCircle, XCircle,
    Building, ArrowLeft, ExternalLink, Share2
} from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import BookingModal from '@/components/BookingModal';

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
}

// ─── Slideshow ─────────────────────────────────────────────────────────────────
function ImageSlideshow({ images, alt }: { images: string[]; alt: string }) {
    const [idx, setIdx] = useState(0);
    const fallback = '/premium-hospital.png';

    const resolveSrc = (s?: string) => {
        if (!s) return fallback;
        if (s.startsWith('/uploads/')) return `http://localhost:5000${s}`;
        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
        return fallback;
    };

    const prev = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }, [images.length]);
    const next = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }, [images.length]);

    useEffect(() => {
        if (images.length <= 1) return;
        const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
        return () => clearInterval(t);
    }, [images.length]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-100">
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
                        src={resolveSrc(images[idx])}
                        alt={`${alt} – image ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
                    />
                </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-sm transition-colors z-10">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-sm transition-colors z-10">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, i) => (
                            <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                                className={`h-2 rounded-full transition-all ${i === idx ? 'bg-white w-5' : 'bg-white/50 w-2'}`} />
                        ))}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full z-10 shadow-sm font-medium">
                        {idx + 1}/{images.length}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, valueClass = 'font-semibold text-gray-900 text-base' }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    valueClass?: string;
}) {
    return (
        <div className="flex items-start gap-3 p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <div className={`mt-1 ${valueClass}`}>{value}</div>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function HospitalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

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

    const phoneList = (h: Hospital) => {
        const list = [];
        if (h.contactNumber) list.push(h.contactNumber);
        if (h.phoneNumbers && h.phoneNumbers.length > 0) {
            list.push(...h.phoneNumbers);
        }
        return Array.from(new Set(list)).filter(Boolean);
    };

    const getMapUrl = (h: Hospital) =>
        h.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.address}, ${h.city}`)}`;

    useEffect(() => {
        const fetchHospital = async () => {
            try {
                const res = await api.get(`/hospitals/${params.slug}`);
                setHospital(res.data);
            } catch (err) {
                console.error('Failed to fetch hospital', err);
            } finally {
                setLoading(false);
            }
        };
        if (params.slug) fetchHospital();
    }, [params.slug]);

    // Loading skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 animate-pulse">
                <div className="h-64 sm:h-80 bg-gray-200" />
                <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <Building className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Hospital not found</h2>
                <p className="text-gray-500 mb-6 text-sm">This hospital may have been removed or doesn&apos;t exist.</p>
                <button onClick={() => router.push('/hospitals')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
                    Back to Hospitals
                </button>
            </div>
        );
    }

    const imgs = getImages(hospital);
    const phones = phoneList(hospital);

    const processedDesc = hospital.description
        ? hospital.description
            // Normalise tags
            .replace(/<strong>/gi, '<b>').replace(/<\/strong>/gi, '</b>')
            .replace(/<em>/gi, '<i>').replace(/<\/em>/gi, '</i>')
            // Strip inline styles so our CSS controls appearance
            .replace(/ style="[^"]*"/gi, '')
            .replace(/ style='[^']*'/gi, '')
            // Ensure proper spacing between bold segments
            .replace(/<\/b>(\s*:)/gi, '</b>$1<br/>')
            .replace(/([^>])\s*<b>/gi, '$1<br/><b>')
            // Remove consecutive empty <br> spam
            .replace(/(<br\s*\/?>(\s*)){3,}/gi, '<br/><br/>')
        : '';

    return (
        <div className="min-h-screen bg-gray-50 pb-16">

            {/* ── Hero Image — fixed height, no text overlay ── */}
            <div className="relative w-full h-56 sm:h-72 md:h-80 lg:h-96 bg-gray-200 overflow-hidden">
                <ImageSlideshow images={imgs} alt={hospital.name} />

                {/* Back button */}
                <button
                    onClick={() => router.push('/hospitals')}
                    className="absolute top-4 left-4 z-20 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                </button>

                {/* Rating + 24/7 badges */}
                <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                    <span className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-xl text-sm font-bold shadow flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {hospital.rating}
                    </span>
                    {hospital.isOpen24Hours && (
                        <span className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow">
                            <Clock className="w-3.5 h-3.5" /> Open 24/7
                        </span>
                    )}
                </div>
            </div>

            {/* ── Hospital Name + Address — clearly below image, white background ── */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                            {hospital.name}
                        </h1>
                        <button
                            onClick={() => {
                                const url = `https://www.pillora.in/hospitals/${hospital.slug}`;
                                if (navigator.share) {
                                    navigator.share({ title: hospital.name, url });
                                } else {
                                    navigator.clipboard.writeText(url);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shrink-0 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs sm:text-sm"
                        >
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    </div>
                    <a
                        href={getMapUrl(hospital)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors group"
                        title="Open in Google Maps"
                    >
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                        <span>{hospital.address}, {hospital.city}</span>
                        <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* ──── Left: Main Info ──── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <StatCard
                                icon={<CreditCard className="w-5 h-5" />}
                                label="Consultation Fee"
                                value={`₹${hospital.consultationFee}`}
                                valueClass="font-bold text-gray-900 text-lg"
                            />
                            <StatCard
                                icon={<Ambulance className="w-5 h-5" />}
                                label="Ambulance"
                                value={hospital.ambulanceContact || '—'}
                                valueClass="font-semibold text-red-600 text-base"
                            />
                            <StatCard
                                icon={<Clock className="w-5 h-5" />}
                                label="Open 24/7"
                                value={
                                    hospital.isOpen24Hours
                                        ? <span className="flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle className="w-4 h-4" /> Yes</span>
                                        : <span className="flex items-center gap-1.5 text-red-500 font-semibold"><XCircle className="w-4 h-4" /> No</span>
                                }
                            />
                            <StatCard
                                icon={<CreditCard className="w-5 h-5" />}
                                label="Online Payment"
                                value={
                                    hospital.isOnlinePaymentAvailable
                                        ? <span className="flex items-center gap-1.5 text-green-600 font-semibold"><CheckCircle className="w-4 h-4" /> Available</span>
                                        : <span className="flex items-center gap-1.5 text-red-500 font-semibold"><XCircle className="w-4 h-4" /> Not Available</span>
                                }
                            />
                        </div>

                        {/* Contact Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Phone className="w-4 h-4" /></span>
                                Contact Details
                            </h3>
                            {phones.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {phones.map((ph, i) => (
                                        <a href={`tel:${ph}`} key={i}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                                                    <Phone className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
                                                </div>
                                                <span className="font-semibold text-gray-800 group-hover:text-blue-700 text-sm">{ph}</span>
                                            </div>
                                            {i === 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Primary</span>}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No contact numbers listed.</p>
                            )}
                        </div>

                        {/* Doctors */}
                        {hospital.doctors && hospital.doctors.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User className="w-4 h-4 sm:w-5 sm:h-5" /></span>
                                        Available Doctors
                                    </h3>
                                    <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold">
                                        {hospital.doctors.length} Doctor{hospital.doctors.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {hospital.doctors.map((doc, i) => (
                                        <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 sm:p-5">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900 text-sm sm:text-base">{doc.name}</p>
                                                    {doc.specialization && (
                                                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                                            {doc.specialization}
                                                        </span>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedDoctor(doc)}
                                                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                                {doc.timing && (
                                                    <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                                                        <Clock className="w-3.5 h-3.5 text-blue-500" /> {doc.timing}
                                                    </span>
                                                )}
                                                {doc.daysAvailable && doc.daysAvailable.length > 0 && doc.daysAvailable.map(d => (
                                                    <span key={d} className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-md font-medium">
                                                        {d.slice(0, 3)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {processedDesc && (
                            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                                {/* Section header */}
                                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                                    <div className="p-2.5 bg-blue-50 rounded-xl shrink-0">
                                        <Building className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">About the Hospital</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">Details provided by the hospital</p>
                                    </div>
                                </div>

                                {/* Description body */}
                                <style>{`
                                    .hosp-desc { font-size: 14px; line-height: 1.8; color: #374151; }
                                    @media (min-width: 640px) { .hosp-desc { font-size: 15px; } }
                                    .hosp-desc b, .hosp-desc strong {
                                        font-weight: 700;
                                        color: #1d4ed8;
                                        display: block;
                                        margin-top: 12px;
                                        margin-bottom: 2px;
                                        font-size: 13px;
                                        text-transform: uppercase;
                                        letter-spacing: 0.04em;
                                    }
                                    .hosp-desc b:first-child, .hosp-desc strong:first-child { margin-top: 0; }
                                    .hosp-desc i, .hosp-desc em { font-style: italic; color: #6b7280; }
                                    .hosp-desc u { text-decoration: underline; text-underline-offset: 3px; }
                                    .hosp-desc p { margin-bottom: 10px; }
                                    .hosp-desc p:last-child { margin-bottom: 0; }
                                    .hosp-desc br { display: block; margin-bottom: 4px; content: ''; }
                                    .hosp-desc ul { list-style: disc; padding-left: 20px; margin-bottom: 12px; }
                                    .hosp-desc ol { list-style: decimal; padding-left: 20px; margin-bottom: 12px; }
                                    .hosp-desc li { margin-bottom: 4px; color: #4b5563; }
                                    .hosp-desc h1, .hosp-desc h2 { font-weight: 700; color: #111827; margin: 12px 0 6px; }
                                    .hosp-desc h1 { font-size: 16px; } 
                                    .hosp-desc h2 { font-size: 14px; }
                                `}</style>
                                <div
                                    className="hosp-desc"
                                    dangerouslySetInnerHTML={{ __html: processedDesc }}
                                />
                            </div>
                        )}
                    </div>

                    {/* ──── Right: Sidebar ──── */}
                    <div className="space-y-4 lg:sticky lg:top-24 self-start">

                        {/* Clickable Map Link */}
                        <a
                            href={getMapUrl(hospital)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors shadow group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm">View on Maps</p>
                                <p className="text-blue-100 text-xs truncate">{hospital.address}, {hospital.city}</p>
                            </div>
                            <ExternalLink className="w-4 h-4 opacity-70 shrink-0" />
                        </a>

                        {/* Government Schemes */}
                        {hospital.governmentSchemes?.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4" /> Accepted Schemes
                                </p>
                                <div className="flex flex-col gap-2">
                                    {hospital.governmentSchemes.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2.5 p-2.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                                            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="text-xs sm:text-sm font-semibold leading-snug">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedDoctor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
                            <BookingModal doctor={selectedDoctor} hospital={hospital} onClose={() => setSelectedDoctor(null)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
