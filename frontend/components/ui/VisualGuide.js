'use client';
import { useState, useEffect, useCallback } from 'react';
import { Hand } from 'lucide-react';

export default function VisualGuide({ steps, guideId, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user already saw this guide
        const hasSeen = localStorage.getItem(`guide_seen_${guideId}`);
        if (!hasSeen && steps && steps.length > 0) {
            // Slight delay to allow DOM to render fully
            const timer = setTimeout(() => {
                setIsVisible(true);
                measureTarget();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [guideId, steps]);

    const measureTarget = useCallback(() => {
        if (!steps || !steps[currentStep]) return;
        const targetId = steps[currentStep].targetId;
        const el = document.getElementById(targetId);

        if (el) {
            // Scroll element into view safely
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            }, 300); // Wait for scroll
        } else {
            console.warn(`VisualGuide: Element not found - ${targetId}`);
        }
    }, [currentStep, steps]);

    // Re-measure on resize or step change
    useEffect(() => {
        if (isVisible) {
            measureTarget();
            window.addEventListener('resize', measureTarget);
            window.addEventListener('scroll', measureTarget, { passive: true });
            return () => {
                window.removeEventListener('resize', measureTarget);
                window.removeEventListener('scroll', measureTarget);
            };
        }
    }, [isVisible, currentStep, measureTarget]);

    if (!isVisible || !targetRect || !steps || steps.length === 0) return null;

    const step = steps[currentStep];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem(`guide_seen_${guideId}`, 'true');
        if (onComplete) onComplete();
    };

    // Calculate tooltip position (default bottom)
    let tooltipTop = targetRect.top + targetRect.height + 16;
    let tooltipLeft = targetRect.left + (targetRect.width / 2) - 150; // Center tooltip (approx 300px width)

    // Prevent tooltip from overflowing edges
    if (tooltipLeft < 10) tooltipLeft = 10;
    if (tooltipLeft + 300 > (typeof window !== 'undefined' ? window.innerWidth : 400)) {
        tooltipLeft = (typeof window !== 'undefined' ? window.innerWidth : 400) - 310;
    }

    return (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
            {/* The Dark Overlay with a "Hole" using boxShadow */}
            <div
                className="absolute inset-0 transition-all duration-300 ease-in-out pointer-events-auto"
                onClick={handleNext}
                style={{
                    clipPath: `polygon(
                        0% 0%, 0% 100%, ${targetRect.left}px 100%, 
                        ${targetRect.left}px ${targetRect.top}px, 
                        ${targetRect.left + targetRect.width}px ${targetRect.top}px, 
                        ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px, 
                        ${targetRect.left}px ${targetRect.top + targetRect.height}px, 
                        ${targetRect.left}px 100%, 100% 100%, 100% 0%
                    )`,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Glowing Border around the target */}
            <div
                className="absolute border-2 border-emerald-400 rounded-lg pointer-events-none transition-all duration-300 ease-in-out"
                style={{
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(16, 185, 129, 0.3)'
                }}
            >
                {/* Pulsing effect */}
                <div className="absolute inset-0 bg-emerald-400/20 animate-ping rounded-lg pointer-events-none"></div>
            </div>

            {/* Floating Hand Pointer */}
            <div
                className="absolute text-emerald-400 transition-all duration-300 ease-in-out z-[101]"
                style={{
                    top: targetRect.top + targetRect.height - 10,
                    left: targetRect.left + (targetRect.width / 2),
                    animation: 'bounce 1s infinite'
                }}
            >
                <div className="translate-y-2 -translate-x-2 rotate-[-50deg] transform">
                    ✋
                </div>
            </div>

            {/* Tooltip Instruction Bubble */}
            <div
                className="absolute bg-slate-900 border border-emerald-500/30 text-white p-4 rounded-xl shadow-2xl w-[300px] z-[102] transition-all duration-500 ease-out"
                style={{
                    top: tooltipTop,
                    left: tooltipLeft,
                    transform: 'translateY(0)',
                }}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">
                        Step {currentStep + 1} of {steps.length}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="text-slate-400 hover:text-white text-xs">
                        Skip
                    </button>
                </div>

                <h3 className="font-bold text-base mb-1">{step.title}</h3>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">{step.content}</p>

                <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                        ))}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="bg-emerald-500 text-black px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
                    >
                        {currentStep === steps.length - 1 ? "Got it! 🚀" : "Next 👉"}
                    </button>
                </div>

                {/* Arrow pointer for the tooltip */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-t border-l border-emerald-500/30 rotate-45"></div>
            </div>
        </div>
    );
}
