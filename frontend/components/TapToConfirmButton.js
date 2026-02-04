'use client';
import { useState, useRef, useEffect, memo } from 'react';

/**
 * TapToConfirmButton Component
 * Simulates a long-press interaction to confirm an action.
 * 
 * Props:
 * - onConfirm: Function to call when the press is completed.
 * - isLoading: Boolean state to show loading spinner.
 * - initialLabel: Text to show normally (e.g., "Confirm Request").
 * - confirmingLabel: Text to show clearly while holding (e.g., "Holding...").
 * - color: Color theme ('blue', 'pink', 'green' etc. - tailwind classes)
 */
const TapToConfirmButton = ({
    onConfirm,
    isLoading,
    initialLabel = "Tap and Hold to Confirm",
    confirmingLabel = "Keep Holding...",
    color = "pink" // default theme
}) => {
    const [isHolding, setIsHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    // Animation frame reference
    const requestRef = useRef();
    const startTimeRef = useRef();

    // Duration in ms for the hold
    const HOLD_DURATION = 1500;

    const startHold = (e) => {
        // Prevent default touch actions (like scrolling/context menu) if needed, 
        // but 'touch-action-none' css is better.
        // e.preventDefault(); 
        if (isLoading || isCompleted) return;
        setIsHolding(true);
        startTimeRef.current = Date.now();
        requestRef.current = requestAnimationFrame(animate);
    };

    const stopHold = () => {
        if (isCompleted) return;
        setIsHolding(false);
        setProgress(0);
        cancelAnimationFrame(requestRef.current);
    };

    const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);

        setProgress(newProgress);

        if (newProgress < 100) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            // Completed!
            setIsCompleted(true);
            setIsHolding(false);
            if (onConfirm) onConfirm();
        }
    };

    // Color Configurations
    const themes = {
        pink: {
            bg: 'bg-pink-600',
            border: 'border-pink-200',
            fill: '#db2777', // pink-600 hex
            track: '#fce7f3' // pink-100 hex
        },
        blue: {
            bg: 'bg-blue-600',
            border: 'border-blue-200',
            fill: '#2563eb',
            track: '#dbeafe'
        },
        purple: {
            bg: 'bg-purple-600',
            border: 'border-purple-200',
            fill: '#9333ea',
            track: '#f3e8ff'
        },
        green: {
            bg: 'bg-green-600',
            border: 'border-green-200',
            fill: '#16a34a',
            track: '#dcfce7'
        },
        orange: {
            bg: 'bg-orange-600',
            border: 'border-orange-200',
            fill: '#ea580c', // orange-600
            track: '#ffedd5' // orange-100
        }
    };

    const theme = themes[color] || themes.pink;

    return (
        <div className="flex flex-col items-center justify-center select-none touch-none">
            {/* The Hidden Helper Text */}
            <p className={`text-xs font-bold uppercase tracking-widest mb-10 transition-all duration-300 ${isHolding ? 'opacity-100 translate-y-0 text-slate-800' : 'opacity-0 translate-y-4'}`}>
                {confirmingLabel}
            </p>

            <div
                className="relative"
                onMouseDown={startHold}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={startHold}
                onTouchEnd={stopHold}
            >
                {/* SVG Ring Container */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                    {/* Background Track Ring */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
                        <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke={theme.track}
                            strokeWidth="4"
                            fill="none"
                        />
                        {/* Progress Ring */}
                        <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke={theme.fill}
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            style={{
                                strokeDasharray: 276,
                                strokeDashoffset: 276 - (276 * progress) / 100,
                                // transition: 'stroke-dashoffset 100ms linear' // REMOVED: Cause of conflict
                            }}
                        />
                    </svg>

                    {/* The Inner Button */}
                    <div
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform duration-100 ${theme.bg} ${isHolding ? 'scale-90' : 'scale-100'} ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {/* Icon or Text */}
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : isCompleted ? (
                            <span className="text-2xl animate-bounce">🚀</span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                {initialLabel}
            </p>
        </div>
    );
};

export default memo(TapToConfirmButton);
