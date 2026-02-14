'use client';
import { useState, useEffect } from 'react';

const MOCK_EVENTS = [
    "L2 member earned ৳500 commission! 🚀",
    "L5 just recruited a new agent! 👥",
    "L10 activity detected! Empire expanding... 🌍",
    "L1 member hit 'Recruiter' badge! 🎖️"
];

export default function EmpireTicker() {
    const [offset, setOffset] = useState(0);

    // Simple CSS animation via transform is smoother, 
    // but React state works for basic ticker too.
    // Let's use a pure CSS marquee approach for performance.

    return (
        <div className="bg-black/40 border-t border-white/5 py-2 overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap flex gap-8 text-xs font-mono text-emerald-400">
                {MOCK_EVENTS.map((evt, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {evt}
                    </span>
                ))}
                {/* Duplicate for seamless loop */}
                {MOCK_EVENTS.map((evt, i) => (
                    <span key={`dup-${i}`} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {evt}
                    </span>
                ))}
            </div>

            <style jsx>{`
                .animate-marquee {
                    animation: marquee 15s linear infinite;
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
