'use client';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, Bot, User } from 'lucide-react';


export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'support_bot', text: 'Hello! How can I help you earn more today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const [socketInstance, setSocketInstance] = useState(null);
    const [currentStream, setCurrentStream] = useState('');

    useEffect(() => {
        if (isOpen && !socketInstance) {
            // Lazy Load Socket Logic
            const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://man2man-api.onrender.com';
            const newSocket = io(BASE_URL + '/system');

            newSocket.on('connect', () => console.log('Chat Connected'));

            newSocket.on('chat_typing', () => setIsTyping(true));

            newSocket.on('chat_stream', (data) => {
                setIsTyping(false);
                setCurrentStream((prev) => prev + data.chunk);
            });

            newSocket.on('chat_response', (data) => {
                setCurrentStream(''); // Clear stream buffer
                setMessages((prev) => [...prev, data]);
            });

            setSocketInstance(newSocket);
            return () => newSocket.disconnect();
        }
    }, [isOpen]);

    // Append Stream to Valid Messages for Display
    const displayMessages = [...messages];
    if (currentStream) {
        displayMessages.push({ sender: 'support_bot', text: currentStream, isStream: true });
    }

    const handleSend = () => {
        if (!input.trim() || !socketInstance) return;

        const userMsg = { sender: 'user', text: input, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        // Emit to Backend
        socketInstance.emit('chat_message', { message: input });
    };


    return (
        <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 w-[85vw] md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">AI Support Agent</h3>
                                    <p className="text-[10px] text-blue-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                            {displayMessages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                        {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                                    </div>
                                    <div
                                        className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                            }`}
                                    >
                                        {msg.text}
                                        {msg.isStream && <span className="inline-block w-1 h-3 ml-1 bg-white animate-pulse" />}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                                        <Bot size={14} className="text-white" />
                                    </div>
                                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white border-2 border-white/20 hover:shadow-blue-500/50 transition-shadow"
                >
                    <MessageSquare size={24} fill="currentColor" />
                    {/* Notification Badge */}
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </motion.button>
            )}
        </div>
    );
}
