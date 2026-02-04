'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CardSkinContext = createContext();

export const SKINS = {
    CLASSIC: {
        id: 'classic',
        name: 'Classic Pro',
        bg: 'bg-white',
        border: 'border-slate-300',
        text: 'text-slate-900', // Black for spades/clubs
        textRed: 'text-red-600', // Red for hearts/diamonds
        accent: 'ring-slate-900',
        shadow: 'shadow-md',
        font: 'font-serif'
    },
    ROYAL: {
        id: 'royal',
        name: 'Royal Gold',
        bg: 'bg-[#062c1d]', // Deep Emerald
        border: 'border-[#d4af37]',
        text: 'text-[#d4af37]',
        accent: 'ring-[#d4af37]',
        shadow: 'shadow-xl shadow-[#d4af37]/20',
        font: 'font-sans'
    },
    NEON: {
        id: 'neon',
        name: 'Neon Future',
        bg: 'bg-black',
        border: 'border-cyan-500',
        text: 'text-cyan-400',
        accent: 'ring-fuchsia-500',
        shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]',
        font: 'font-mono'
    }
};

export function CardSkinProvider({ children }) {
    const [currentSkin, setCurrentSkin] = useState(SKINS.ROYAL);

    // Persist skin preference (optional, implementing simple state for now)

    const setSkinById = (id) => {
        const skin = Object.values(SKINS).find(s => s.id === id);
        if (skin) setCurrentSkin(skin);
    };

    return (
        <CardSkinContext.Provider value={{ currentSkin, setSkinById, SKINS }}>
            {children}
        </CardSkinContext.Provider>
    );
}

export const useCardSkin = () => useContext(CardSkinContext);
