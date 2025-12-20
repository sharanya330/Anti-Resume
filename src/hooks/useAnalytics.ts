'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'anon_user_id';

export function useAnalytics() {
    const [anonId, setAnonId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize anonymous ID
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(STORAGE_KEY, id);
        }
        setAnonId(id);
    }, []);

    useEffect(() => {
        if (anonId) {
            // Track page view once ID is ready
            trackEvent('page_view', { path: window.location.pathname });
        }
    }, [anonId]);

    const trackEvent = async (eventName: string, metadata: Record<string, any> = {}) => {
        if (!anonId) return; // Wait for ID to be initialized

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
            // Fail silently - analytics should not break the app
            console.warn('Analytics failed:', err);
        }
    };

    return { trackEvent, anonId };
}
