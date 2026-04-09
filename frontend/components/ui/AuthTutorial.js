'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { MousePointer2, Info, CheckCircle2 } from 'lucide-react';

/**
 * [PRO MASTERCLASS] Human-Like Ghost Interaction Tutorial
 * Simulates a real user filling the form at a natural pace.
 */
export default function AuthTutorial({ active, onComplete }) {
    const cursorRef = useRef(null);
    const tooltipRef = useRef(null);
    const [mockData, setMockData] = useState({ name: '', phone: '', pass: '', ref: '', otp: '' });
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!active) return;

        const tl = gsap.timeline({
            onComplete: () => {
                setStep(100);
                setTimeout(onComplete, 3000);
            }
        });

        // Setup: Reset states
        setMockData({ name: '', phone: '', pass: '', ref: '', otp: '' });
        setStep(1);

        // --- STEP 1: IDENTITY NAME ---
        tl.to(cursorRef.current, { opacity: 1, x: 80, y: 150, duration: 1.5, ease: "power2.out" })
          .to(tooltipRef.current, { opacity: 1, scale: 1, duration: 0.3 })
          .set(tooltipRef.current, { innerText: "Step 1: Type your Full Name" })
          .to(cursorRef.current, { scale: 0.7, duration: 0.2, yoyo: true, repeat: 1 }) // Click
          .to({}, { duration: 0.5, onUpdate: () => setMockData(p => ({...p, name: "S.M. Monir Hasan"})) }) // Simulate Type
          
          // --- STEP 2: PHONE NUMBER ---
          .to(cursorRef.current, { x: 180, y: 240, duration: 1, ease: "power1.inOut" })
          .set(tooltipRef.current, { innerText: "Step 2: Enter Authorized Phone Number" })
          .to(cursorRef.current, { scale: 0.7, duration: 0.2, yoyo: true, repeat: 1 })
          .to({}, { duration: 0.8, onUpdate: () => setMockData(p => ({...p, phone: "017XXXXXXXX"})) })

          // --- STEP 3: PASSWORD ---
          .to(cursorRef.current, { x: 80, y: 340, duration: 1, ease: "power1.inOut" })
          .set(tooltipRef.current, { innerText: "Step 3: Create a Secure Password" })
          .to(cursorRef.current, { scale: 0.7, duration: 0.2, yoyo: true, repeat: 1 })
          .to({}, { duration: 0.6, onUpdate: () => setMockData(p => ({...p, pass: "••••••••"})) })

          // --- STEP 4: REFERRAL (OPTIONAL) ---
          .to(cursorRef.current, { x: 80, y: 440, duration: 1, ease: "power1.inOut" })
          .set(tooltipRef.current, { innerText: "Step 4: Referral Code (Optional)" })
          .to(cursorRef.current, { scale: 0.7, duration: 0.2, yoyo: true, repeat: 1 })
          .to({}, { duration: 0.5, onUpdate: () => setMockData(p => ({...p, ref: "USA789"})) })

          // --- STEP 5: OTP VERIFICATION ---
          .to(cursorRef.current, { x: 250, y: 530, duration: 1.2, ease: "power2.out" })
          .set(tooltipRef.current, { innerText: "Step 5: Click 'GET CODE' for OTP" })
          .to(cursorRef.current, { scale: 0.8, duration: 0.3 })
          .to('.tutorial-btn-glow', { opacity: 1, scale: 1.2, duration: 0.4, yoyo: true, repeat: 3 })
          .to({}, { duration: 1.5, onStart: () => setStep(5) }) // Show OTP Box
          .to({}, { duration: 1, onUpdate: () => setMockData(p => ({...p, otp: "1234"})) })

          // --- FINAL: SUBMIT ---
          .to(cursorRef.current, { x: 150, y: 640, duration: 1, ease: "back.out(2)" })
          .set(tooltipRef.current, { innerText: "Finalize & Enter Dashboard" })
          .to('.tutorial-target-button', { scale: 1.05, filter: "brightness(1.5)", duration: 0.5, repeat: -1, yoyo: true });

        return () => tl.kill();
    }, [active, onComplete]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none bg-black/60 backdrop-blur-md overflow-hidden flex items-center justify-center p-4">
            {/* The "Simulated" Form UI (Dynamic overlay) */}
            <div className="w-full max-w-lg relative bg-[#0b1221] border-2 border-emerald-500/50 rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(16,185,129,0.3)] animate-in zoom-in duration-500">
                <div className="space-y-6 opacity-70">
                    <div className="h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 font-mono text-emerald-400 text-sm">{mockData.name || "Full Name"}</div>
                    <div className="h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 font-mono text-emerald-400 text-sm">{mockData.phone || "Phone Number"}</div>
                    <div className="h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 font-mono text-emerald-400 text-sm">{mockData.pass || "Password"}</div>
                    <div className="h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 font-mono text-emerald-400 text-[10px] opacity-50">{mockData.ref || "Referral (Optional)"}</div>
                    
                    <div className={`p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center transition-all ${step >= 5 ? 'opacity-100' : 'opacity-0 scale-95'}`}>
                         <div className="text-xl tracking-[0.5em] font-black text-white">{mockData.otp || "••••"}</div>
                         <div className="text-[10px] font-bold text-emerald-400">VERIFYING...</div>
                    </div>

                    <div className="h-14 bg-emerald-600 rounded-2xl tutorial-target-button flex items-center justify-center font-black text-white uppercase tracking-widest text-sm">Finalize Registration</div>
                </div>

                {/* Ghost Cursor Layer */}
                <div 
                    ref={cursorRef} 
                    className="absolute top-0 left-0 opacity-0 flex flex-col items-start gap-2 z-50 pointer-events-none"
                    style={{ transform: 'translate(0,0)' }}
                >
                    <MousePointer2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,1)] fill-emerald-400 stroke-black stroke-2" />
                    <div ref={tooltipRef} className="bg-emerald-500 text-black text-[11px] font-black uppercase px-4 py-2 rounded-xl shadow-2xl scale-0 origin-left border-2 border-white/20">Initializing...</div>
                </div>

                {/* [GSAP GLOW HINT] */}
                <div className="tutorial-btn-glow absolute top-[515px] right-12 w-20 h-8 bg-emerald-400/20 blur-xl opacity-0"></div>
            </div>

            {/* Exit Guide Info */}
            <div className="absolute top-10 flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2 px-6 py-2 bg-[#131c31] border border-emerald-500/30 rounded-full">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Training Mode</span>
                 </div>
                 <p className="text-slate-400 text-xs italic">Observe the simulated interaction carefully.</p>
            </div>
            
            {step === 100 && (
                <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center animate-in fade-in duration-700">
                     <CheckCircle2 className="w-20 h-20 text-white animate-bounce" />
                     <h2 className="text-2xl font-black text-white mt-4 uppercase">Ready to Start!</h2>
                </div>
            )}
        </div>
    );
}
