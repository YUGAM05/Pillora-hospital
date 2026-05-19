'use client';

import React, { useState, useRef } from 'react';
import api from '@/lib/api';
import {
    Upload, FileText, CheckCircle2, XCircle, Loader2,
    Info, ArrowRight, Clock, ShieldCheck, Bell
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function UploadPrescriptionPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [rxId, setRxId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
            setUploaded(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            setFile(droppedFile);
            setPreview(URL.createObjectURL(droppedFile));
            setError(null);
            setUploaded(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('prescription', file);

        try {
            const response = await api.post('/prescriptions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setRxId(response.data.rx_id || '');
            setUploaded(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload prescription. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setUploaded(false);
        setRxId('');
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Upload Prescription</h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Upload your doctor&apos;s prescription. Our pharmacist will review it and contact you directly once verified.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                    {uploaded ? (
                        /* ── SUCCESS STATE ── */
                        <div className="text-center space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <ShieldCheck className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">
                                    Prescription Submitted Successfully!
                                </h2>
                                {rxId && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Reference ID</span>
                                        <span className="font-mono font-black text-blue-700 text-lg">{rxId}</span>
                                    </div>
                                )}
                                <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                                    Your prescription has been received and is now in our review queue.
                                </p>
                            </div>

                            {/* Info Steps */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-left space-y-4 border border-blue-100">
                                <h3 className="font-black text-gray-800 text-sm uppercase tracking-wider">What happens next?</h3>
                                <div className="space-y-3">
                                    {[
                                        { icon: <ShieldCheck className="w-4 h-4 text-blue-600" />, text: 'Our AI system has already extracted text from your prescription for the pharmacist to review.' },
                                        { icon: <Clock className="w-4 h-4 text-amber-500" />, text: 'A qualified pharmacist will manually review and verify your prescription.' },
                                        { icon: <Bell className="w-4 h-4 text-green-600" />, text: 'Once approved, our team will contact you directly to arrange your medicines.' },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                                {step.icon}
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Upload Another
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── UPLOAD FORM ── */
                        <div className="space-y-6">
                            {/* Drop Zone */}
                            <div
                                className="border-2 border-dashed border-blue-200 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                {preview ? (
                                    <div className="text-center space-y-3">
                                        <div className="relative max-w-full overflow-hidden rounded-xl shadow-md mx-auto h-52 w-fit">
                                            <Image src={preview} alt="Preview" width={400} height={400} className="max-h-52 object-contain" unoptimized />
                                        </div>
                                        <p className="text-sm font-semibold text-blue-600">{file?.name}</p>
                                        <p className="text-xs text-gray-400">Click to change file</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                            <Upload className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-700 mb-1">Drop your prescription here</p>
                                        <p className="text-sm text-gray-400">or click to browse files</p>
                                        <p className="text-xs text-gray-400 mt-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                                            Accepts JPG, PNG, PDF
                                        </p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Info notice */}
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700">
                                    <strong>Thank you!</strong> Our qualified pharmacist will review your prescription and reach out to you shortly.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg shadow-blue-200"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading & Extracting Text...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        Submit Prescription
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
