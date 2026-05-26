"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Download, Home, ArrowRight } from 'lucide-react';
import Image from 'next/image';

// Removed top-level imports that break SSR

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params?.id;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const handleDownloadPDF = async () => {
        const element = document.getElementById('printable-area');
        if (!element) return;

        setDownloading(true);
        try {
            // Dynamically import libraries to avoid SSR errors
            const html2canvas = (await import('html2canvas')).default;
            const jspdfModule = await import('jspdf');
            const jsPDF = jspdfModule.jsPDF || jspdfModule.default;

            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Pillora-Order-${order._id.slice(-8).toUpperCase()}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to download bill. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        if (!orderId) return;

        api.get(`/orders/${orderId}`)
            .then(res => {
                setOrder(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching order:', err);
                setLoading(false);
            });
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-xl text-gray-600 mb-4">Order not found</p>
                <Link href="/" className="text-blue-600 hover:underline">Go to Home</Link>
            </div>
        );
    }

    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {/* Success Icon */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
                    <p className="text-gray-600">Thank you for your order</p>
                </div>

                {/* Order Details Card (Invoice Design) */}
                <div id="printable-area" className="bg-white rounded-2xl border border-gray-200 p-8 mb-6 shadow-sm">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Image src="/logo.png" alt="Pillora" width={48} height={48} className="object-contain" unoptimized />
                                <Image src="/pillora-text.png" alt="Pillora" width={100} height={40} className="object-contain" unoptimized />
                            </div>
                            <p className="text-gray-500 text-sm">Shri Mahavir Jain Vidhvalay, Paldi Cross Road</p>
                            <p className="text-gray-500 text-sm">Paldi, Ahmedabad, Gujarat, India</p>
                            <p className="text-gray-500 text-sm">GSTIN: 27AABCU9603R1ZN</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-4xl font-extrabold text-blue-600/10 mb-2">INVOICE</h2>
                            <p className="text-sm font-bold text-gray-900">Invoice #: {order._id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="text-sm text-gray-500">Status: {
                                order.paymentMethod === 'cod'
                                    ? <span className="text-yellow-600 font-medium">Pending (Unpaid)</span>
                                    : <span className="text-green-600 font-medium">Paid</span>
                            }</p>
                        </div>
                    </div>

                    {/* Bill To & Ship To */}
                    <div className="grid grid-cols-2 gap-12 mb-8">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
                            <div className="text-sm text-gray-900 font-medium">{order.shippingAddress.fullName}</div>
                            <div className="text-sm text-gray-500 mt-1">{order.shippingAddress.email}</div>
                            <div className="text-sm text-gray-500">{order.shippingAddress.phone}</div>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ship To</h3>
                            <div className="text-sm text-gray-600">
                                {order.shippingAddress.addressLine1}
                                {order.shippingAddress.addressLine2 && <span className="block">{order.shippingAddress.addressLine2}</span>}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">Item Description</th>
                                    <th className="py-3 px-4 font-semibold text-center">Qty</th>
                                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item: any, index: number) => (
                                    <tr key={index}>
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-400">ID: {item.productId?.slice(-6) || 'N/A'}</div>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-3 px-4 text-right text-gray-600">₹{item.price.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex justify-end mb-8">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{(order.totalAmount * 0.95).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax (5%)</span>
                                <span>₹{(order.totalAmount * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Shipping</span>
                                <span className="text-green-600">Free</span>
                            </div>
                            <div className="border-t border-gray-100 pt-2 flex justify-between text-base font-bold text-gray-900 mt-2">
                                <span>Grand Total</span>
                                <span className="text-blue-600">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Signatory & Footer */}
                    <div className="flex justify-end mb-8">
                        <div className="text-right">
                            <div className="h-16 w-32 border-b border-gray-300 mb-2"></div>
                            <p className="text-sm font-semibold text-gray-700">Authorized Signatory</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 pt-6 text-center">
                        <p className="text-sm text-gray-600 mb-1">Thank you for your business!</p>
                        <p className="text-xs text-gray-400">If you have any questions, please contact support at support@pillora.in</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                        className="w-full py-4 bg-white border-2 border-green-600 text-green-700 rounded-xl font-bold hover:bg-green-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Download Bill
                    </button>

                    <Link href={`/my-orders/track/${order._id}`} className="block">
                        <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                            <Truck className="w-5 h-5" />
                            Track Your Order
                        </button>
                    </Link>

                    <Link href="/" className="block">
                        <button className="w-full py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                            <Home className="w-5 h-5" />
                            Back to Home
                        </button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
