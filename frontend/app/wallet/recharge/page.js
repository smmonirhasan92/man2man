'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RechargeRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/p2p');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-400 text-xs font-mono">REDIRECTING TO P2P FINANCE...</p>
            </div>
        </div>
    );
}
