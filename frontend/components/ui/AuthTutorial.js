'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MousePointer2, Info, CheckCircle2 } from 'lucide-react';

/**
 * [FIXED & POLISHED] Real-UI Interactive Tutorial
 * This version ensures coordinates are perfect and the cursor NEVER stands still.
 */
export default function AuthTutorial({ active, onComplete, setFormData }) {
    const cursorRef = useRef(null);
    const tooltipRef = useRef(null);
    const [stepTitle, setStepTitle] = useState("Initializing...");
    const [stepInfo, setStepInfo] = useState("");

    useEffect(() => {
        if (!active) return;

        // Force reset form to empty for clean demo
        setFormData({ fullName: '', phone: '', countryCode: '+880', password: '', referralCode: '', deviceId: '', otp: '' });

        const tl = gsap.timeline({
            delay: 1,
            onComplete: () => {
                setStepTitle("TUTORIAL COMPLETE");
                setTimeout(onComplete, 2500);
            }
        });

        // Robust Coordinate Helper (+ Scrolling Support)
        const moveTo = (id, title, info, typingText, stateKey) => {
            const el = document.getElementById(id);
            if (!el) return;

            // Scroll element into view first
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            tl.to({}, { duration: 0.8 }) // Wait for scroll
              .to(cursorRef.current, { 
                    opacity: 1,
                    x: () => {
                        const rect = el.getBoundingClientRect();
                        return rect.left + 50;
                    },
                    y: () => {
                        const rect = el.getBoundingClientRect();
                        return rect.top + 15;
                    },
                    duration: 1.2, 
                    ease: "power3.inOut",
                    onStart: () => {
                        setStepTitle(title);
                        setStepInfo(info);
                    }
              })
              .to(cursorRef.current, { scale: 0.7, duration: 0.2, yoyo: true, repeat: 1 }) // Click Simulation
              .to({}, { 
                    duration: 1.5, 
                    onUpdate: function() {
                        const prog = this.progress();
                        const currentText = typingText.substring(0, Math.floor(prog * typingText.length));
                        setFormData(prev => ({ ...prev, [stateKey]: currentText }));
                    } 
              })
              .to({}, { duration: 0.4 }); // Tiny pause
        };

        // --- THE FULL WALKTHROUGH FLOW ---
        
        // 1. Identity Name
        moveTo('register-name', "STEP 1: IDENTITY NAME", "Type your full authorized name here.", "S.M. Monir Hasan", "fullName");
        
        // 2. Phone Number
        moveTo('register-phone', "STEP 2: SECURE MOBILE", "Enter your phone for node connection.", "01788776655", "phone");
        
        // 3. Password
        moveTo('register-password', "STEP 3: SECURITY KEY", "Create a unique password for access.", "Admin@123", "password");
        
        // 4. Referral Code
        moveTo('register-ref', "STEP 4: REFERRAL (OPTIONAL)", "Enter code if you have one, or skip.", "USA_PRO_99", "referralCode");

        // 5. Finalize Button Simulation
        tl.to(cursorRef.current, { 
            x: () => {
                const el = document.getElementById('register-submit');
                return el ? el.getBoundingClientRect().left + 100 : window.innerWidth / 2;
            },
            y: () => {
                const el = document.getElementById('register-submit');
                return el ? el.getBoundingClientRect().top + 20 : window.innerHeight - 150;
            },
            duration: 1.2,
            ease: "back.out(1.7)",
            onStart: () => {
                setStepTitle("FINAL STEP: REGISTER");
                setStepInfo("Click to finalize your secure registration.");
            }
        })
        .to('#register-submit', { scale: 1.05, filter: "brightness(1.5)", boxShadow: "0 0 40px rgba(16,185,129,0.5)", duration: 0.3, repeat: 5, yoyo: true });

        return () => tl.kill();
    }, [active, onComplete, setFormData]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[999] pointer-events-none bg-black/30 backdrop-blur-[1px] overflow-hidden">
            {/* Ghost Cursor with Integrated Info Box */}
            <div 
                ref={cursorRef} 
                className="absolute top-0 left-0 opacity-0 flex flex-col items-start gap-3 z-[1000] pointer-events-none"
                style={{ transform: 'translate(0,0)' }}
            >
                {/* Visual Cursor */}
                <MousePointer2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,1)] fill-emerald-400 stroke-black stroke-2" />
                
                {/* Step Info Bubble */}
                <div 
                    ref={tooltipRef} 
                    className="bg-[#0b1221] border-2 border-emerald-500/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[200px] animate-in slide-in-from-left-4 duration-300"
                >
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-3 h-3" /> {stepTitle}
                    </p>
                    <p className="text-white text-xs font-bold mt-1 leading-relaxed">{stepInfo}</p>
                </div>
            </div>

            {/* Global Simulation Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex flex-col items-center gap-2 pointer-events-none">
                 <div className="flex items-center gap-3 px-6 py-2 bg-[#0b1221] border border-emerald-500/50 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">System Interaction Simulation</span>
                 </div>
                 <p className="text-slate-400 text-[10px] italic">Your real form is being used for this training. Watch carefully.</p>
            </div>

            {/* Progress Success Overlay */}
            {stepTitle === "TUTORIAL COMPLETE" && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-1000">
                    <div className="p-10 bg-emerald-500 rounded-[3rem] shadow-[0_0_100px_rgba(16,185,129,0.4)] flex flex-col items-center">
                        <CheckCircle2 className="w-24 h-24 text-white animate-bounce" />
                        <h2 className="text-3xl font-black text-white mt-6 uppercase tracking-widest">Mastered!</h2>
                        <p className="text-emerald-100 font-bold mt-2">You are now ready to dominate the USA Affiliate network.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
