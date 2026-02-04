import React, { useState } from 'react';
import { ArrowRightLeft, Loader2, Gamepad2, Wallet, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import TransactionReceiptModal from './TransactionReceiptModal';
import toast from 'react-hot-toast';

export default function WalletSwap({ user, onSuccess }) {
    const { formatMoney } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [direction, setDirection] = useState('main_to_game'); // 'main_to_game' | 'game_to_main' | 'income_to_main'
    const [receipt, setReceipt] = useState(null); // Receipt Data

    const handleSwap = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            // [MODIFIED] Route Selection based on updated direction logic
            let endpoint = '/wallet/swap';

            if (direction === 'income_to_main') {
                endpoint = '/wallet/transfer/main'; // Income to Main
            }

            let response;
            if (direction === 'income_to_main') {
                response = await api.post('/wallet/transfer/main', { amount });
            } else {
                response = await api.post('/wallet/swap', { direction, amount });
            }

            onSuccess(); // Refresh user data
            setAmount('');

            // If Income -> Main, show Detailed Receipt
            if (direction === 'income_to_main' && response.data.receipt) {
                setReceipt(response.data.receipt);
            } else {
                toast.success('Transfer Successful');
            }

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Transfer Failed');
        } finally {
            setLoading(false);
        }
    };

    const isMainToGame = direction === 'main_to_game';
    const isIncomeToMain = direction === 'income_to_main';

    const getSourceWallet = () => {
        if (isIncomeToMain) return 'Income Wallet';
        return isMainToGame ? 'Main Wallet' : 'Game Wallet';
    };

    const getDestWallet = () => {
        if (isIncomeToMain) return 'Main Wallet';
        return isMainToGame ? 'Game Wallet' : 'Main Wallet';
    };

    const getSourceBalance = () => {
        // [FIX] Prioritize 'user.wallet.income' because Header Display uses it and it works.
        // Fallback to normalized prop if needed. Use || to skip 0 values if alternative exists.
        if (isIncomeToMain) return user?.wallet?.income || user?.income_balance || 0;
        return isMainToGame ? (user?.wallet_balance ?? user?.w_dat?.m_v ?? 0) : (user?.game_balance ?? user?.w_dat?.g_v ?? 0);
    };

    const cycleDirection = () => {
        if (direction === 'main_to_game') setDirection('game_to_main');
        else if (direction === 'game_to_main') setDirection('income_to_main');
        else setDirection('main_to_game');
    };

    return (
        <div className="w-full px-6 mb-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 border border-white/10 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-cyan-400" /> Wallet Bridge
                    </h3>
                    <button
                        onClick={cycleDirection}
                        className="text-[10px] font-bold text-cyan-400 uppercase bg-cyan-900/30 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors"
                    >
                        Switch: {isIncomeToMain ? 'Income → Main' : (isMainToGame ? 'Main → Game' : 'Game → Main')}
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-4 relative">
                    {/* From */}
                    <div className={`flex-1 p-2 rounded-xl border ${isIncomeToMain ? 'border-green-500/30 bg-green-500/5' : (isMainToGame ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-cyan-500/30 bg-cyan-500/5')} transition-all`}>
                        <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center gap-1">
                            {isIncomeToMain ? <DollarSign className="w-3 h-3" /> : (isMainToGame ? <Wallet className="w-3 h-3" /> : <Gamepad2 className="w-3 h-3" />)} From
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                            {getSourceWallet()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                            {/* [FIX] Strict Dollar Formatting for Income Wallet to match Header */}
                            {isIncomeToMain
                                ? `$${Number(getSourceBalance()).toFixed(2)}`
                                : `৳${Number(getSourceBalance()).toFixed(2)}`
                            }
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 bg-slate-700 rounded-full p-1 border border-slate-600 z-10 transition-transform duration-300 hover:rotate-180 cursor-pointer" onClick={cycleDirection}>
                        <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                    </div>

                    {/* To */}
                    <div className={`flex-1 p-2 rounded-xl border ${isIncomeToMain ? 'border-yellow-500/30 bg-yellow-500/5' : (!isMainToGame ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-cyan-500/30 bg-cyan-500/5')} transition-all text-right`}>
                        <div className="text-[9px] text-slate-400 uppercase font-bold flex items-center justify-end gap-1">
                            To {isIncomeToMain ? <Wallet className="w-3 h-3" /> : (isMainToGame ? <Gamepad2 className="w-3 h-3" /> : <Wallet className="w-3 h-3" />)}
                        </div>
                        <div className="text-xs font-bold text-white mt-1">
                            {getDestWallet()}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">
                        {isIncomeToMain ? '$' : '৳'}
                    </span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Amount"
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    />
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSwap}
                    disabled={loading || !amount}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-200 to-yellow-400 text-black font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Processing...' : 'Transfer Funds'}
                </button>

                {/* Fee Warning */}
                {isIncomeToMain && (
                    <div className="mt-3 text-center">
                        <p className="text-[10px] text-amber-500/80 font-medium tracking-wide">
                            ⚠️ A 3% Exchange Fee applies to transfers from Income to Main Wallet.
                        </p>
                    </div>
                )}
            </div>

            <TransactionReceiptModal
                isOpen={!!receipt}
                onClose={() => setReceipt(null)}
                data={receipt}
            />
        </div>
    );
}
