'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'anon_user_id';

export function useAnalytics() {
    // Use lazy initialization to read from localStorage immediately on mount (client-side)
    const [anonId, setAnonId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;

        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    });

    useEffect(() => {
        // Ensure ID is set if it wasn't (e.g. during SSR hydration mismatch, though unlikely with the check above)
        if (!anonId && typeof window !== 'undefined') {
            let id = localStorage.getItem(STORAGE_KEY);
            if (!id) {
                id = crypto.randomUUID();
                localStorage.setItem(STORAGE_KEY, id);
            }
            setAnonId(id);
        }
    }, [anonId]);

    useEffect(() => {
        if (anonId) {
            // Track page view once ID is ready
            // We use a flag to prevent double tracking in React Strict Mode if needed, 
            // but for now let's just rely on the effect.
            trackEvent('page_view', { path: window.location.pathname });
        }
    }, [anonId]);

    const trackEvent = async (eventName: string, metadata: Record<string, any> = {}) => {
        if (!anonId) return;

        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    anon_user_id: anonId,
                    event_name: eventName,
                    metadata: {
                        ...metadata,
                        path: window.location.pathname,
                        device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                        browser: navigator.userAgent,
                    },
                }),
            });
        } catch (err) {
            console.warn('Analytics failed:', err);
        }
    };

    return { trackEvent, anonId };
}
