'use client';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) return;

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Show proactively on entry pages for all devices
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        const isEntryPage = ['/', '/login', '/register'].includes(window.location.pathname);

        let timer;
        if (!dismissed || isEntryPage) {
            // Delay slightly for better UX
            timer = setTimeout(() => setShow(true), 1500);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            if (timer) clearTimeout(timer);
        };
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            toast("Tap 'Share' and then 'Add to Home Screen' to install.", {
                icon: '📲',
                duration: 5000
            });
            return;
        }

        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    setShow(false); // Hide the prompt entirely
                } else {
                    console.log('User dismissed the install prompt');
                }
                setDeferredPrompt(null);
            } catch (err) {
                window.location.href = "https://usaaffiliatemarketing.com/app.apk";
                setShow(false);
            }
        } else {
            // Fallback for Android/Desktop if PWA prompt isn't ready or supported
            window.location.href = "https://usaaffiliatemarketing.com/app.apk";
            setShow(false);
        }
    };

    // Global hook for drawer
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.triggerPWAInstall = handleInstall;
        }
    }, [handleInstall]);

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
                        <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                            {isIOS ? 'Install on iOS' : 'Official App'}
                        </p>
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
                        {isIOS ? 'How?' : 'Install'}
                    </button>
                </div>
            </div>
        </div>
    );
}
