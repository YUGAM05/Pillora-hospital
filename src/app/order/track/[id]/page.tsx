'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import {
    CheckCircle2,
    Circle,
    Clock,
    Truck,
    Package,
    MapPin,
    Phone,
    RefreshCcw,
    User,
    Store,
    Loader2
} from 'lucide-react';

export default function TrackOrderPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = useCallback(async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOrder();

        socket.connect();
        socket.emit('join_order', id);

        const handleStatusUpdate = (updatedOrder: any) => {
            if (updatedOrder._id === id) {
                setOrder(updatedOrder);
                // Also optionally refresh from API to get populates
                fetchOrder();
            }
        };

        socket.on('order_status_updated', handleStatusUpdate);

        return () => {
            socket.off('order_status_updated', handleStatusUpdate);
            socket.disconnect();
        };
    }, [id, fetchOrder]);

    const statuses = [
        { key: 'prescription_verified', label: 'Prescription Verified', icon: <CheckCircle2 className="w-6 h-6" /> },
        { key: 'order_placed', label: 'Order Placed', icon: <Package className="w-6 h-6" /> },
        { key: 'confirmed_by_seller', label: 'Confirmed by Pharmacy', icon: <Store className="w-6 h-6" /> },
        { key: 'out_for_pickup', label: 'Out for Pickup', icon: <Clock className="w-6 h-6" /> },
        { key: 'in_transit', label: 'In Transit', icon: <Truck className="w-6 h-6" /> },
        { key: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-6 h-6" /> },
    ];

    const getCurrentStatusIndex = () => {
        if (!order) return -1;
        return statuses.findIndex(s => s.key === order.status);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    );

    if (!order) return <div className="text-center py-20 font-bold text-xl">Order not found</div>;

    const currentIdx = getCurrentStatusIndex();

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Track Order</h1>
                    <p className="text-muted-foreground font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                </div>
                <button
                    onClick={fetchOrder}
                    className="p-3 bg-secondary rounded-full hover:bg-secondary/80 transition-all text-primary"
                >
                    <RefreshCcw className="w-6 h-6" />
                </button>
            </div>

            {/* Timeline UI */}
            <div className="bg-card shadow-xl rounded-2xl p-8 border border-border mb-10">
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-0">
                    {statuses.map((status, index) => {
                        const isCompleted = index <= currentIdx;
                        const isCurrent = index === currentIdx;

                        return (
                            <React.Fragment key={status.key}>
                                <div className="flex flex-row md:flex-col items-center gap-4 md:gap-3 flex-1 z-10">
                                    <div className={`p-3 rounded-full transition-all duration-500 ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                                        } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                                        {status.icon}
                                    </div>
                                    <span className={`text-sm font-bold text-center ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {status.label}
                                    </span>
                                </div>
                                {index < statuses.length - 1 && (
                                    <div className="hidden md:block absolute h-0.5 bg-secondary top-6 left-0 right-0 -z-0"
                                        style={{
                                            left: `${(index * 100 / (statuses.length - 1)) + 5}%`,
                                            width: `${100 / (statuses.length - 1) - 10}%`
                                        }}>
                                        <div className={`h-full bg-primary transition-all duration-1000`}
                                            style={{ width: isCompleted ? '100%' : '0%' }}></div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Details */}
                <div className="bg-card shadow-lg rounded-2xl p-6 border border-border">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary" /> Order Details
                    </h3>
                    <div className="space-y-4 mb-8">
                        {order.medicines.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-bold">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Platform Fee</span>
                            <span>₹{order.platform_fee}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold">
                            <span>Total</span>
                            <span className="text-primary">₹{order.total_amount}</span>
                        </div>
                    </div>
                </div>

                {/* Seller & Delivery Agent */}
                <div className="space-y-6">
                    <div className="bg-card shadow-lg rounded-2xl p-6 border border-border">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Store className="w-6 h-6 text-primary" /> Pharmacy
                        </h3>
                        <div className="space-y-2">
                            <p className="font-bold text-lg">{order.seller_id?.pharmacy_name || order.seller_id?.name}</p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4" /> {order.seller_id?.address?.street}, {order.seller_id?.address?.city}
                            </p>
                            <p className="flex items-center gap-2 text-primary font-medium">
                                <Phone className="w-4 h-4" /> {order.seller_id?.phone}
                            </p>
                        </div>
                    </div>

                    {order.delivery_agent_id && (
                        <div className="bg-primary/5 shadow-lg rounded-2xl p-6 border border-primary/20 animate-in fade-in duration-500">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Truck className="w-6 h-6 text-primary" /> Delivery Partner
                            </h3>
                            <div className="flex items-start gap-4">
                                <div className="bg-primary text-primary-foreground p-3 rounded-xl">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{order.delivery_agent_id?.name}</p>
                                    <p className="flex items-center gap-2 text-primary font-medium mb-2">
                                        <Phone className="w-4 h-4" /> {order.delivery_agent_id?.phone}
                                    </p>
                                    <div className="bg-white/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
                                        {order.status.replace(/_/g, ' ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-secondary/20 p-6 rounded-2xl border border-border">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" /> Delivery Address
                </h3>
                <p className="text-muted-foreground">{order.delivery_address}</p>
            </div>
        </div>
    );
}
