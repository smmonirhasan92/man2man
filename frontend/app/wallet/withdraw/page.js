'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useWalletActions } from '../../../hooks/useWalletActions';
import WithdrawForm from '../../../components/wallet/WithdrawForm';
import api from '../../../services/api';

export default function WithdrawalPage() {
    const router = useRouter();
    const { loading, error, success, submitWithdrawal } = useWalletActions();
    const [balance, setBalance] = useState({ main: 0, income: 0 });

    // We pass the form state to the child component manually or move state up if needed.
    // However, WithdrawForm handles its own state in the previous implementation. 
    // To minimize refactoring, we'll let WithdrawForm handle everything. 
    // The state 'form' here seems unused in current WithdrawForm usage (it passes onSubmit).
    // Let's stick to the pattern.

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const res = await api.get('/wallet/balance');
                setBalance({
                    main: res.data.wallet_balance || 0,
                    income: res.data.income_balance || 0
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchBalance();
    }, []);

    return (
        <div className="h-[100dvh] w-full flex flex-col font-sans overflow-hidden text-white">

            {/* Header (Minimal) */}
            <div className="flex-none pt-8 pb-4 flex flex-col items-center z-20 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-6 opacity-50 hover:opacity-100 transition-opacity absolute left-6 top-8">
                    <Link href="/dashboard">
                        <ArrowLeft className="w-5 h-5 text-zinc-400" />
                    </Link>
                </div>

                <h1 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Main Balance (Available)</h1>

                {/* Slim Elegant Typography for Balance */}
                <div className="flex items-start justify-center gap-1 mt-2">
                    <span className="text-2xl font-thin text-zinc-500 mt-1">৳</span>
                    <span className="text-6xl font-thin text-white tracking-tighter">
                        {balance.main ? balance.main.toLocaleString() : '0'}
                    </span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 w-full max-w-md mx-auto px-6 overflow-y-auto no-scrollbar z-10 pb-6">

                {success ? (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                            <span className="text-3xl text-black">✓</span>
                        </div>
                        <h2 className="text-xl font-light text-white mb-2 tracking-wide">Request Sent</h2>
                        <p className="text-zinc-500 text-xs tracking-wider uppercase">Funds are on the way</p>
                    </div>
                ) : (
                    <>
                        {error && <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-xs text-red-400 font-medium text-center mb-4">{error}</div>}
                        <WithdrawForm
                            balance={balance}
                            onSubmit={submitWithdrawal}
                            loading={loading}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
