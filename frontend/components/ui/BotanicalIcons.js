import { motion } from "framer-motion";

export const BotanicalAce = ({ className }) => (
    <motion.svg
        viewBox="0 0 100 140"
        className={className}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
    >
        {/* Abstract Hand-Drawn Spade/Leaf Shape */}
        <path d="M50 10 C 20 50, 10 90, 50 130 C 90 90, 80 50, 50 10 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 10 C 50 50, 50 90, 50 130" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        {/* Veins */}
        <path d="M50 80 Q 30 70 20 60" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M50 80 Q 70 70 80 60" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
    </motion.svg>
);

export const BotanicalKing = ({ className }) => (
    <motion.svg
        viewBox="0 0 100 140"
        className={className}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring" }}
    >
        {/* Crown with Leaves */}
        <path d="M20 100 L 20 60 L 40 80 L 50 40 L 60 80 L 80 60 L 80 100 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="20" cy="55" r="3" fill="currentColor" />
        <circle cx="50" cy="35" r="3" fill="currentColor" />
        <circle cx="80" cy="55" r="3" fill="currentColor" />
        {/* Base */}
        <rect x="20" y="100" width="60" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
    </motion.svg>
);

export const BotanicalQueen = ({ className }) => (
    <motion.svg
        viewBox="0 0 100 140"
        className={className}
        initial={{ rotate: -10, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
    >
        {/* Tiara/Flower Shape */}
        <path d="M25 100 Q 10 60 30 50 Q 50 20 70 50 Q 90 60 75 100 Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="40" r="5" fill="none" stroke="currentColor" />
        <path d="M50 45 L 50 100" stroke="currentColor" strokeWidth="1" />
        <path d="M50 60 Q 30 70 30 80" stroke="currentColor" strokeWidth="1" />
        <path d="M50 60 Q 70 70 70 80" stroke="currentColor" strokeWidth="1" />
    </motion.svg>
);
