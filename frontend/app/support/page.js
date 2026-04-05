'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import BottomNav from '../../components/BottomNav';
import { 
    ArrowLeft, Plus, ArrowRight, Shield, Clock, CheckCircle, AlertCircle, 
    Copy, Image as ImageIcon, Send, LifeBuoy, CheckCircle2, Ticket, Volume2, History 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';

export default function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [showDeposit, setShowDeposit] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [p2pAmount, setP2pAmount] = useState('');
    const [p2pMethod, setP2pMethod] = useState('Bkash');
    const [p2pUserNumber, setP2pUserNumber] = useState('');
    const [p2pTxID, setP2pTxID] = useState('');
    const [p2pProof, setP2pProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTrx, setActiveTrx] = useState(null); 

    // Ticket States
    const [myTickets, setMyTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();
        fetchActiveTransaction();
    }, []);

    const socket = useSocket('/system');

    useEffect(() => {
        if (socket) {
            socket.on('transaction_update', (data) => {
                console.log('[SOCKET] Transaction Update Received:', data);
                fetchActiveTransaction(); // Refresh data
                playBell();               // Sound alert
            });

            return () => {
                socket.off('transaction_update');
            };
        }
    }, [socket]);

    const fetchActiveTransaction = async () => {
        try {
            const res = await api.get('/transactions/history?limit=5');
            const pending = res.data.transactions.find(t => 
                ['pending', 'pending_instructions', 'awaiting_payment', 'final_review'].includes(t.status)
            );
            if (pending) {
                if (!activeTrx || activeTrx.status !== pending.status) {
                    playBell(); // Notification Sound
                }
                setActiveTrx(pending);
            } else {
                setActiveTrx(null);
            }
        } catch (e) { console.error("Failed to fetch active TRX", e); }
    };

    const playBell = () => {
        try {
            // Using a working external sound for notifications
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
        } catch (e) { console.error("Audio failed", e); }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Number Copied!');
    };

    useEffect(() => {
        if (activeTicket) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support/my-messages');
            setMyTickets(res.data);
            if (activeTicket) {
                const updated = res.data.find(t => t._id === activeTicket._id);
                if (updated) setActiveTicket(updated);
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/support/send', { subject, message });
            toast.success('Ticket created!');
            setSubject(''); setMessage('');
            fetchTickets();
            if (res.data.support) setActiveTicket(res.data.support);
        } catch (err) { toast.error('Failed to create ticket'); }
        finally { setLoading(false); }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !activeTicket) return;
        setReplying(true);
        try {
            const res = await api.post('/support/reply', {
                messageId: activeTicket._id,
                reply: replyText
            });
            setReplyText('');
            setActiveTicket(res.data.support);
            fetchTickets();
        } catch (err) { toast.error('Failed to send message'); }
        finally { setReplying(false); }
    };

    if (activeTicket) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 font-sans">
                <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveTicket(null)} className="p-2 hover:bg-slate-100 rounded-full transition">
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 line-clamp-1">{activeTicket.subject}</h1>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTicket.status === 'answered' ? 'text-green-600' : 'text-blue-500'}`}>
                                STATUS: {activeTicket.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTicket.messages?.map((msg, idx) => {
                        const isMe = msg.senderRole === 'user';
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1 border border-indigo-200">
                                        <LifeBuoy className="w-4 h-4 text-indigo-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe ? 'bg-slate-800 text-white rounded-br-none shadow-md' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm'}`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    <div className="text-[9px] mt-1.5 font-medium flex items-center justify-end gap-1 text-slate-400">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <CheckCircle2 className="w-3 h-3 text-slate-400" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
                <div className="bg-white p-3 border-t border-slate-100">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none"
                        />
                        <button type="submit" disabled={!replyText.trim() || replying} className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center">
                            {replying ? "..." : <Send className="w-5 h-5 ml-1" />}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white font-sans pb-24 overflow-x-hidden">
            <header className="bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-6 py-5 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <h1 className="text-xl font-black uppercase tracking-tighter">Help & Support</h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8 space-y-8">
                {/* Bangladesh Only Hub */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
                        🇧🇩
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-xs font-black uppercase text-emerald-400 tracking-widest mb-1">Official Payment Hub</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">
                            Exclusive for <span className="text-emerald-300">Bangladesh Operators</span> (Bkash, Nagad).
                            <br />All transactions expire in 20 minutes.
                        </p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowDeposit(true)} className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-[2.5rem] border border-emerald-400/20 text-center shadow-xl shadow-emerald-900/40">
                        <Plus className="w-6 h-6 text-emerald-300 mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-emerald-200">Deposit</span>
                        <span className="text-lg font-black block">BUY NXS</span>
                    </button>
                    <button onClick={() => setShowWithdraw(true)} className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-[2.5rem] border border-blue-400/20 text-center shadow-xl shadow-blue-900/40">
                        <ArrowRight className="w-6 h-6 text-blue-300 mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-blue-200">Withdraw</span>
                        <span className="text-lg font-black block">SELL NXS</span>
                    </button>
                </div>

                {/* Support Form */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Create Support Ticket</h2>
                    <form onSubmit={handleCreateTicket} className="space-y-4 pt-4">
                        <input type="text" placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm text-slate-800" />
                        <textarea placeholder="Message..." value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full p-4 h-32 bg-slate-50 rounded-xl border-none font-medium text-sm text-slate-700 resize-none"></textarea>
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg">Submit Ticket</button>
                    </form>
                </div>

                {/* History */}
                <div>
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 ml-2">Ticket History</h3>
                    <div className="space-y-3">
                        {myTickets.map(t => (
                            <div key={t._id} onClick={() => setActiveTicket(t)} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center cursor-pointer">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{t.subject}</h4>
                                    <p className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-100 text-slate-600">{t.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <BottomNav />

            {/* DEPOSIT MODAL */}
            {showDeposit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                    <div className="bg-[#111111] w-full max-w-sm rounded-[3rem] border border-white/10 p-8 shadow-2xl">
                        {!activeTrx ? (
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter">BUY NXS</h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input type="number" placeholder="Amount" value={p2pAmount} onChange={(e)=>setP2pAmount(e.target.value)} className="w-full bg-white/5 rounded-2xl p-6 text-center text-3xl font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                                        <div className="absolute top-2 right-4 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">NXS Units</div>
                                    </div>
                                    
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">যাকে টাকা পাঠাবেন তাকে দিতে হবে</span>
                                        <span className="text-3xl font-black text-white">{(p2pAmount * 2.54).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                                        <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase italic tracking-widest">Rate: 1 NXS = 2.54 BDT</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Bkash', 'Nagad'].map(m => (
                                        <button key={m} onClick={()=>setP2pMethod(m)} className={`py-4 rounded-xl font-black text-[11px] uppercase border transition-all ${p2pMethod === m ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'bg-white/5 text-slate-400 border-white/5 opacity-60 hover:opacity-100'}`}>{m}</button>
                                    ))}
                                </div>
                                <button onClick={async () => {
                                    if (!p2pAmount || p2pAmount <= 0) return toast.error('Enter valid amount');
                                    setLoading(true);
                                    try {
                                        await api.post('/transactions/add-money', { 
                                            amount: p2pAmount, 
                                            method: p2pMethod,
                                            status: 'pending_instructions',
                                            recipientDetails: `BITUKWI_P2P: Initial request for ${p2pMethod} number.`
                                        });
                                        toast.success('Request sent! Wait for admin.'); 
                                        fetchActiveTransaction();
                                    } catch(e){ 
                                        toast.error(e.response?.data?.message || 'Failed'); 
                                    }
                                    finally { setLoading(false); }
                                }} className="w-full py-5 bg-emerald-500 text-black rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">কনফার্ম রিকোয়েস্ট</button>
                                <button onClick={()=>setShowDeposit(false)} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                            </div>
                        ) : activeTrx.status === 'awaiting_payment' ? (
                            <div className="space-y-6">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-center">SEND MONEY</h3>
                                <div className="bg-emerald-500/10 p-4 rounded-2xl flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <span className="text-[9px] text-emerald-400 block mb-1 uppercase font-black">Pay Exactly</span>
                                                <span className="text-2xl font-black text-emerald-400">{(activeTrx.amount * 2.54).toFixed(2)} BDT</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-slate-500 block mb-1 uppercase font-black">For Amount</span>
                                                <span className="text-sm font-black text-white">{activeTrx.amount} NXS</span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/5 w-full mb-3" />
                                        <span className="text-[9px] text-slate-400 block mb-1 uppercase font-black">Send to {activeTrx.method} Number</span>
                                        <span className="text-xl font-black text-white select-all">{activeTrx.adminInstructions}</span>
                                    </div>
                                    <button onClick={()=>copyToClipboard(activeTrx.adminInstructions)} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all ml-4"><Copy className="w-6 h-6 text-white"/></button>
                                </div>
                                <input type="text" placeholder="Enter TxID" value={p2pTxID} onChange={(e)=>setP2pTxID(e.target.value)} className="w-full bg-white/5 rounded-xl p-4 text-center text-white font-bold" />
                                <button onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await api.post('/transactions/submit-proof', { transactionId: activeTrx._id, proofTxID: p2pTxID });
                                        toast.success('Done!'); fetchActiveTransaction();
                                    } catch(e){ toast.error('Error'); } finally { setLoading(false); }
                                }} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black">SUBMIT TXID</button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Clock className="w-12 h-12 text-emerald-500 animate-pulse mx-auto mb-4" />
                                <h3 className="font-black uppercase tracking-tighter">{activeTrx.status === 'pending_instructions' ? 'Waiting for Admin' : 'Reviewing Proof'}</h3>
                                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-black">This may take 2-5 minutes</p>
                                <button onClick={()=>setShowDeposit(false)} className="mt-8 text-[10px] text-slate-600 font-bold uppercase underline">Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showWithdraw && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                    <div className="bg-[#111111] w-full max-w-sm rounded-[3rem] border border-white/10 p-8 shadow-2xl">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter">SELL NXS</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <input type="number" placeholder="Amount" value={p2pAmount} onChange={(e)=>setP2pAmount(e.target.value)} className="w-full bg-white/5 rounded-2xl p-6 text-center text-3xl font-black text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                                    <div className="absolute top-2 right-4 text-[9px] font-black text-slate-500 uppercase tracking-widest italic">NXS Units</div>
                                </div>

                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">আপনি পাবেন (আনুমানিক)</span>
                                    <span className="text-3xl font-black text-white">{(p2pAmount * 2.54).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</span>
                                    <span className="text-[9px] font-bold text-slate-600 mt-1 uppercase italic tracking-widest">Rate: 1 NXS = 2.54 BDT</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {['Bkash', 'Nagad'].map(m => (
                                    <button key={m} onClick={()=>setP2pMethod(m)} className={`py-4 rounded-xl font-black text-[11px] uppercase border transition-all ${p2pMethod === m ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20 scale-[1.02]' : 'bg-white/5 text-slate-400 border-white/5 opacity-60 hover:opacity-100'}`}>{m}</button>
                                ))}
                            </div>
                            <div className="relative">
                                <input type="text" placeholder="যে নাম্বারে টাকা নিবেন" value={p2pUserNumber} onChange={(e)=>setP2pUserNumber(e.target.value)} className="w-full bg-white/5 rounded-2xl p-4 text-center text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>
                            <button onClick={async () => {
                                if (!p2pAmount || p2pAmount <= 0) return toast.error('Enter valid amount');
                                if (!p2pUserNumber) return toast.error('Enter your number');
                                setLoading(true);
                                try {
                                    // FIXED PAYLOAD: accountDetails vs details
                                    await api.post('/withdrawals/request', { 
                                        amount: p2pAmount, 
                                        method: p2pMethod, 
                                        accountDetails: p2pUserNumber,
                                        walletType: 'main'
                                    });
                                    toast.success('ক্যাশ-আউট রিকোয়েস্ট জমা হয়েছে!'); 
                                    setShowWithdraw(false);
                                } catch(e){ 
                                    toast.error(e.response?.data?.message || 'Failed'); 
                                }
                                finally { setLoading(false); }
                            }} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-900/40 active:scale-95 transition-all">ক্যাশ-আউট করুন</button>
                            <button onClick={()=>setShowWithdraw(false)} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
