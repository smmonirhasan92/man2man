'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { Send, Clock, AlertTriangle, CheckCircle, Upload, Shield, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';
import VisualGuide from '../ui/VisualGuide';

export default function P2PChatRoom({ tradeId, onBack }) {
    const { user } = useAuth();
    const socket = useSocket();
    const [trade, setTrade] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const [timeLeft, setTimeLeft] = useState('15:00');

    // [SECURITY] PIN & Modal State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState('');

    // UI Modals
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadInput, setUploadInput] = useState('https://via.placeholder.com/300?text=Payment+Proof');

    // Dispute Modal
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');

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
                setMessages(prev => {
                    // Prevent duplicate messages if socket reconnects or fires twice
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
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

        socket.on('p2p_trade_dispute', (updatedTrade) => {
            if (updatedTrade._id === tradeId) {
                setTrade(updatedTrade);
                toast.error('Trade Frozen by Tribunal.');
            }
        });

        return () => {
            socket.off('p2p_message');
            socket.off('p2p_mark_paid');
            socket.off('p2p_completed');
            socket.off('p2p_trade_dispute');
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

    // Timer Logic
    useEffect(() => {
        if (!trade || ['COMPLETED', 'CANCELLED', 'DISPUTE'].includes(trade.status)) {
            if (trade && trade.status === 'COMPLETED') setTimeLeft('00:00');
            else if (trade && trade.status === 'DISPUTE') setTimeLeft('PAUSED');
            else if (trade && trade.status === 'CANCELLED') setTimeLeft('00:00');
            return;
        }

        const endTime = new Date(trade.createdAt).getTime() + 15 * 60000;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance <= 0) {
                clearInterval(interval);
                setTimeLeft('00:00');
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [trade]);

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

    const handleDispute = () => {
        setShowDisputeModal(true);
    };

    const submitDispute = async () => {
        if (!disputeReason.trim()) return toast.error("Provide a reason");
        try {
            await api.post(`/p2p/trade/${tradeId}/dispute`, { reason: disputeReason });
            toast.success("Dispute Raised. Admin Summoned.");
            setShowDisputeModal(false);
            setDisputeReason('');
            fetchTradeData();
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to raise dispute");
        }
    };

    const handleCancelTrade = async () => {
        setConfirmModal({
            isOpen: true,
            title: 'Cancel Trade',
            message: 'Are you sure you want to cancel this trade? Locked funds will be returned to the seller.',
            confirmText: 'Yes, Cancel It',
            onConfirm: async () => {
                try {
                    await api.post(`/p2p/trade/${tradeId}/cancel`);
                    toast.success("Trade Cancelled.");
                    fetchTradeData();
                    setConfirmModal({ isOpen: false });
                } catch (e) { toast.error(e.response?.data?.message || "Failed to cancel"); }
            }
        });
    };

    // ... (rest of render)
    {/* Input Area */ }
    <div className="flex gap-2 p-2">
        {trade && !['COMPLETED', 'CANCELLED', 'DISPUTE'].includes(trade.status) && (
            <button onClick={handleDispute} className="p-3 bg-red-900/20 rounded-lg text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white shrink-0 flex gap-2 items-center" title="Report Issue">
                <AlertTriangle className="w-5 h-5" />
                <span className="hidden sm:inline font-bold text-xs">Report Issue</span>
            </button>
        )}
        {trade && trade.status === 'CREATED' && (
            <button onClick={handleCancelTrade} className="px-3 bg-slate-800 rounded-lg text-white border border-white/10 hover:bg-red-500 hover:border-red-500 text-xs font-bold flex items-center justify-center shrink-0">
                Cancel Trade
            </button>
        )}
        {trade && !['COMPLETED', 'CANCELLED'].includes(trade.status) && (
            <>
                <button onClick={handleUploadProof} disabled={trade.status === 'DISPUTE'} className={`p-3 rounded-lg ${proofUrl ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400'} hover:text-white relative disabled:opacity-50`}>
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

    const getTutorialSteps = () => {
        const c = user?.country?.toUpperCase() || 'BD';
        if (c === 'IN') {
            return [
                { targetId: 'step-1-copy', title: '1. नंबर कॉपी करें', content: 'सेलर को पैसे भेजने के लिए इस नंबर पर क्लिक करके कॉपी करें।' },
                { targetId: 'step-2-proof', title: '2. ट्रांजेक्शन प्रूफ दें', content: 'पैसे भेजने के बाद अपने नंबर के आखिरी 4 अंक और TxID यहाँ डालें।' },
                { targetId: 'step-3-submit', title: '3. कंफर्म करें', content: 'सब कुछ सही होने पर पेमेंट प्राप्त करने का रिक्वेस्ट भेज दें।' }
            ];
        } else if (c === 'BD') {
            return [
                { targetId: 'step-1-copy', title: '১. নম্বর কপি করুন', content: 'সেলারকে টাকা পাঠানোর জন্য এই নম্বরে ক্লিক করে নম্বরটি কপি করুন।' },
                { targetId: 'step-2-proof', title: '২. ট্রানজেকশন প্রুফ দিন', content: 'টাকা পাঠানোর পর আপনার যে নাম্বার থেকে টাকা পাঠিয়েছেন তার শেষের ৪ ডিজিট এবং মেসেজের TxID এখানে বসান।' },
                { targetId: 'step-3-submit', title: '৩. কনফার্ম করুন', content: 'সবকিছু ঠিক থাকলে এই বাটনে ক্লিক করে সেলারকে পেমেন্ট রিসিভ করার রিকোয়েস্ট পাঠান।' }
            ];
        } else {
            return [
                { targetId: 'step-1-copy', title: '1. Copy Number', content: 'Click here to copy the seller\'s payment number.' },
                { targetId: 'step-2-proof', title: '2. Submit Proof', content: 'Enter the last 4 digits of your sending number and the TxID.' },
                { targetId: 'step-3-submit', title: '3. Confirm', content: 'Click this button to notify the seller that you have sent the payment.' }
            ];
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-[#0b0e11] text-[#eaeaec] font-sans w-full mx-auto relative">
            {/* 1. Header with Timer */}
            <div className="p-3 border-b border-[#2b3139] bg-[#181a20] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 text-[#848e9c] hover:text-[#eaeaec]"><ArrowLeft className="w-5 h-5" /></button>
                    <div>
                        <h2 className="font-bold text-[13px] text-[#eaeaec] leading-tight">
                            {isBuyer ? `Pay ${trade.sellerId.username}` : `Sell to ${trade.buyerId.username}`}
                        </h2>
                        <div className="text-[10px] font-mono text-[#848e9c]">Order #{trade._id.substr(-6)}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-black font-mono text-[#fcd535] flex items-center justify-end gap-1.5 leading-none mb-1">
                        <Clock className="w-3.5 h-3.5" /> {timeLeft}
                    </div>
                    <div className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded inline-block ${trade.status === 'COMPLETED' ? 'bg-[#0ecb81] text-black' :
                        trade.status === 'PAID' ? 'bg-[#fcd535] text-black' :
                            trade.status === 'DISPUTE' ? 'bg-[#f6465d] text-white' :
                                'bg-[#0ecb81]/20 text-[#0ecb81]'
                        }`}>
                        {trade.status}
                    </div>
                </div>
            </div>

            {/* 1.5 PAYMENT INFO CARD (Buyer Only - Compact) */}
            {isBuyer && trade.status === 'CREATED' && (
                <div className="shrink-0 p-3 bg-[#181a20] border-b border-[#2b3139]">
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-lg p-3 relative">
                        <div className="absolute top-0 right-0 bg-[#2b3139] text-[9px] font-bold px-2 py-0.5 rounded-bl-lg text-[#848e9c]">
                            PAYMENT INFO
                        </div>
                        <div className="flex justify-between items-end">
                            <div id="step-1-copy" onClick={copyPaymentInfo} className="cursor-pointer group flex-1">
                                <div className="text-[10px] text-[#848e9c] mb-0.5">Transfer To (Tap to Copy)</div>
                                <div className="text-lg font-mono font-black text-[#eaeaec] flex items-center gap-1.5">
                                    {trade.orderId.paymentDetails || "Contact Seller"}
                                </div>
                                <div className="text-[10px] text-[#848e9c] uppercase mt-0.5 flex items-center gap-1">
                                    <span className="border border-[#2b3139] px-1 rounded">{trade.orderId.paymentMethod}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] text-[#848e9c]">1 NXS = {trade.orderId.rate || 126} BDT</div>
                                <div className="text-[10px] text-[#848e9c] mt-1">Total Amount</div>
                                <div className="text-xl font-black text-[#0ecb81] leading-none">
                                    {(trade.amount * (trade.orderId.rate || 126)).toLocaleString('en-IN')} <span className="text-[10px]">BDT</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Alerts */}
            {(trade.status === 'CREATED' || trade.status === 'PAID') && (
                <div className="shrink-0 bg-[#fcd535]/10 border-b border-[#fcd535]/20 text-[#fcd535] text-[10px] font-bold text-center py-1.5 flex justify-center items-center gap-1">
                    <Shield className="w-3 h-3" /> {trade.status === 'CREATED' ? 'Waiting for buyer payment...' : 'Payment marked sent. Verify & release.'}
                </div>
            )}

            {trade.status === 'DISPUTE' && (
                <div className="shrink-0 bg-[#f6465d]/10 border-b border-[#f6465d]/20 text-[#f6465d] text-[10px] text-center p-2">
                    <div className="flex items-center justify-center gap-1.5 font-bold mb-0.5">
                        <AlertTriangle className="w-3 h-3" /> TRADE FROZEN BY TRIBUNAL
                    </div>
                    Admin reviewing. Please upload proof in chat.
                </div>
            )}

            {/* Seller Action Required Box (Compact) */}
            {trade.status === 'PAID' && isSeller && (
                <div className="shrink-0 p-3 bg-[#181a20] border-b border-[#2b3139]">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <div className="text-[10px] text-[#0ecb81] font-bold uppercase">Action Required</div>
                            <div className="text-[13px] font-bold text-[#eaeaec]">Verify Payment</div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-[#eaeaec] font-mono">{trade.amount} NXS</div>
                        </div>
                    </div>
                    <div className="bg-[#0b0e11] rounded p-2 mb-3 border border-[#2b3139] grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-[9px] text-[#848e9c]">Sender:</div>
                            <div className="font-mono text-[11px] text-[#eaeaec] font-bold">{trade.senderNumber || '---'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] text-[#848e9c]">TxID:</div>
                            <div className="font-mono text-[11px] text-[#0ecb81] font-bold">{trade.txId || '---'}</div>
                        </div>
                        {trade.paymentProofUrl && (
                            <div className="col-span-2 text-center mt-1">
                                <a href={trade.paymentProofUrl} target="_blank" className="text-[10px] text-[#fcd535] underline">View Receipt Screenshot</a>
                            </div>
                        )}
                    </div>
                    <button onClick={handleReleaseClick} className="w-full bg-[#0ecb81] hover:bg-[#0b9e65] text-black py-2.5 rounded font-black text-xs uppercase transition">
                        Release Crypto
                    </button>
                </div>
            )}

            {/* 2. Chat Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0b0e11] custom-scrollbar">
                {messages.map((msg, i) => {
                    if (msg.type === 'SYSTEM') {
                        return (
                            <div key={i} className="flex justify-center my-2">
                                <div className="bg-[#2b3139]/50 border border-[#2b3139] text-[#848e9c] text-[9px] px-3 py-1.5 rounded-sm max-w-[80%] text-center">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    }

                    const senderStr = typeof msg.senderId === 'object' ? msg.senderId._id?.toString() : msg.senderId?.toString();
                    const userStr = user?._id?.toString();
                    const isMe = senderStr === userStr;

                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-2 rounded-lg text-[11px] relative leading-relaxed ${isMe ? 'bg-[#fcd535] text-black rounded-br-sm' : 'bg-[#2b3139] text-[#eaeaec] rounded-bl-sm'}`}>
                                {msg.imageUrl && (
                                    <img src={msg.imageUrl} alt="attachment" className="w-full h-auto rounded mb-1" />
                                )}
                                <p className="whitespace-pre-wrap word-break">{msg.text}</p>
                                <div className={`text-[8px] mt-1 text-right ${isMe ? 'text-black/60' : 'text-[#848e9c]'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* 3. Action Bar (Fixed at bottom) */}
            <div className="shrink-0 bg-[#181a20] border-t border-[#2b3139]">
                {/* Proof Panel (Buyer) */}
                {trade.status === 'CREATED' && isBuyer && (
                    <div id="step-2-proof" className="p-3 border-b border-[#2b3139]">
                        <div className="text-[10px] text-[#848e9c] mb-1.5 font-bold uppercase">Submit Proof of Payment</div>
                        <div className="flex gap-2 mb-2">
                            <input
                                value={senderNumber}
                                onChange={(e) => setSenderNumber(e.target.value)}
                                placeholder="Sender Last 4"
                                className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded px-3 py-2 text-[11px] text-[#eaeaec] outline-none focus:border-[#fcd535]"
                            />
                            <input
                                value={txId}
                                onChange={(e) => setTxId(e.target.value)}
                                placeholder="TxID"
                                className="flex-[1.5] bg-[#0b0e11] border border-[#2b3139] rounded px-3 py-2 text-[11px] text-[#eaeaec] outline-none focus:border-[#fcd535]"
                            />
                        </div>
                        <button id="step-3-submit" onClick={handleMarkPaid} className="w-full bg-[#fcd535] hover:bg-[#e6c130] text-black py-2.5 rounded font-black text-xs uppercase transition">
                            Transferred, Notify Seller
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="flex gap-2 p-2">
                    {/* Utility Buttons */}
                    {trade && !['COMPLETED', 'CANCELLED', 'DISPUTE'].includes(trade.status) && (
                        <button onClick={handleDispute} className="p-2.5 bg-[#f6465d]/10 rounded text-[#f6465d] flex-shrink-0" title="Report">
                            <AlertTriangle className="w-4 h-4" />
                        </button>
                    )}
                    {trade && trade.status === 'CREATED' && (
                        <button onClick={handleCancelTrade} className="p-2.5 bg-[#2b3139] rounded text-[#848e9c] text-[10px] font-bold flex-shrink-0 uppercase">
                            Cancel
                        </button>
                    )}
                    {trade && !['COMPLETED', 'CANCELLED'].includes(trade.status) && (
                        <button onClick={handleUploadProof} disabled={trade.status === 'DISPUTE'} className={`p-2.5 rounded ${proofUrl ? 'bg-[#0ecb81] text-black' : 'bg-[#2b3139] text-[#848e9c]'} flex-shrink-0 relative`}>
                            <ImageIcon className="w-4 h-4" />
                            {proofUrl && <CheckCircle className="w-2.5 h-2.5 absolute top-0.5 right-0.5 bg-black text-[#0ecb81] rounded-full" />}
                        </button>
                    )}

                    {/* Chat Input */}
                    {trade.status !== 'COMPLETED' && trade.status !== 'CANCELLED' && (
                        <div className="flex gap-2 flex-1 relative">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                placeholder={trade.status === 'DISPUTE' ? "Chat active for Tribunal..." : "Type a message..."}
                                className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded px-3 py-2 text-[11px] text-[#eaeaec] outline-none focus:border-[#fcd535]"
                            />
                            <button onClick={sendMessage} className="absolute right-1 top-1 bottom-1 px-3 bg-[#fcd535] rounded-sm text-black hover:bg-[#e6c130] transition flex items-center justify-center">
                                <Send className="w-3.5 h-3.5 -ml-0.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals & Guides remain exactly the same logically but updated UI colors */}
            {/* PIN MODAL */}
            {isPinModalOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#181a20] p-5 rounded-lg border border-[#2b3139] w-full max-w-[280px]">
                        <h3 className="text-[13px] font-bold text-[#eaeaec] mb-1">Security Verification</h3>
                        <p className="text-[10px] text-[#848e9c] mb-4">Enter Password to release crypto</p>
                        <input
                            type="password"
                            className="w-full bg-[#0b0e11] border border-[#2b3139] rounded p-2.5 text-center text-sm tracking-widest text-[#eaeaec] mb-4 focus:border-[#0ecb81] outline-none font-mono"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Password"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsPinModalOpen(false)} className="flex-1 py-2 bg-[#2b3139] text-[#848e9c] rounded font-bold text-[11px] uppercase">Cancel</button>
                            <button onClick={confirmReleaseWithPin} className="flex-1 py-2 bg-[#0ecb81] text-black font-bold rounded text-[11px] uppercase">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#181a20] p-5 rounded-lg border border-[#f6465d]/50 w-full max-w-[300px]">
                        <div className="flex justify-center mb-3">
                            <div className="p-2.5 bg-[#f6465d]/10 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-[#f6465d]" />
                            </div>
                        </div>
                        <h3 className="text-sm font-black text-[#eaeaec] text-center mb-1">Report Issue</h3>
                        <p className="text-[9px] text-[#848e9c] mb-4 text-center">
                            Freezes trade and summons Admin. False reports lead to ban.
                        </p>
                        <textarea
                            className="w-full bg-[#0b0e11] border border-[#2b3139] rounded p-2.5 text-[11px] text-[#eaeaec] mb-4 h-20 resize-none outline-none focus:border-[#f6465d]"
                            placeholder="Reason for dispute..."
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowDisputeModal(false)} className="flex-1 py-2 bg-[#2b3139] rounded text-[10px] font-bold text-[#848e9c] uppercase">Cancel</button>
                            <button onClick={submitDispute} className="flex-[1.5] py-2 bg-[#f6465d] font-bold text-white rounded text-[10px] uppercase">Freeze Trade</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#181a20] p-5 rounded-lg border border-[#2b3139] w-full max-w-[280px]">
                        <h3 className="text-[13px] font-bold text-[#eaeaec] mb-3">Attach Proof</h3>
                        <input
                            type="text"
                            value={uploadInput}
                            onChange={(e) => setUploadInput(e.target.value)}
                            placeholder="Image URL"
                            className="w-full bg-[#0b0e11] border border-[#2b3139] rounded p-2 text-[11px] text-[#eaeaec] mb-4 outline-none focus:border-[#fcd535]"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowUploadModal(false)} className="flex-1 py-2 bg-[#2b3139] text-[#848e9c] rounded font-bold text-[11px] uppercase">Cancel</button>
                            <button onClick={submitProof} className="flex-1 py-2 bg-[#fcd535] text-black font-bold rounded text-[11px] uppercase">Attach</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} />

            {isBuyer && trade.status === 'CREATED' && (
                <VisualGuide guideId={`p2p_buyer_guide_${user?.country?.toUpperCase() || 'BD'}`} steps={getTutorialSteps()} />
            )}
        </div>
    );
}
