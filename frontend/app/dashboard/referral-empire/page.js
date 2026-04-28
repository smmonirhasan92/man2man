'use client';
import ReferralDashboard from '../../../components/referral/ReferralDashboard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReferralEmpirePage() {
    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-50">
                <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 uppercase">
                    Referral Empire
                </h1>
            </div>

            <div className="max-w-md mx-auto p-4 pb-32">
                <ReferralDashboard />
            </div>
        </div>
    );
}
