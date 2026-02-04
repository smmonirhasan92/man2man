import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * SecureAdPlayer
 * 
 * A high-security wrapper for 3rd party ad networks (Adsterra/Monetag).
 * Features:
 * 1. Sandboxed Iframe: Prevents top-level navigation (redirects).
 * 2. Interaction Layer: Users must click "Unlock" to interact, preventing drive-by clicks.
 * 3. Time-based Close: Ensures users view the ad for X seconds.
 */
const SecureAdPlayer = ({ adUrl, type = 'banner', onComplete, duration = 5 }) => {
    const [isLocked, setIsLocked] = useState(true);
    const [timer, setTimer] = useState(duration);
    const [showOverlay, setShowOverlay] = useState(true);

    useEffect(() => {
        let interval;
        if (showOverlay && timer > 0) {
            interval = setInterval(() => setTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [showOverlay, timer]);

    const handleUnlock = () => {
        if (timer > 0) return;
        setShowOverlay(false);
        setIsLocked(false);
        if (onComplete) onComplete();
    };

    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl my-4">

            {/* --- SECURITY HEADER --- */}
            <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Secure Sandbox Active</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-70">
                    <AlertTriangle size={10} />
                    <span>Ext. Content</span>
                </div>
            </div>

            {/* --- SANDBOXED IFRAME --- */}
            {/* 
                sandbox="allow-scripts" -> Allows ad JS to run.
                OMITTING "allow-top-navigation" -> BLOCKS redirects to new URLs replacing your app.
                OMITTING "allow-popups" -> BLOCKS popups (unless you want them).
            */}
            <div className="relative h-64 w-full bg-black">
                <iframe
                    src={adUrl}
                    title="Sponsored Content"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-opacity duration-500 ${isLocked ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                />

                {/* --- PROTECTION OVERLAY --- */}
                {showOverlay && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="text-center p-6 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-xl max-w-sm mx-4">
                            <h3 className="text-white font-bold mb-2">Sponsored Ad</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                View this ad to support the platform.
                            </p>

                            <button
                                onClick={handleUnlock}
                                disabled={timer > 0}
                                className={`
                                    w-full py-2.5 px-6 rounded-lg font-medium transition-all
                                    ${timer > 0
                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    }
                                `}
                            >
                                {timer > 0 ? `Wait ${timer}s...` : 'View Content'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecureAdPlayer;
