'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Use replace instead of push to avoid history stack issues
        router.replace('/admin/dashboard');
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p>Loading Admin Panel...</p>
        </div>
    );
}
