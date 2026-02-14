'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ReferralDashboard from '../../components/referral/ReferralDashboard';

export default function ReferralPage() {
    return (
        <div className="min-h-screen bg-[#111827] text-white font-sans pb-20">
            {/* Header */}
            <div className="p-5 flex items-center gap-3 bg-[#1f2937]/50 sticky top-0 z-10 backdrop-blur-md">
                <Link href="/dashboard" className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-bold">Referral Program</h1>
            </div>

            <div className="p-5 max-w-md mx-auto">
                <ReferralDashboard />
            </div>
        </div>
    );
}
