'use client';

export default function AuthGuard({ children }) {
    // NUCLEAR BYPASS: NO CHECKS, NO LOADING, JUST RENDER
    return <>{children}</>;
}
