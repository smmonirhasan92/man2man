'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MousePointer2, Info, CheckCircle2 } from 'lucide-react';

/**
 * [MASTERCLASS] Robust Real-UI Interactive Tutorial
 * This version uses an element poller to ensure it never gets stuck on "Initializing".
 */
export default function AuthTutorial({ active, onComplete, setFormData }) {
    const cursorRef = useRef(null);
    const tooltipRef = useRef(null);
    const [stepTitle, setStepTitle] = useState("Initializing...");
    const [stepInfo, setStepInfo] = useState("");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!active) return;

        // Poll for required elements before starting
        const requiredIds = ['register-name', 'register-phone', 'register-password', 'register-submit'];
        let attempts = 0;
        
        const checkElements = setInterval(() => {
            const allFound = requiredIds.every(id => document.getElementById(id));
            attempts++;

            if (allFound) {
                clearInterval(checkElements);
                setIsReady(true);
            } else if (attempts > 50) { // Limit attempts to 5s
                clearInterval(checkElements);
                console.error("Tutorial Timeout: Elements not found");
                onComplete();
            }
        }, 100);

        return () => clearInterval(checkElements);
    }, [active, onComplete]);

    useEffect(() => {
        if (!active || !isReady) return;

        // Force reset form to empty for clean demo
        setFormData({ fullName: '', phone: '', countryCode: '+880', password: '', referralCode: '', deviceId: '', otp: '' });

        const tl = gsap.timeline({
            delay: 0.5,
            onComplete: () => {
                setStepTitle("COMPLETE");
                setTimeout(onComplete, 2000);
            }
        });

        // Robust Coordinate Helper (+ Relative Targeting)
        const moveTo = (id, title, info, typingText, stateKey) => {
            const el = document.getElementById(id);
            if (!el) return;

            // Smooth Scroll
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            tl.to(cursorRef.current, { 
                    opacity: 1,
                    x: () => el.getBoundingClientRect().left + 40,
                    y: () => el.getBoundingClientRect().top + 15,
                    duration: 1.2, 
                    ease: "power3.inOut",
                    onStart: () => {
                        setStepTitle(title);
                        setStepInfo(info);
                    }
              })
              .to(cursorRef.current, { scale: 0.8, duration: 0.2, yoyo: true, repeat: 1 })
              .to({}, { 
                    duration: 1.5, 
                    onUpdate: function() {
                        const prog = this.progress();
                        const currentText = typingText.substring(0, Math.floor(prog * typingText.length));
                        setFormData(prev => ({ ...prev, [stateKey]: currentText }));
                    } 
              })
              .to({}, { duration: 0.3 });
        };

        // 1. Name
        moveTo('register-name', "STEP 1: IDENTITY NAME", "Type your real name here.", "S.M. Monir Hasan", "fullName");
        
        // 2. Phone
        moveTo('register-phone', "STEP 2: MOBILE NUMBER", "Enter your phone number.", "017XXXXXXXX", "phone");
        
        // 3. Password
        moveTo('register-password', "STEP 3: PASSWORD", "Set a strong secure password.", "Admin@123", "password");
        
        // 4. Final Pulse
        tl.to(cursorRef.current, { 
            x: () => document.getElementById('register-submit').getBoundingClientRect().left + 80,
            y: () => document.getElementById('register-submit').getBoundingClientRect().top + 15,
            duration: 1,
            onStart: () => {
                setStepTitle("STEP 4: FINALIZE");
                setStepInfo("Click to start your journey.");
            }
        })
        .to('#register-submit', { scale: 1.05, filter: "brightness(1.5)", duration: 0.4, repeat: 3, yoyo: true });

        return () => tl.kill();
    }, [active, isReady, onComplete, setFormData]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[99999] pointer-events-none bg-black/40 overflow-hidden">
            {/* Cursor */}
            <div ref={cursorRef} className="absolute top-0 left-0 opacity-0 flex flex-col items-start gap-4 z-[100000]">
                <MousePointer2 className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,1)] fill-emerald-400 stroke-black stroke-2" />
                <div ref={tooltipRef} className="bg-[#0b1221] border-2 border-emerald-500/50 p-4 rounded-3xl shadow-2xl min-w-[220px]">
                    <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 tracking-widest"><Info className="w-3 h-3"/> {stepTitle}</p>
                    <p className="text-white text-xs font-bold mt-1">{stepInfo || "Preparing simulation..."}</p>
                </div>
            </div>

            {/* Global Simulation Info */}
            <div className="absolute top-10 w-full flex flex-col items-center pointer-events-none">
                 <div className="px-6 py-2 bg-[#0b1221] border border-emerald-500/30 rounded-full flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                     <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">LIVE INTERACTION TRAINING</span>
                 </div>
            </div>

            {stepTitle === "COMPLETE" && (
                <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-700">
                    <CheckCircle2 className="w-24 h-24 text-emerald-500 animate-bounce" />
                    <h2 className="text-3xl font-black text-white mt-4 uppercase">Let's Play!</h2>
                </div>
            )}
        </div>
    );
}
