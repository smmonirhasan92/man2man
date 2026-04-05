'use client';
import React from 'react';
import { motion } from 'framer-motion';

/**
 * FlyingNumber Component
 * Displays a floating number animation with customizable styles.
 */
export default function FlyingNumber({ value, delay = 0, x = 0, size = 1, color }) {
  // Generate a semi-random color if none provided
  const displayColor = color || `hsl(${(value * 137) % 360}, 80%, 70%)`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x, scale: 0.5 }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: [-20, -100, -150], 
        scale: [0.5, size * 1.5, size, 0.5] 
      }}
      transition={{ 
        duration: 2.5, 
        delay, 
        ease: 'easeOut' 
      }}
      className="absolute pointer-events-none font-black z-50 select-none flex items-center"
      style={{
        fontSize: `${size}rem`,
        color: displayColor,
        textShadow: `0 0 15px ${displayColor}`,
        left: `calc(50% + ${x}px)`,
        top: '50%'
      }}
    >
      <span className="text-white/40 mr-1 text-sm inline-block translate-y-[2px]">+</span>
      {value}
    </motion.div>
  );
}
