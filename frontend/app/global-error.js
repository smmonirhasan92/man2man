'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}) {
    useEffect(() => {
        // Log the error to an error reporting service if needed
        console.error('Next.js Global UI Crash Prevented:', error);
    }, [error]);

    const handleForceHardReload = () => {
        // A standard React reset might just hit the exact same cache issue.
        // Forcing a hard browser reload bypasses the Next.js router cache entirely.
        window.location.href = '/dashboard';
    };

    return (
        <html lang="en">
            <body className="bg-[#0a192f] text-white min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#112240] border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-[60px] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" strokeWidth={2.5} />
                        </div>

                        <h2 className="text-2xl font-black mb-3">Connection Interrupted</h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            We lost sync with the main server due to a weak mobile connection or stale data cache.
                            Don't worry, your funds are safe.
                        </p>

                        <button
                            onClick={handleForceHardReload}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20 group"
                        >
                            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                            <span>Reconnect & Hard Refresh</span>
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
