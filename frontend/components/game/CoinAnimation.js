import React from 'react';

const CoinAnimation = ({ gameState, coinSide }) => (
    <div className="relative mb-10 perspective-[1200px]">
        <style jsx>{`
            .transform-style-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            @keyframes coin-spin {
                0% { transform: rotateY(0) scale(1); }
                50% { transform: rotateY(1800deg) scale(1.1); }
                100% { transform: rotateY(3600deg) scale(1); }
            }
            .animate-coin-spin { animation: coin-spin 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        `}</style>

        <div className={`w-64 h-64 relative transform-style-3d transition-transform duration-700 ${gameState === 'flipping' ? 'animate-coin-spin' : ''}`}>
            {/* Front Face (Head) */}
            <div className={`absolute inset-0 backface-hidden rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.4)] border-[8px] border-[#FFD700] bg-gradient-to-br from-yellow-100 to-yellow-600 overflow-hidden ring-4 ring-yellow-500/30`}
                style={{ transform: itemRotation(coinSide, 'head') }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent)] z-20"></div>
                <img src="/uploads/head_v2.png" alt="Head" className="w-full h-full object-cover rounded-full mix-blend-multiply" />
            </div>

            {/* Back Face (Tail) */}
            <div className={`absolute inset-0 backface-hidden rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.4)] border-[8px] border-[#C0C0C0] bg-gradient-to-br from-gray-100 to-gray-500 overflow-hidden ring-4 ring-gray-400/30`}
                style={{ transform: itemRotation(coinSide, 'tail') }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent)] z-20"></div>
                <img src="/uploads/tail_v2.png" alt="Tail" className="w-full h-full object-cover rounded-full mix-blend-multiply" />
            </div>
        </div>
    </div>
);

function itemRotation(side, face) {
    if (side === 'head') {
        return face === 'head' ? 'rotateY(0deg)' : 'rotateY(180deg)';
    } else {
        return face === 'head' ? 'rotateY(180deg)' : 'rotateY(0deg)';
    }
}

export default CoinAnimation;
