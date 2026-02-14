'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MemberPage() {
    const router = useRouter();
    useEffect(() => {
        // Redirect to profile or open member menu logic (if handled by page)
        // Since BottomNav handles "Member" as a menu toggle, this route might be fallback.
        // Let's make it a simple profile redirect or a hub.
        router.replace('/profile');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen text-slate-400">
            Redirecting...
        </div>
    );
}
