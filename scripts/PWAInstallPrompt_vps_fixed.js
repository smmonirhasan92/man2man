'use client';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotification } from '../context/NotificationContext';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { playSound, requestPermission } = useNotification();

    useEffect(() => {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        const updateHandler = () => setIsUpdating(true);

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('pwaUpdateAvailable', updateHandler);

        const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
        const dismissed = localStorage.getItem('pwa-prompt-dismissed-v2');
        const sessionShown = sessionStorage.getItem('pwa-prompt-shown-session');

        if (!isStandalone && !dismissed && !sessionShown) {
            const timer = setTimeout(() => {
                setShow(true);
                sessionStorage.setItem('pwa-prompt-shown-session', 'true');
                playSound('info');
            }, 3000);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handler);
                window.removeEventListener('pwaUpdateAvailable', updateHandler);
            };
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('pwaUpdateAvailable', updateHandler);
        };
    }, [playSound]);

    const handleInstall = async () => {
        if (isUpdating) {
            window.location.reload();
            return;
        }

        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setShow(false);
                    toast.success('App installing...');
                    setDeferredPrompt(null);
                    return;
                }
            } catch (err) { }
        }

        // Fallback: Direct APK download
        toast.success('Starting download...');
        window.location.href = "/app.apk";
        setTimeout(() => setShow(false), 5000);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-[60] animate-in slide-in-from-bottom duration-500">
            <div className="bg-gradient-to-r from-[#0a192f] to-[#0f1f33] backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center p-1 border border-blue-500/20">
                        <img src="/app-icon.png" alt="App" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">USA Affiliate App</h4>
                        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            {isUpdating ? 'Update Available' : (isIOS ? 'Install for iOS' : 'Download for Android')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShow(false)} className="p-1 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                    <button onClick={handleInstall} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        {isUpdating ? 'Update' : (isIOS ? 'Guide' : 'Install')} <Download className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
