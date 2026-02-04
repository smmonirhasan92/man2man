'use client';
import TransactionApproval from '../../../components/TransactionApproval';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TransactionsPage() {
    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* PWA Header - Admin Edition */}
            <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -ml-20 -mb-20"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <Link href="/admin/dashboard" className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full backdrop-blur-sm border border-blue-500/30">
                            <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Requests</span>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-1">Transactions</h1>
                    <p className="text-slate-400 text-sm">Approve deposits & assign tasks</p>
                </div>
            </div>
            <TransactionApproval />
        </div>
    );
}
