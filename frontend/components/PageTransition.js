'use client';

// Removed framer-motion completely to fix the white screen bug on mobile browsers
// Native mobile Safari/Chrome can occasionally lock `opacity: 0` during client-side navigation.

export default function PageTransition({ children }) {
    return (
        <div className="h-full w-full animate-in fade-in duration-300">
            {children}
        </div>
    );
}
