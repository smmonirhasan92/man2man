import React from 'react';

export default function USCIcon({ className = "w-5 h-5" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className={className}
            fill="none"
        >
            <defs>
                <linearGradient id="uscGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FDB931" />
                    <stop offset="100%" stopColor="#C06C02" />
                </linearGradient>
                <linearGradient id="uscNavy" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0a0f1e" />
                    <stop offset="100%" stopColor="#1e243d" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Outer Coin Rim */}
            <circle cx="50" cy="50" r="48" stroke="url(#uscGold)" strokeWidth="4" fill="url(#uscNavy)" />

            {/* Inner Ring */}
            <circle cx="50" cy="50" r="40" stroke="url(#uscGold)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 2" />

            {/* Stylized USC Text/Path */}
            <text
                x="50"
                y="62"
                fontSize="40"
                fontFamily="Impact, sans-serif"
                fontWeight="bold"
                fill="url(#uscGold)"
                textAnchor="middle"
                filter="url(#glow)"
                letterSpacing="-2"
            >
                USC
            </text>
        </svg>
    );
}
