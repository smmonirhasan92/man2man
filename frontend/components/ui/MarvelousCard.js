import { motion } from "framer-motion";
import { BotanicalAce } from "./BotanicalIcons";

export default function MarvelousCard({
    children,
    className = "",
    glow = false,
    delay = 0
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }} // Natural bounce easement
            className={`
                card-marvelous p-6 border-gold-leaf
                hover:scale-[1.02] transition-transform duration-500
                ${className}
            `}
        >
            {glow && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
                    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-radial from-[#d4af37]/20 to-transparent animate-spin-slow opacity-30"></div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 mix-blend-overlay"
                        style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                    ></div>
                </div>
            )}

            {/* Inner Content with Subtle Scale on Hover */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-[#d4af37] opacity-50"></div>
            <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-[#d4af37] opacity-50"></div>
            <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-[#d4af37] opacity-50"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-[#d4af37] opacity-50"></div>
        </motion.div>
    );
}
