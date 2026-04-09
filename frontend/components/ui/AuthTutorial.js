'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MousePointer2, Info } from 'lucide-react';

/**
 * [PROTOTYPE] Ghost Interaction Tutorial
 * A high-end GSAP component that simulates a video-like walkthrough using actual UI.
 */
export default function AuthTutorial({ active, onComplete }) {
    const cursorRef = useRef(null);
    const tooltipRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!active) return;

        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(onComplete, 2000);
            }
        });

        // Step 1: Cursor appears and moves to Name field
        tl.to(cursorRef.current, { opacity: 1, duration: 0.5 })
          .to(cursorRef.current, { x: 50, y: 120, duration: 1.2, ease: "power3.out" })
          .to(tooltipRef.current, { opacity: 1, y: 0, duration: 0.4 })
          .set(tooltipRef.current, { innerText: "Step 1: Identity Verification" })
          
          // Step 2: Simulate Clicking and Thinking
          .to(cursorRef.current, { scale: 0.8, duration: 0.2, yoyo: true, repeat: 1 })
          .to(tooltipRef.current, { innerText: "Enter your full authorized name...", delay: 0.5 })

          // Step 3: Move to Phone
          .to(cursorRef.current, { y: 200, duration: 0.8, ease: "power2.inOut" })
          .to(tooltipRef.current, { innerText: "Step 2: Connect via Smartphone Node" })
          
          // Step 4: Finalize Pulse
          .to(cursorRef.current, { y: 450, duration: 1, ease: "back.out(1.7)" })
          .to(tooltipRef.current, { innerText: "Unlock the Gateway to Earn!" })
          .to('.tutorial-target-button', { scale: 1.05, boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)", duration: 0.3, repeat: 3, yoyo: true });

        return () => tl.kill();
    }, [active, onComplete]);

    if (!active) return null;

    return (
        <div ref={containerRef} className="fixed inset-0 z-[100] pointer-events-none bg-black/20 backdrop-blur-[2px] overflow-hidden">
            {/* Ghost Cursor */}
            <div 
                ref={cursorRef} 
                className="absolute opacity-0 flex flex-col items-start gap-2"
                style={{ top: 0, left: '25%' }}
            >
                <MousePointer2 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)] fill-emerald-400" />
                
                {/* Tutorial Tooltip Bubble */}
                <div 
                    ref={tooltipRef}
                    className="opacity-0 translate-y-4 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 whitespace-nowrap"
                >
                    <Info className="w-3 h-3" />
                    Initializing Tutorial...
                </div>
            </div>

            {/* Hint Overlay */}
            <div className="absolute top-10 right-10 bg-[#131c31] border border-white/10 p-4 rounded-2xl animate-pulse">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Integration Preview</p>
                <p className="text-white text-xs mt-1">Watching AI Guided Interaction...</p>
            </div>
        </div>
    );
}
