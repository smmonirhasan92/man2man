export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm">
            {/* Pulse Animation Container */}
            <div className="relative flex items-center justify-center">
                {/* Outer Ripple */}
                <div className="absolute w-24 h-24 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                <div className="absolute w-20 h-20 bg-purple-500 rounded-full animate-ping opacity-20 delay-75"></div>

                {/* Core Logo/Spinner */}
                <div className="relative w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 animate-bounce">
                    <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-lg transform rotate-45"></div>
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-8 flex flex-col items-center gap-1">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">USA AFFILIATE</h3>
                <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-0"></span>
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce delay-300"></span>
                </div>
            </div>
        </div>
    );
}
