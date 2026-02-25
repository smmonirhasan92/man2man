'use client';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Check if user already dismissed
            if (!localStorage.getItem('pwa-prompt-dismissed')) {
                setShow(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Detect if already installed (standalone)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShow(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-slide-up">
            <div className="bg-[#0f1f33]/95 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-inner flex items-center justify-center p-1 border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="USA Affiliate App" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-sm tracking-wide">USA Affiliate</h4>
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Official App</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-slate-400 hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleInstall}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-900 px-5 py-2.5 rounded-lg text-xs font-black shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all tracking-wide uppercase"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}
