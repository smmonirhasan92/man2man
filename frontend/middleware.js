import { NextResponse } from 'next/server';

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Define Public/Admin paths that bypass maintenance
    const isExcluded =
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/admin') || // Admins can login
        pathname === '/maintenance' ||
        pathname === '/favicon.ico';

    if (isExcluded) return NextResponse.next();

    // 2. Fetch Maintenance Status
    try {
        // Build API URL. Middleware runs on Edge, so localhost might be tricky if not defined.
        // Assuming NEXT_PUBLIC_API_URL is set in environment. 
        // Fallback to Production API if not set
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://man2man-api.onrender.com';

        // Timeout to prevent blocking
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

        const res = await fetch(`${apiUrl}/api/admin/settings/public`, {
            signal: controller.signal,
            next: { revalidate: 60 } // Cache for 60s to reduce load
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            // Structure: { maintenance: { isActive: true, message: "..." } }
            // or if we returned flattened: { maintenance: boolean } - check adminController

            // Controller returns: { maintenance: { isActive: boolean, ... } } directly as the value of the key 'maintenance'
            // Wait, adminController.getPublicSettings returns { maintenance: ...value }.
            // Value is what was stored. If value is { isActive: true }, then data.maintenance.isActive.

            const maintenance = data.maintenance;
            const isActive = maintenance?.isActive === true || maintenance === true; // Handle object or bool

            if (isActive) {
                return NextResponse.rewrite(new URL('/maintenance', request.url));
            }
        }
    } catch (err) {
        // If API fails, default to allowing access (Fail Open) to avoid locking out accidentally
        console.error("Middleware Maintenance Check Failed:", err);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
