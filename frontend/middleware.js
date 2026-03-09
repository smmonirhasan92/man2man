import { NextResponse } from 'next/server';

// Routes that REQUIRE a login token
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/wallet',
    '/profile',
    '/tasks',
    '/task',
    '/agent',
    '/p2p',
    '/lottery',
    '/plans',
    '/referral',
    '/notifications',
    '/support',
];

// Routes that are always public (no token needed)
const PUBLIC_PREFIXES = [
    '/login',
    '/register',
    '/maintenance',
    '/_next',
    '/static',
    '/uploads',
    '/favicon.ico',
    '/admin',   // Admin has its own role check
];

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. Always allow public paths
    const isPublic = PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
    if (isPublic) return NextResponse.next();

    // 2. Check if the path is a protected route
    const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
    if (!isProtected) return NextResponse.next();

    // 3. Read token from cookies (set during login)
    const token = request.cookies.get('token')?.value;

    // 4. If no token → redirect to login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname); // Remember where they were going
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

