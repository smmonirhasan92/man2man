'use client';
import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', content: "Hi there! I'm your man2man support assistant. How can I help you today? 👋" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await api.post('/chat', {
                message: userMsg,
                history: messages
            });

            if (res.data?.reply) {
                setMessages([...newMessages, { role: 'model', content: res.data.reply }]);
            } else {
                setMessages([...newMessages, { role: 'model', content: "System error, wait a moment." }]);
            }
        } catch (err) {
            setMessages([...newMessages, { role: 'model', content: "Our network is busy right now, please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center transition-transform hover:scale-105"
                >
                    <MessageSquare className="w-6 h-6 text-white" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-full max-w-[350px] sm:w-[350px] h-[500px] max-h-[85vh] bg-[#0a0f1e] border border-emerald-500/20 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col font-sans animate-fade-in overflow-hidden -mt-[450px]">

                    {/* Header */}
                    <div className="bg-[#111] p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-900/40 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                <Bot className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-black text-white text-sm flex items-center gap-1">
                                    Support AI <Sparkles className="w-3 h-3 text-yellow-400" />
                                </h3>
                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Online</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0f1e] scrollbar-thin">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-emerald-500/20 border border-emerald-500/30'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-emerald-400" />}
                                    </div>

                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-[#1e293b] text-slate-200 border border-slate-700/50 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex max-w-[85%] gap-2 flex-row">
                                    <div className="w-8 h-8 rounded-full shrink-0 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-[#1e293b] border border-slate-700/50 rounded-tl-none flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-[#111] border-t border-white/5 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(e); }}
                            placeholder="Type your message..."
                            className="flex-1 bg-[#1e293b] border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
