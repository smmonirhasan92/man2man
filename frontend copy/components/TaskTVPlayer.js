import React, { useState, useEffect } from 'react';
import { X, Tv, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { animationManager } from '../utils/AnimationManager';

const TaskTVPlayer = ({ task, onComplete, onClose }) => {
    const [timer, setTimer] = useState(task?.duration || 15); // Default enforced to 15s
    const [isMuted, setIsMuted] = useState(true);
    const [isMaximized, setIsMaximized] = useState(false);
    const [canClose, setCanClose] = useState(false);

    const [claiming, setClaiming] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter(); // Ensure useRouter is imported

    useEffect(() => {
        if (!task) return;
        setTimer(task.duration || 15);
        setCanClose(false);
        setClaiming(false);
        setIsSuccess(false);

        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setCanClose(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [task]);

    const handleClaim = async () => {
        if (!canClose || claiming) return;
        setClaiming(true);

        try {
            // Trigger animation
            animationManager.triggerRewardAnimation();

            // Call API
            if (onComplete) {
                await onComplete(task);
            }

            // Show Success UI
            setIsSuccess(true);

            // Auto Redirect after 2s
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (error) {
            console.error(error);
            setClaiming(false);
        }
    };

    if (!task) return null;

    return (
        <div className={`relative transition-all duration-500 ease-in-out ${isMaximized ? 'fixed inset-0 z-50 bg-black' : 'w-full max-w-4xl mx-auto'}`}>

            {/* TV FRAME CONTAINER */}
            <div className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 ${isMaximized ? 'h-full' : 'aspect-video'}`}>

                {/* TV BRANDING BAR (TOP) */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2 text-white/50 text-xs font-mono uppercase tracking-widest">
                        <Tv size={14} className="text-emerald-500" />
                        <span>Monetag Secure Stream</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="text-white/30 hover:text-white transition-colors"
                        >
                            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                    </div>
                </div>

                {/* IFRAME CONTENT (SANDBOXED) */}
                <div className="w-full h-full bg-black relative">
                    <iframe
                        src={task.url}
                        title="Ad Content"
                        className="w-full h-full object-cover"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        referrerPolicy="no-referrer"
                    />
                </div>

                {/* CONTROLS BAR (BOTTOM) */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex items-center justify-between px-6">

                    {/* LEFT: TIMER STATUS */}
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2
                            ${canClose
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse'
                                : 'bg-transparent border-white/20 text-white/50'
                            }
                        `}>
                            {canClose ? <ShieldCheck size={20} /> : timer}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-medium tracking-wide">
                                {canClose ? 'Task Complete' : 'Viewing Ad...'}
                            </span>
                            <span className="text-white/30 text-[10px] uppercase">
                                {canClose ? 'Reward Ready' : `Wait ${timer}s to claim`}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: ACTION BUTTON (CLOSE) - HIDDEN UNTIL DONE */}
                    {canClose && !isSuccess && (
                        <button
                            onClick={handleClaim}
                            disabled={claiming}
                            className={`
                                group flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 transform
                                bg-white text-black hover:bg-emerald-400 hover:scale-105 shadow-lg cursor-pointer
                                ${claiming ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {claiming ? (
                                <span>CLAIMING...</span>
                            ) : (
                                <>
                                    <span>CLAIM REWARD</span>
                                    <X size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                                </>
                            )}
                        </button>
                    )}

                    {/* SUCCESS STATE UI */}
                    {isSuccess && (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <div className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2">
                                <ShieldCheck size={16} />
                                <span>Reward Claimed!</span>
                            </div>
                            <button onClick={() => window.location.href = '/dashboard'} className="text-white/50 text-xs hover:text-white underline">
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* TV ALIEN ANTENNA (DECORATIVE) */}
            {!isMaximized && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-6 flex justify-center items-end opacity-20">
                    <div className="w-[1px] h-full bg-white rotate-[-30deg] origin-bottom px-[0.5px]"></div>
                    <div className="w-[1px] h-full bg-white rotate-[30deg] origin-bottom px-[0.5px]"></div>
                </div>
            )}
        </div>
    );
};

export default TaskTVPlayer;
