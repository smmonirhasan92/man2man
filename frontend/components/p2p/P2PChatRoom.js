'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { Send, Clock, AlertTriangle, CheckCircle, Upload, Shield, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function P2PChatRoom({ tradeId, onBack }) {
    const { user } = useAuth();
    const socket = useSocket();
    const [trade, setTrade] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    // [SECURITY] PIN & Modal State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');

    // UI Modals
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadInput, setUploadInput] = useState('https://via.placeholder.com/300?text=Payment+Proof');

    const handleReleaseClick = () => {
        setIsPinModalOpen(true);
    };

    const confirmReleaseWithPin = async () => {
        if (pin.length < 4) return toast.error("Enter valid Password");
        try {
            await api.post(`/p2p/trade/${tradeId}/release`, { pin });
            toast.success("Funds Released Successfully!");
            setIsPinModalOpen(false);
            fetchTradeData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Release Failed");
        }
    };

    const copyPaymentInfo = () => {
        if (trade?.orderId?.paymentDetails) {
            navigator.clipboard.writeText(trade.orderId.paymentDetails);
            toast.success("Number Copied!");
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchTradeData();
        fetchChatHistory();
    }, [tradeId]);

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for new messages
        socket.on('p2p_message', (msg) => {
            if (msg.tradeId === tradeId) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                playDing();
            }
        });

        // Listen for trade status updates (Paid/Completed)
        socket.on('p2p_mark_paid', (updatedTrade) => {
            if (updatedTrade._id === tradeId) {
                setTrade(updatedTrade);
                toast('Buyer marked as PAID', { icon: '💸' });
            }
        });

        socket.on('p2p_completed', (updatedTrade) => {
            if (updatedTrade._id === tradeId) {
                setTrade(updatedTrade);
                toast.success('Trade Completed!');
            }
        });

        return () => {
            socket.off('p2p_message');
            socket.off('p2p_mark_paid');
            socket.off('p2p_completed');
        };
    }, [socket, tradeId]);

    const fetchTradeData = async () => {
        try {
            const res = await api.get(`/p2p/trade/${tradeId}`);
            setTrade(res.data);
        } catch (e) {
            toast.error("Trade Not Found / Access Denied");
            if (onBack) onBack(); // Exit if fatal
        }
    };

    const fetchChatHistory = async () => {
        try {
            const res = await api.get(`/p2p/trade/${tradeId}/chat`);
            setMessages(res.data);
            scrollToBottom();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false); // [FIX] Always stop loading
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const playDing = () => {
        const audio = new Audio('/sounds/ding.mp3'); // Ensure this file exists or use dummy
        audio.play().catch(() => { });
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const tempText = input;
        setInput(''); // Optimistic clear
        try {
            await api.post(`/p2p/trade/${tradeId}/chat`, { text: tempText });
        } catch (e) {
            setInput(tempText); // Revert on fail
            toast.error("Failed send");
        }
    };

    const [proofUrl, setProofUrl] = useState(null); // [SECURITY]
    const [txId, setTxId] = useState('');
    const [senderNumber, setSenderNumber] = useState('');

    // ... (existing code)

    const handleUploadProof = () => {
        setShowUploadModal(true);
    };

    const submitProof = () => {
        if (uploadInput) {
            setProofUrl(uploadInput);
            toast.success("Proof Attached!");
            api.post(`/p2p/trade/${tradeId}/chat`, { text: "Attached Payment Proof", imageUrl: uploadInput });
            setShowUploadModal(false);
        }
    };

    const handleMarkPaid = async () => {
        // Validation: Either Proof OR (TxID + Sender)
        if (!proofUrl && (!txId || !senderNumber)) {
            return toast.error("SECURITY: Upload Proof OR enter TxID + Sender Num.");
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirm Payment Sent',
            message: 'Did you send the money? False claims lead to bans.',
            confirmText: 'Yes, I Sent It',
            onConfirm: async () => {
                try {
                    await api.post(`/p2p/trade/${tradeId}/pay`, { proofUrl, txId, senderNumber });
                    toast.success("Marked as Paid!");
                    fetchTradeData();
                    setConfirmModal({ isOpen: false });
                } catch (e) { toast.error(e.response?.data?.message); }
            }
        });
    };

    const handleHold = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Report Problem',
            message: 'Report Problem? This will freeze the trade and summon Admin.',
            confirmText: 'Freeze Trade',
            onConfirm: async () => {
                try {
                    await api.post(`/p2p/trade/${tradeId}/hold`);
                    toast.success("Trade Frozen. Admin Summoned.");
                    fetchTradeData();
                    setConfirmModal({ isOpen: false });
                } catch (e) { toast.error(e.response?.data?.message); }
            }
        });
    };

    // ... (rest of render)
    {/* Input Area */ }
    <div className="flex gap-2 p-2">
        <button onClick={handleHold} className="p-3 bg-red-900/20 rounded-lg text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" title="Report/Hold"><AlertTriangle className="w-5 h-5" /></button>
        {trade && trade.status !== 'COMPLETED' && (
            <>
                <button onClick={handleUploadProof} className={`p-3 rounded-lg ${proofUrl ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400'} hover:text-white relative`}>
                    <ImageIcon className="w-5 h-5" />
                    {proofUrl && <CheckCircle className="w-3 h-3 absolute top-0 right-0 text-white bg-black rounded-full" />}
                </button>
                {/* ... input ... */}
            </>
        )}
    </div>




    if (loading || !trade) return <div className="h-screen flex items-center justify-center text-white">Loading Trade Chamber...</div>;

    const isBuyer = user._id === trade.buyerId._id;
    const isSeller = user._id === trade.sellerId._id;

    return (
        <div className="flex flex-col h-screen bg-[#0a0f1e] text-white font-sans max-w-4xl mx-auto border-x border-white/5">
            {/* 1. Header with Timer */}
            <div className="p-4 border-b border-white/10 bg-[#111] flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={onBack}><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
                    <div>
                        <h2 className="font-bold text-sm text-slate-200">
                            {isBuyer ? `Paying ${trade.sellerId.username}` : `Selling to ${trade.buyerId.username}`}
                        </h2>
                        <div className="text-xs font-mono text-cyan-400">Order #{trade._id.substr(-6)}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black font-mono text-yellow-500 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 14:59 {/* TODO: Real Timer */}
                    </div>
                    <div className={`text-[10px] uppercase font-bold px-2 rounded ${trade.status === 'COMPLETED' ? 'bg-emerald-500 text-black' :
                        trade.status === 'PAID' ? 'bg-yellow-500 text-black' :
                            'bg-blue-500 text-white'
                        }`}>
                        {trade.status}
                    </div>
                </div>
            </div>





            {/* 1.5 PAYMENT INFO CARD (Sticky & Auto-Show for Buyer) */}
            {isBuyer && trade.status === 'CREATED' && (
                <div className="sticky top-0 z-10 px-4 pt-4 pb-2 bg-[#0a0f1e]/95 backdrop-blur-md border-b border-white/5 shadow-xl">
                    <div className="p-4 bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/30 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-blue-600 text-[9px] font-bold px-2 py-1 rounded-bl-lg text-white">
                            SELLER INFO
                        </div>
                        <div className="flex justify-between items-end">
                            <div onClick={copyPaymentInfo} className="cursor-pointer group">
                                <div className="text-xs text-blue-300 font-medium mb-1">Send Payment To (Tap to Copy)</div>
                                <div className="text-xl font-mono font-black text-white tracking-wider flex items-center gap-2">
                                    {trade.orderId.paymentDetails || "Contact Seller"}
                                    <span className="opacity-0 group-hover:opacity-100 text-xs bg-white text-black px-1 rounded">COPY</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                                    {trade.orderId.paymentMethod} • {trade.sellerId.username}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400">Rate: 1 NXS = {trade.orderId.rate || 126} BDT</div>
                                <div className="text-xs text-slate-300 mt-1">Total Amount</div>
                                <div className="text-2xl font-black text-emerald-400">
                                    {(trade.amount * (trade.orderId.rate || 126)).toLocaleString('en-IN')} <span className="text-sm text-emerald-600">BDT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Alert for Active Trades */}
            {(trade.status === 'CREATED' || trade.status === 'PAID') && (
                <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 text-xs text-center py-1">
                    🔔 {trade.status === 'CREATED' ? 'Waiting for Payment...' : 'Payment Marked Sent. Verify & Release.'}
                </div>
            )}

            {/* PIN MODAL */}
            {isPinModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-[#1a1b2e] p-6 rounded-xl border border-white/10 w-80">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Security Verification</h3>
                        <p className="text-xs text-slate-400 mb-4 text-center">Enter your Account Password to authorize fund release.</p>
                        <input
                            type="password"
                            className="w-full bg-black/50 border border-white/20 rounded p-3 text-center text-xl tracking-widest text-white mb-4 focus:border-blue-500 outline-none"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Password"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsPinModalOpen(false)} className="flex-1 py-2 bg-white/5 rounded hover:bg-white/10 text-sm">Cancel</button>
                            <button onClick={confirmReleaseWithPin} className="flex-1 py-2 bg-emerald-500 text-black font-bold rounded hover:bg-emerald-400 text-sm">Confirm</button>
                        </div>
                    </div>
                </div>
            )}


            {trade.status === 'PAID' && isSeller && (
                <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/30">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Action Required</div>
                            <div className="text-lg font-bold text-white">Buyer Claims Payment Sent</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-white font-mono">{trade.amount} NXS</div>
                        </div>
                    </div>

                    {/* Proof Details - CRITICAL FIX */}
                    <div className="bg-black/40 rounded-lg p-3 mb-4 space-y-2 border border-white/5">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Sender Number:</span>
                            <span className="font-mono text-white select-all">{trade.senderNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Transaction ID:</span>
                            <span className="font-mono text-emerald-300 font-bold select-all">{trade.txId || 'N/A'}</span>
                        </div>
                        {trade.paymentProofUrl && (
                            <a href={trade.paymentProofUrl} target="_blank" className="block text-center text-[10px] text-blue-400 hover:underline mt-2">View Screenshot Proof</a>
                        )}
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="text-[10px] text-slate-500 flex-1">
                            Check your bank app. Only release if the exact amount is reflected in your balance.
                        </div>
                        <button onClick={handleReleaseClick} className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                            Confirm Release
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                <div className="flex justify-center">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs p-3 rounded-lg max-w-sm text-center">
                        <Shield className="w-4 h-4 mx-auto mb-1 opacity-50" />
                        Do not release crypto/funds before verifying the payment in your bank account. Screenshots can be faked.
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {messages.map((msg, i) => {
                        if (msg.type === 'SYSTEM') {
                            return (
                                <div key={i} className="flex justify-center my-4">
                                    <div className="bg-white/5 border border-white/10 text-slate-400 text-[10px] px-4 py-2 rounded-full text-center flex items-center gap-2">
                                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        }

                        // [FIX] Ensure safe string comparison for Mongoose Object IDs
                        const senderStr = typeof msg.senderId === 'object' ? msg.senderId._id?.toString() : msg.senderId?.toString();
                        const userStr = user?._id?.toString();
                        const isMe = senderStr === userStr;

                        return (
                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl text-xs relative group ${isMe
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-[#1a1b2e] border border-white/10 text-slate-300 rounded-bl-none'
                                    }`}>
                                    {msg.imageUrl && (
                                        <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                                            <img src={msg.imageUrl} alt="attachment" className="w-full h-auto" />
                                        </div>
                                    )}
                                    <p>{msg.text}</p>
                                    <span className="text-[9px] opacity-40 mt-1 block text-right">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </div>

            {/* 3. Action Bar (Conditional) */}
            <div className="p-4 bg-[#111] border-t border-white/10 space-y-4">

                {/* Status Actions */}
                {trade.status === 'CREATED' && isBuyer && (
                    <div className=" p-3 bg-blue-900/20 rounded-lg border border-blue-500/30 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-blue-300">Amount to Pay</div>
                            <div className="text-lg font-bold text-white font-mono">
                                {(trade.amount * (trade.orderId.rate || 126)).toLocaleString('en-IN')} BDT
                                <span className="text-xs font-normal text-slate-400 ml-2">({trade.amount} NXS)</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Method: {trade.orderId.paymentMethod}</div>
                        </div>
                        <button onClick={handleMarkPaid} className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20">
                            Mark Transferred
                        </button>
                    </div>
                )}

                {/* PROOF INPUTS (Buyer Only) */}
                {trade.status === 'CREATED' && isBuyer && (
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            value={senderNumber}
                            onChange={(e) => setSenderNumber(e.target.value)}
                            placeholder="Sender Number (Last 4 digits)"
                            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                        />
                        <input
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                            placeholder="Transaction ID (TxID)"
                            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                )}

                {trade.status === 'PAID' && isSeller && (
                    <div className="p-4 bg-emerald-900/20 rounded-xl border border-emerald-500/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Action Required</div>
                                <div className="text-lg font-bold text-white">Buyer Claims Payment Sent</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-white font-mono">{trade.amount} NXS</div>
                            </div>
                        </div>

                        {/* Proof Details */}
                        <div className="bg-black/40 rounded-lg p-3 mb-4 space-y-2 border border-white/5">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Sender Number:</span>
                                <span className="font-mono text-white select-all">{trade.senderNumber || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Transaction ID:</span>
                                <span className="font-mono text-emerald-300 font-bold select-all">{trade.txId || 'N/A'}</span>
                            </div>
                            {trade.paymentProofUrl && (
                                <a href={trade.paymentProofUrl} target="_blank" className="block text-center text-[10px] text-blue-400 hover:underline mt-2">View Screenshot Proof</a>
                            )}
                        </div>

                        <div className="flex gap-3 items-center">
                            <div className="text-[10px] text-slate-500 flex-1">
                                Check your bank app. Only release if the exact amount is reflected in your balance.
                            </div>
                            <button onClick={handleReleaseClick} className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                                Confirm Release
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                {trade.status !== 'COMPLETED' && (
                    <div className="flex gap-2">
                        <button className="p-3 bg-white/5 rounded-lg text-slate-400 hover:text-white"><ImageIcon className="w-5 h-5" /></button>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 text-sm text-white focus:border-blue-500 outline-none"
                        />
                        <button onClick={sendMessage} className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-500"><Send className="w-4 h-4" /></button>
                    </div>
                )}
            </div>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
            />

            {/* Custom Upload Modal */}
            {
                showUploadModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#1F2937] border border-white/10 rounded-3xl p-6 w-full max-w-sm">
                            <h3 className="text-xl font-bold text-white mb-4">Attach Proof</h3>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Image URL</label>
                            <input
                                type="text"
                                value={uploadInput}
                                onChange={(e) => setUploadInput(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowUploadModal(false)} className="flex-1 py-3 text-slate-400 font-bold bg-white/5 rounded-xl">Cancel</button>
                                <button onClick={submitProof} className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl">Attach</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
