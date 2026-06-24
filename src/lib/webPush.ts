import api from './api';

const DEFAULT_VAPID_PUBLIC_KEY = 'BCv55S8xcKsRoymSqo1cbzeyT0ihiBciRJIpYAEgzK-cafPNfKpgjOkv3SeaFwAQPuFw13jiHf7nP4Gt2ukaw2g';
const ENV_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PUBLIC_KEY = (!ENV_VAPID_KEY || ENV_VAPID_KEY === 'undefined' || ENV_VAPID_KEY === 'null')
    ? DEFAULT_VAPID_PUBLIC_KEY
    : ENV_VAPID_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Checks compatibility, registers the service worker, requests notification permission,
 * retrieves/creates the PushSubscription, and registers it with the backend API.
 */
export async function initWebPush(hospitalId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // 1. Check browser compatibility for Service Worker and PushManager
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Service Worker or PushManager is not supported in this browser.');
    }

    // 2. Register Service Worker sw.js
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[WebPush] Service Worker registered scope:', registration.scope);

    // Ensure the service worker is active and ready
    await navigator.serviceWorker.ready;
    console.log('[WebPush] Service Worker is active and ready.');

    // 3. Request user notification permissions securely
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error(`Notification permission denied: ${permission}`);
    }

    // 4. Retrieve PushSubscription object using the public VAPID key
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        console.log('[WebPush] No subscription found, creating new subscription...');
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
    }

    console.log('[WebPush] Subscription acquired:', subscription);

    // 5. Send that JSON subscription payload along with the logged-in Hospital's ID to backend
    const response = await api.post('/notifications/subscribe', {
        subscription,
        hospitalId
    });

    if (response.data && response.data.success) {
        console.log('[WebPush] Subscription saved successfully on backend.');
    } else {
        throw new Error(response.data?.message || 'Backend registration rejected.');
    }
}

