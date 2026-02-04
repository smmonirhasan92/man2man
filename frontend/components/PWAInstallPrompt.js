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
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <Download className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Install App</h4>
                        <p className="text-slate-400 text-xs text-nowrap">Add to Home Screen</p>
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
                        className="bg-white text-slate-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}
