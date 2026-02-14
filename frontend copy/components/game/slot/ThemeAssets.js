// ThemeAssets.js
// Central Configuration for Slot Themes

const ThemeAssets = {
    royale: {
        name: 'Royale',
        background: 'bg-gradient-to-b from-gray-900 via-purple-900 to-black',
        primaryColor: 'text-yellow-400',
        symbols: ['👑', '💎', '♠️', '♥️', '♣️', '♦️', '🃏'],
        ui: {
            button: 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/50',
            panel: 'bg-black/80 border border-yellow-500/30 backdrop-blur-md'
        }
    },
    botanical: {
        name: 'Botanical',
        background: 'bg-gradient-to-b from-green-900 via-emerald-800 to-teal-900',
        primaryColor: 'text-emerald-300',
        symbols: ['🌿', '🌸', '🌼', '🍀', '🍎', '🍇', '🍄'],
        ui: {
            button: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/50',
            panel: 'bg-green-950/80 border border-emerald-500/30 backdrop-blur-md'
        }
    },
    gems: {
        name: 'Gems',
        background: 'bg-gradient-to-b from-blue-900 via-indigo-900 to-violet-900',
        primaryColor: 'text-cyan-300',
        symbols: ['💎', '🔷', '🟣', '🔶', '💠', '💍', '✨'],
        ui: {
            button: 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/50',
            panel: 'bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md'
        }
    },
    fruits: {
        name: 'Classic Fruits',
        background: 'bg-gradient-to-b from-red-900 via-orange-900 to-yellow-900',
        primaryColor: 'text-orange-300',
        symbols: ['🍒', '🍋', '🍉', '🍇', '🔔', '7️⃣', '⭐'],
        ui: {
            button: 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/50',
            panel: 'bg-red-950/80 border border-orange-500/30 backdrop-blur-md'
        }
    },
    classic: {
        name: 'Super Ace Classic',
        background: 'bg-gradient-to-b from-indigo-900 via-blue-900 to-slate-900',
        primaryColor: 'text-indigo-300',
        symbols: ['🎰', '7️⃣', '🃏', '♠️', '♥️', '♣️', '♦️'],
        ui: {
            button: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/50',
            panel: 'bg-indigo-950/80 border border-indigo-500/30 backdrop-blur-md'
        }
    },
    navy: {
        name: 'Super Ace Pro',
        background: 'bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617]', // Deepest Navy
        primaryColor: 'text-[#d4af37]', // Gold
        symbols: ['♠️', '♥️', '♣️', '♦️', '🃏', '👑', '💰'],
        ui: {
            button: 'bg-gradient-to-br from-[#d4af37] to-[#8a6d1f] text-[#3d1c10] shadow-[0_4px_0_0_#5c4915] active:shadow-none active:translate-y-[4px] border-2 border-[#d4af37]/50', // Physical Gold Button
            panel: 'bg-[#0f172a]/90 border-2 border-[#d4af37] shadow-[0_0_50px_rgba(212,175,55,0.15)]', // Gold Border Panel
            reel: 'border-[#d4af37]/30 bg-[#020617]/50' // Gold Reel Border
        }
    }
};

export default ThemeAssets;
