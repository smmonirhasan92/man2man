'use client';
import { useState } from 'react';
import api from '../../services/api';
import { X, Globe2, Zap, ArrowDownCircle, ArrowUpCircle, ChevronDown, CheckCircle, Search, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function OrderCreationModal({ isOpen, onClose, onSuccess }) {
    const { user } = useAuth();
    const [adMode, setAdMode] = useState('SELL'); // 'BUY' or 'SELL'
    const [amount, setAmount] = useState(''); // Max Limit
    const [rate, setRate] = useState('120'); // Exchange Rate
    const [fiatCurrency, setFiatCurrency] = useState('BDT'); // Fiat Currency
    const defaultMethod = user?.country?.toUpperCase() === 'IN' ? 'phonepe' : user?.country?.toUpperCase() === 'BD' ? 'bkash' : 'binance';

    const [method, setMethod] = useState(defaultMethod);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [transactionType, setTransactionType] = useState('SEND_MONEY');
    const [accountType, setAccountType] = useState('Personal'); // [NEW]
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const getPaymentMethods = () => {
        return [
            { value: 'bkash', label: 'bKash (BD)' },
            { value: 'nagad', label: 'Nagad (BD)' },
            { value: 'rocket', label: 'Rocket (BD)' },
            { value: 'binance', label: 'Binance Pay (Global)' },
            { value: 'gpay', label: 'Google Pay (IN)' },
            { value: 'phonepe', label: 'PhonePe (IN)' },
            { value: 'paytm', label: 'Paytm (IN)' },
            { value: 'bank', label: 'Bank Transfer' }
        ];
    };

    const getPaymentIconColor = (val) => {
        if (!val) return 'bg-slate-500';
        const v = val.toLowerCase();
        if (v.includes('bkash')) return 'bg-[#E2136E] text-white';
        if (v.includes('nagad')) return 'bg-[#F37021] text-white';
        if (v.includes('rocket')) return 'bg-[#8C2982] text-white';
        if (v.includes('binance')) return 'bg-[#FCD535] text-black';
        if (v.includes('gpay')) return 'bg-[#4285F4] text-white';
        if (v.includes('phonepe')) return 'bg-[#5f259f] text-white';
        if (v.includes('paytm')) return 'bg-[#002970] text-white';
        return 'bg-blue-500 text-white';
    };

    const filteredMethods = getPaymentMethods().filter(pm => 
        pm.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        pm.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        // If it's a BUY Ad, the Maker is paying, so they don't provide account details to receive funds
        if (adMode === 'BUY' && (!amount || !rate)) return toast.error("Fill limit and rate");
        if (adMode === 'SELL' && (!amount || !details || !rate)) return toast.error("Fill all fields");
        setLoading(true);
        try {
            // Prefix Logic
            let finalDetails = details;
            if (['bkash', 'nagad', 'rocket'].includes(method.toLowerCase())) {
                finalDetails = `[${accountType}] ${details}`;
            }

            await api.post('/p2p/order', {
                type: adMode,
                amount: Number(amount),
                rate: Number(rate),
                fiatCurrency: fiatCurrency,
                paymentMethod: method,
                transactionType: adMode === 'SELL' ? transactionType : 'SEND_MONEY',
                paymentDetails: adMode === 'BUY' ? 'Pending Taker Info' : finalDetails
            });
            toast.success(`${adMode === 'BUY' ? 'Buy' : 'Sell'} Ad Created Successfully!`);
            onSuccess(adMode);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create ad");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#0a0f1e] border border-blue-500/20 w-full max-w-sm rounded-[24px] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111] shrink-0">
                    <h3 className="font-black text-white flex items-center gap-2">
                        <Globe2 className="w-5 h-5 text-blue-400" /> Post P2P Ad
                    </h3>
                    <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white transition" /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-4 bg-[#0a0f1e]">
                        {/* Toggle BUY / SELL AD */}
                        <div className="flex bg-[#111] p-1 rounded-xl mb-2 border border-white/10">
                            <button
                                type="button"
                                onClick={() => setAdMode('BUY')}
                                className={`flex-1 py-3 rounded-lg text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 ${adMode === 'BUY' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-white'}`}
                            >
                                <ArrowDownCircle className="w-4 h-4" /> I WANT TO BUY
                            </button>
                            <button
                                type="button"
                                onClick={() => setAdMode('SELL')}
                                className={`flex-1 py-3 rounded-lg text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 ${adMode === 'SELL' ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-white'}`}
                            >
                                <ArrowUpCircle className="w-4 h-4" /> I WANT TO SELL
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">

                        <div className={`p-3 rounded-xl border flex gap-3 ${adMode === 'BUY' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                            <Zap className={`w-5 h-5 shrink-0 ${adMode === 'BUY' ? 'text-blue-400' : 'text-emerald-400'}`} />
                            <div className="text-[10px] text-white/70 leading-relaxed font-bold">
                                {adMode === 'BUY'
                                    ? "You are posting an Ad to BUY NXS from other users. You must send them fiat currency to their provided accounts."
                                    : `You are posting an Ad to SELL NXS. Your Wallet Balance must cover the limit. Minimum transaction limits based on your active package apply.`}
                            </div>
                        </div>

                        <div className="bg-[#111] p-3 rounded-xl border border-white/10 flex items-start gap-2">
                            <span className="text-yellow-500 text-base leading-none">💡</span>
                            <div className="text-[10px] text-slate-300 font-bold leading-relaxed">
                                <span className="text-white">Exchange Rate Setup:</span> Set the exchange rate in your local currency for <strong>$1 USD (50 NXS)</strong> (e.g., 120 BDT or 85 INR). Buyers/Sellers will use this rate to calculate fiat payments.
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Rate (per $1 USD / 50 NXS)</label>
                                <div className="relative flex gap-2">
                                    <select
                                        value={fiatCurrency}
                                        onChange={e => setFiatCurrency(e.target.value)}
                                        className={`w-1/3 bg-[#111927] border border-white/10 rounded-xl p-3 text-white font-bold outline-none transition appearance-none ${adMode === 'BUY' ? 'focus:border-blue-500' : 'focus:border-emerald-500'}`}
                                    >
                                        <option value="BDT">BDT</option>
                                        <option value="INR">INR</option>
                                        <option value="SAR">SAR</option>
                                        <option value="MYR">MYR</option>
                                        <option value="USD">USD</option>
                                        <option value="PKR">PKR</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={rate}
                                        onChange={e => setRate(e.target.value)}
                                        className={`w-2/3 bg-[#111927] border border-white/10 rounded-xl p-3 font-black focus:outline-none transition ${adMode === 'BUY' ? 'text-blue-400 focus:border-blue-500' : 'text-emerald-400 focus:border-emerald-500'}`}
                                        placeholder="e.g. 120"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Total NXS Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className={`w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white font-bold outline-none transition ${adMode === 'BUY' ? 'focus:border-blue-500' : 'focus:border-emerald-500'}`}
                                    placeholder="e.g. 50"
                                />
                                {/* LIVE CALCULATION DISPLAY */}
                                {amount && rate && (
                                    <div className="mt-2 space-y-2">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg flex justify-between items-center border border-emerald-500/20 shadow-inner">
                                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest text-[9px]">Calculated Rate:</span>
                                            <span className="text-sm font-black text-emerald-400">
                                                1 NXS = {(Number(rate) / 50).toFixed(2)} <span className="text-[10px]">{fiatCurrency}</span>
                                            </span>
                                        </div>
                                        <div className="p-2 bg-slate-800/50 rounded-lg flex justify-between items-center border border-white/5 shadow-inner">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-[9px]">Total Receive:</span>
                                            <span className="text-sm font-black text-white">
                                                {((Number(amount) / 50) * Number(rate)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{fiatCurrency}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1 relative" style={{ zIndex: 50 }}>
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                                {adMode === 'BUY' ? 'I will pay via' : 'Receive fiat via'}
                            </label>
                            
                            <div className="relative">
                                {/* Invisible overlay to close dropdown when tapping outside */}
                                {showDropdown && (
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setShowDropdown(false); 
                                            if (document.activeElement) document.activeElement.blur();
                                        }}
                                    ></div>
                                )}
                                
                                <div className={`relative z-50 flex items-center bg-[#111927] border border-white/10 rounded-xl px-3 transition-colors ${adMode === 'BUY' ? 'focus-within:border-blue-500 focus-within:shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'focus-within:border-emerald-500 focus-within:shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}>
                                    {/* Selected Icon Display - only show if not searching AND method exists */}
                                    {!showDropdown && method && (
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 shadow-lg ${getPaymentIconColor(method)}`}>
                                            <span className="text-[10px] font-black">{method.charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                    
                                    <input
                                        type="text"
                                        value={showDropdown ? searchQuery : (getPaymentMethods().find(m => m.value === method)?.label || method)}
                                        onFocus={() => {
                                            setSearchQuery('');
                                            setShowDropdown(true);
                                        }}
                                        onChange={e => {
                                            setSearchQuery(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        className={`w-full bg-transparent p-3 pl-0 text-white font-bold outline-none cursor-pointer placeholder-slate-500`}
                                        placeholder="Tap to search or select method..."
                                    />
                                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform duration-300 pointer-events-none ${showDropdown ? 'rotate-180 text-white' : ''}`} />
                                </div>

                                {/* Custom Dropdown Menu */}
                                {showDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] max-h-60 overflow-y-auto custom-scrollbar flex flex-col">
                                        {/* Search Header visual */}
                                        <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-black/20 sticky top-0 backdrop-blur-md">
                                            <Search className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Searching Options</span>
                                        </div>
                                        
                                        <div className="p-2 space-y-1">
                                            {filteredMethods.map(pm => (
                                                <div 
                                                    key={pm.value}
                                                    onClick={() => {
                                                        setMethod(pm.value);
                                                        setSearchQuery('');
                                                        setShowDropdown(false);
                                                        if (document.activeElement) document.activeElement.blur();
                                                    }}
                                                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all active:scale-95 ${method === pm.value ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${getPaymentIconColor(pm.value)}`}>
                                                        <span className="text-[12px] font-black">{pm.label.charAt(0)}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white flex-1">{pm.label}</span>
                                                    {method === pm.value && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                                </div>
                                            ))}
                                            
                                            {/* Custom Entry if search doesn't explicitly match */}
                                            {searchQuery && !filteredMethods.some(m => m.label.toLowerCase() === searchQuery.toLowerCase() || m.value.toLowerCase() === searchQuery.toLowerCase()) && (
                                                <div 
                                                    onClick={() => {
                                                        setMethod(searchQuery);
                                                        setShowDropdown(false);
                                                        if (document.activeElement) document.activeElement.blur();
                                                    }}
                                                    className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-blue-500/20 active:scale-95"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Custom Method</span>
                                                        <span className="text-sm text-blue-400 font-black">+ Use &quot;{searchQuery}&quot;</span>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-blue-400" />
                                                </div>
                                            )}
                                            
                                            {filteredMethods.length === 0 && !searchQuery && (
                                                <div className="p-4 text-center text-xs text-slate-500 font-bold">
                                                    No methods available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {adMode === 'SELL' && (
                            <>
                                {['bkash', 'nagad', 'rocket'].includes(method.toLowerCase()) && (
                                    <div className="space-y-1 mt-2">
                                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                                            Account Type
                                        </label>
                                        <div className="flex bg-[#111] p-1 rounded-xl border border-white/10 text-nowrap overflow-x-auto custom-scrollbar no-scrollbar">
                                            {['Personal', 'Agent', 'Merchant'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setAccountType(t)}
                                                    className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${accountType === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1 mt-2">
                                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                                        Transaction Type
                                    </label>
                                    <div className="flex bg-[#111] p-1 rounded-xl border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('SEND_MONEY')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${transactionType === 'SEND_MONEY' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Send Money
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTransactionType('CASH_OUT')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${transactionType === 'CASH_OUT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Cash Out
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                                        {method.toLowerCase().includes('binance') ? 'Binance Pay ID / Email' : 'Payment Details (Number)'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={details}
                                        onChange={e => setDetails(e.target.value)}
                                        className="w-full bg-[#111927] border border-white/10 rounded-xl p-3 text-white outline-none transition font-mono focus:border-emerald-500"
                                        placeholder={method.toLowerCase().includes('binance') ? "Binance ID or Email" : `e.g. 017XXXXXX (${method})`}
                                    />
                                </div>
                            </>
                        )}

                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-3 items-center">
                            <span className="text-xl">🔥</span>
                            <div className="text-[10px] text-red-200 leading-relaxed font-bold tracking-wide">
                                A <strong className="text-red-400">2% System Burn Fee</strong> is deducted from the Seller when the trade is successfully completed.
                            </div>
                        </div>

                        {adMode === 'SELL' && (
                            <div className="px-2 text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                *Ensure your selling amount meets your package&apos;s minimum threshold (e.g. 250 NXS).*
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-black py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 active:scale-95 uppercase tracking-widest ${adMode === 'BUY'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-blue-900/50'
                                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-900/50'
                                }`}
                        >
                            {loading ? 'Publishing...' : `POST ${adMode} AD`}
                        </button>

                        <div className="h-10"></div> {/* Extra spacing at bottom for mobile clarity */}
                    </form>
                </div>
            </div>
        </div>
    );
}
