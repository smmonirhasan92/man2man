'use client';
import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Preload sound
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.5;

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check standalone mode (already installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const dismissed = localStorage.getItem('pwa-prompt-dismissed-v2');

        if (!isStandalone && !dismissed) {
            // Show proactively after a short delay for a premium feel
            const timer = setTimeout(() => {
                setShow(true);
                // Attempt to play sound to grab attention
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.log('Audio autoplay blocked by browser', e));
                }
            }, 2000);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handler);
            };
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (isIOS) {
            alert("To install: Tap the 'Share' icon at the bottom, then select 'Add to Home Screen'.");
            return;
        }

        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setShow(false);
                }
                setDeferredPrompt(null);
            } catch (err) {
                // Fallback on error
                toast("Please tap the browser menu (⋮) and select 'Install App' or 'Add to Home screen'.", { duration: 6000, icon: '⚙️' });
            }
        } else {
            // Fallback for Android/Desktop if PWA prompt isn't ready or supported
            toast("Please tap the browser menu (⋮) and select 'Install App' or 'Add to Home screen'.", { duration: 6000, icon: '⚙️' });
        }
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('pwa-prompt-dismissed-v2', 'true');
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-slide-up">
            <div className="bg-gradient-to-r from-[#0a192f] to-[#0f1f33] backdrop-blur-2xl rounded-[1.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-blue-500/30 flex items-center justify-between ring-1 ring-white/10 relative overflow-hidden">
                {/* Premium Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-50 pointer-events-none"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#0A2540] shadow-inner flex items-center justify-center p-1.5 border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icon.png" alt="USA Affiliate App" className="w-full h-full object-contain drop-shadow-md rounded-xl" />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-base tracking-wide flex items-center gap-1">
                            USA Affiliate <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded text-white font-bold">PRO</span>
                        </h4>
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                            {isIOS ? 'Install on iOS' : 'Download Android App'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleInstall}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all tracking-wide uppercase flex items-center gap-1.5 border border-white/10"
                    >
                        {isIOS ? 'How?' : 'GET'} <Download className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
