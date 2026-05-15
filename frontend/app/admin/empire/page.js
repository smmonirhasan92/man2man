'use client';

import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout'; // Check if this exists or just use a container
import AdminReferralEmpire from '@/components/admin/AdminReferralEmpire';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminEmpirePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#0A2540] text-white p-4 md:p-10">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => router.back()}
                            className="p-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase">Empire <span className="text-indigo-500">Master</span></h1>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Referral Rewards & Governance</p>
                        </div>
                    </div>
                </header>

                <main>
                    <AdminReferralEmpire />
                </main>
            </div>
        </div>
    );
}
