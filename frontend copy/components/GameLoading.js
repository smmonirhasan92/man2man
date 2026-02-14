export default function GameLoading() {
    return (
        <div className="flex flex-col justify-center items-center h-full w-full min-h-[300px] bg-black relative overflow-hidden">
            {/* Gaming Network Effect */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
                {/* Controller Icon Pulse */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition animate-ping"></div>
                    <svg className="w-12 h-12 text-purple-400 relative z-10 animate-game-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <div className="text-center">
                    <h3 className="text-sm font-bold text-purple-200 tracking-wider">CONNECTING</h3>
                    <div className="flex gap-1 justify-center mt-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-0"></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes game-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .animate-game-bounce {
                    animation: game-bounce 1s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
