'use client'; // Error components must be Client Components
import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Next.js Segment Crash Prevented:', error);
    }, [error]);

    const handleSoftReload = () => {
        // Attempt to recover first without full reload
        reset();
    };

    const handleHardReload = () => {
        // Clear caches and navigate home if soft reset fails
        window.location.href = '/dashboard';
    };

    return (
        <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#112240] border border-orange-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 rounded-full blur-[50px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-5">
                        <ShieldAlert className="w-8 h-8 text-orange-500" strokeWidth={2.5} />
                    </div>

                    <h2 className="text-xl font-bold mb-2">Display Error Detected</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        A visual component failed to load, likely due to a poor network connection corrupting the data cache.
                    </p>

                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={handleSoftReload}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-orange-600/20"
                        >
                            Try Again Directly
                        </button>

                        <button
                            onClick={handleHardReload}
                            className="w-full py-3 bg-[#0f172a] hover:bg-[#1e293b] border border-slate-700/50 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            <span>Return to Dashboard</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
