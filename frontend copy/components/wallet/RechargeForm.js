'use client';
import { useState, useEffect } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import TapToConfirmButton from '../TapToConfirmButton';
import toast from 'react-hot-toast';

export default function RechargeForm({ settings, onSubmit, loading, activeTab }) {
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('mobile_banking');
    const [method, setMethod] = useState('bkash');
    const [trxId, setTrxId] = useState('');
    const [selectedDepositAgent, setSelectedDepositAgent] = useState(null);

    // Sync payment mode with parent tab
    useEffect(() => {
        setPaymentMode(activeTab === 'bank' ? 'bank_transfer' : 'mobile_banking');
    }, [activeTab]);

    // Auto-select first agent
    useEffect(() => {
        if (settings.deposit_agents?.length > 0) {
            setSelectedDepositAgent(settings.deposit_agents[0]);
        }
    }, [settings.deposit_agents]);

    const handleSubmit = () => {
        // Validation for TrxID
        if (!trxId || trxId.length < 8) {
            toast.error("Please enter a valid Transaction ID.");
            return;
        }

        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('method', paymentMode === 'bank_transfer' ? 'Bank Transfer' : method);
        formData.append('transactionId', trxId);

        if (paymentMode === 'mobile_banking' && selectedDepositAgent) {
            formData.append('receivedByAgentId', selectedDepositAgent.agentId);
            formData.append('recipientDetails', `Sent to: ${selectedDepositAgent.number} (${selectedDepositAgent.agentName})`);
        } else {
            formData.append('recipientDetails', `Sent to: ${settings.bkash_number}`);
        }

        onSubmit(formData);
    };

    return (
        <div className="flex flex-col h-full">

            {/* Main Card Container */}
            <div className="rounded-3xl p-6 space-y-6 glass-panel">

                {/* Top Section: Payment Tiles (Colorful High Contrast) */}
                {paymentMode === 'mobile_banking' && (
                    <div className="mb-6">
                        <label className="text-[11px] font-bold text-slate-400 mb-2 block uppercase tracking-wide">Select Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['bkash', 'nagad', 'rocket'].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`py-2 rounded-lg text-xs font-black capitalize transition-all border ${method === m
                                        ? m === 'bkash' ? 'bg-[#e2136e] border-[#e2136e] text-white shadow-[0_0_15px_rgba(226,19,110,0.4)]' // Bkash Brand Color
                                            : m === 'nagad' ? 'bg-[#f6921e] border-[#f6921e] text-white shadow-[0_0_15px_rgba(246,146,30,0.4)]' // Nagad Brand Color
                                                : 'bg-[#8c3494] border-[#8c3494] text-white shadow-[0_0_15px_rgba(140,52,148,0.4)]' // Rocket Brand Color
                                        : 'bg-[#0f172a]/60 border-white/5 text-slate-400 hover:bg-[#1e293b]'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Send Money To (Agent) */}
                <div className="mb-4">
                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wide">Mobile Number (Send Money To)</label>
                    <div className="input-premium rounded-xl p-3 flex items-center justify-between group cursor-pointer border border-white/10 bg-[#0f172a]/80">
                        <div className="flex-1">
                            {settings.deposit_agents && settings.deposit_agents.length > 0 ? (
                                <select
                                    className="w-full bg-transparent text-sm font-bold text-white outline-none cursor-pointer appearance-none [&>option]:bg-[#0f172a]"
                                    onChange={(e) => {
                                        const agent = settings.deposit_agents.find(a => a.number === e.target.value);
                                        setSelectedDepositAgent(agent);
                                    }}
                                    value={selectedDepositAgent?.number || ''}
                                >
                                    {settings.deposit_agents.map((agent, idx) => (
                                        <option key={idx} value={agent.number} className="text-white">
                                            {agent.number} ({agent.agentName})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="text-sm font-bold text-white">{settings.bkash_number || 'Loading...'}</span>
                            )}
                            <div className="text-[10px] text-slate-500 mt-0.5">Personal • Click to Copy</div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>
                </div>

                {/* Sender / TrxID */}
                <div className="mb-4">
                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wide">TrxID (Required)</label>
                    <input
                        type="text"
                        className="w-full input-premium rounded-xl py-3 px-4 text-sm font-bold placeholder:text-slate-600 bg-[#0f172a]/80 border-white/10"
                        placeholder="Enter your 10-character TrxID"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                    />
                </div>

                {/* Amount */}
                <div className="mb-4">
                    <label className="text-[11px] font-bold text-slate-400 mb-1.5 block uppercase tracking-wide">Amount</label>
                    <div className="relative">
                        <input
                            type="number"
                            className="w-full input-premium rounded-xl py-3 px-4 text-sm font-bold placeholder:text-slate-600 pl-8 bg-[#0f172a]/80 border-white/10"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <span className="absolute left-3 top-3 text-slate-500 font-bold">৳</span>
                    </div>
                </div>

            </div>

            {/* Confirm Button */}
            <TapToConfirmButton
                onConfirm={handleSubmit}
                isLoading={loading}
                color="blue"
                initialLabel="Confirm Deposit 🇺🇸"
                confirmingLabel="Verifying..."
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 text-white font-black text-lg uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95 transition-all hover:brightness-110 border border-white/20"
            />
        </div>
    );
}
