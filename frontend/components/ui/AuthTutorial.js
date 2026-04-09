'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MousePointer2, Info, CheckCircle2 } from 'lucide-react';

/**
 * [PRO MASTERCLASS] Real-UI Simulating Ghost Interaction
 * This version uses the ACTUAL form elements on the page for 100% realism.
 */
export default function AuthTutorial({ active, onComplete, setFormData }) {
    const cursorRef = useRef(null);
    const tooltipRef = useRef(null);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!active) return;

        // Reset real form state for a fresh start
        setFormData({ fullName: '', phone: '', countryCode: '+880', password: '', referralCode: '', deviceId: '', otp: '' });
        setStep(1);

        const tl = gsap.timeline({
            onComplete: () => {
                setStep(100);
                setTimeout(() => {
                    // Cleanup real form state after demo
                    setFormData({ fullName: '', phone: '', countryCode: '+880', password: '', referralCode: '', deviceId: '', otp: '' });
                    onComplete();
                }, 2000);
            }
        });

        // Helper to get element position
        const getPoint = (id) => {
            const el = document.getElementById(id);
            if (!el) return { x: 100, y: 200 };
            const rect = el.getBoundingClientRect();
            return { x: rect.left + 40, y: rect.top + 20 };
        };

        // --- STEP 1: TYPING NAME ---
        const pos1 = getPoint('register-name');
        tl.to(cursorRef.current, { opacity: 1, x: pos1.x, y: pos1.y, duration: 1.5, ease: "power3.out" })
          .to(tooltipRef.current, { opacity: 1, scale: 1, duration: 0.3 })
          .set(tooltipRef.current, { innerText: "Step 1: Type Identity Name" })
          .to(cursorRef.current, { scale: 0.8, duration: 0.2, yoyo: true, repeat: 1 })
          .to({}, { duration: 1, onUpdate: function() {
              const progress = this.progress();
              const full = "S.M. Monir Hasan";
              const current = full.substring(0, Math.floor(progress * full.length));
              setFormData(p => ({...p, fullName: current}));
          }})

          // --- STEP 2: PHONE ---
          const pos2 = getPoint('register-phone');
          tl.to(cursorRef.current, { x: pos2.x, y: pos2.y, duration: 1, ease: "power2.inOut" })
            .set(tooltipRef.current, { innerText: "Step 2: Enter Authorized Number" })
            .to(cursorRef.current, { scale: 0.8, duration: 0.2, yoyo: true, repeat: 1 })
            .to({}, { duration: 1, onUpdate: function() {
                const progress = this.progress();
                const full = "01755667788";
                const current = full.substring(0, Math.floor(progress * full.length));
                setFormData(p => ({...p, phone: current}));
            }})

          // --- STEP 3: PASSWORD ---
          const pos3 = getPoint('register-password');
          tl.to(cursorRef.current, { x: pos3.x, y: pos3.y, duration: 1, ease: "power2.inOut" })
            .set(tooltipRef.current, { innerText: "Step 3: Secure Your Entry" })
            .to(cursorRef.current, { scale: 0.8, duration: 0.2, yoyo: true, repeat: 1 })
            .to({}, { duration: 0.8, onUpdate: function() {
                const progress = this.progress();
                const full = "********";
                const current = full.substring(0, Math.floor(progress * full.length));
                setFormData(p => ({...p, password: current}));
            }})

          // --- STEP 4: REFERRAL (OPTIONAL) ---
          const pos4 = getPoint('register-ref');
          tl.to(cursorRef.current, { x: pos4.x, y: pos4.y, duration: 1, ease: "power2.inOut" })
            .set(tooltipRef.current, { innerText: "Step 4: Referral Code (Optional)" })
            .to(cursorRef.current, { scale: 0.8, duration: 0.2, yoyo: true, repeat: 1 })
            .to({}, { duration: 0.6, onUpdate: function() {
                const progress = this.progress();
                const full = "USA777";
                const current = full.substring(0, Math.floor(progress * full.length));
                setFormData(p => ({...p, referralCode: current}));
            }})

          // --- STEP 5: VERIFY TRIGGER ---
          tl.to(cursorRef.current, { x: window.innerWidth/2 + 100, y: window.innerHeight/2 + 150, duration: 1, ease: "power2.out" })
            .set(tooltipRef.current, { innerText: "Final Step: OTP Authentication" })
            .to(cursorRef.current, { scale: 0.8, duration: 0.3 })
            .to({}, { duration: 1, onStart: () => setStep(5) });

        return () => tl.kill();
    }, [active, onComplete, setFormData]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none bg-black/40 overflow-hidden">
            {/* Ghost Cursor Layer */}
            <div 
                ref={cursorRef} 
                className="absolute top-0 left-0 opacity-0 flex flex-col items-start gap-2 z-50 pointer-events-none"
            >
                <MousePointer2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,1)] fill-emerald-400 stroke-black stroke-2" />
                <div ref={tooltipRef} className="bg-emerald-500 text-black text-xs font-black uppercase px-4 py-2 rounded-xl shadow-2xl scale-0 origin-left border-2 border-white/20 whitespace-nowrap">Initializing...</div>
            </div>

            {/* Status Info */}
            <div className="absolute top-10 w-full flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2 px-6 py-2 bg-[#131c31] border border-emerald-500/30 rounded-full animate-in slide-in-from-top duration-500">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Form Training</span>
                 </div>
            </div>
            
            {step === 100 && (
                <div className="absolute inset-0 bg-emerald-500/10 flex flex-col items-center justify-center animate-in fade-in duration-700">
                     <div className="bg-emerald-500 p-8 rounded-[3rem] shadow-[0_0_100px_rgba(16,185,129,0.5)] flex flex-col items-center">
                        <CheckCircle2 className="w-20 h-20 text-white" />
                        <h2 className="text-2xl font-black text-white mt-4 uppercase">Let's Start!</h2>
                     </div>
                </div>
            )}
        </div>
    );
}
