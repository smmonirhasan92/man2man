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

    // 2. Removed Maintenance Fetch because Edge middleware hitting the backend on EVERY asset causes DDOS and triggers rate-limiting.
    // Maintenance mode should be handled via static rewrite or Client-side context if needed for MVP.
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
