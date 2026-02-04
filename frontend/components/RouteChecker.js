'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteChecker() {
    const pathname = usePathname();

    useEffect(() => {
        // [ROUTE_CHECKER] Logic
        // We can't easily detect 404s from here unless we are on the 404 page itself.
        // But we can log every successful navigation.
        console.log(`[ROUTE_CHECKER] Navigated to: ${pathname}`);
        return () => {
            // cleanup
        };
    }, [pathname]);

    return null;
}
