import { NextResponse } from 'next/server';

// Public routes — no token needed
const PUBLIC_PREFIXES = [
    '/login',
    '/register',
    '/maintenance',
    '/_next',
    '/static',
    '/uploads',
    '/favicon.ico',
    '/admin',   // Admin panel has its own role check
    '/api',
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Always allow public paths through
    const isPublic = PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) || pathname === '/';
    if (isPublic) return NextResponse.next();

    // 2. Check for token cookie
    const token = request.cookies.get('token')?.value;

    // 3. No token → go to login (simple, no ?from= param to avoid loops)
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

