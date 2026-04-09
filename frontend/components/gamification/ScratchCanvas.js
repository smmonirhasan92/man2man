'use client';
import React, { useRef, useEffect, useState } from 'react';

/**
 * ScratchCanvas Component - Smart Reveal Edition
 * Provides a tactile scratch-off effect with particles and one-swipe logic.
 */
export default function ScratchCanvas({ 
    width = 300, 
    height = 300, 
    brushSize = 50, 
    onComplete,
    onScratch,
    overlayColor = '#C0C0C0', 
    accentColor = '#FFD700',
    isReady = true
}) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [particles, setParticles] = useState([]);
    
    const lastPosRef = useRef(null);
    const totalSwipeDistRef = useRef(0);
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        ctx.fillStyle = overlayColor;
        ctx.fillRect(0, 0, width, height);

        // Texture Noise
        for (let i = 0; i < 400; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.05})`;
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }

        // Particle Loop
        let animationFrame;
        const animate = () => {
            if (isFinished) return;
            
            let changed = false;
            const updated = particlesRef.current.filter(p => {
                if (p.life > 0) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.04;
                    changed = true;
                    return true;
                }
                return false;
            });

            if (changed || particlesRef.current.length > 0) {
                particlesRef.current = updated;
                setParticles([...updated]);
            }
            animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [width, height, overlayColor, isFinished]);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const createParticles = (x, y, count = 4) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                x, y,
                vx: (Math.random() - 0.5) * (count > 5 ? 12 : 5),
                vy: (Math.random() - 0.5) * (count > 5 ? 12 : 5),
                life: 1.2,
                color: Math.random() > 0.5 ? accentColor : (Math.random() > 0.5 ? '#FFFAFA' : '#FFDF00')
            });
        }
    };

    const scratch = (e) => {
        if (!isDrawing || isFinished || !isReady) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const pos = getPos(e);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushSize, 0, Math.PI * 2);
        ctx.fill();

        // One-Swipe Logic
        if (lastPosRef.current) {
            const dx = pos.x - lastPosRef.current.x;
            const dy = pos.y - lastPosRef.current.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            totalSwipeDistRef.current += dist;
            
            if (totalSwipeDistRef.current > 15 && !isFinished) {
               finishReveal();
            }
        }
        createParticles(pos.x, pos.y);
        lastPosRef.current = pos;

        if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(5);
        if (onScratch) onScratch();
    };

    const finishReveal = () => {
        if (isFinished) return;
        setIsFinished(true);
        const canvas = canvasRef.current;
        canvas.style.transition = 'filter 0.5s ease, opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        canvas.style.opacity = '0';
        canvas.style.transform = 'scale(1.15) translateY(-10px) rotate(3deg)';
        canvas.style.filter = 'brightness(2) blur(4px)'; // Premium flash explosion effect
        
        // Final particle burst
        createParticles(width/2, height/2, 25);

        if (onComplete) onComplete();
    };

    return (
        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-auto">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={(e) => { setIsDrawing(true); lastPosRef.current = getPos(e); totalSwipeDistRef.current = 0; }}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onMouseMove={scratch}
                onTouchStart={(e) => { setIsDrawing(true); lastPosRef.current = getPos(e); totalSwipeDistRef.current = 0; }}
                onTouchEnd={() => setIsDrawing(false)}
                onTouchMove={scratch}
                className="absolute inset-0 cursor-crosshair touch-none select-none"
                style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
            />
            {/* Dust Particles SVG Overlay */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
                {particles.map((p, i) => (
                    <circle 
                        key={i} 
                        cx={p.x} 
                        cy={p.y} 
                        r={Math.random() * 2 + 1} 
                        fill={p.color} 
                        opacity={p.life} 
                    />
                ))}
            </svg>
        </div>
    );
}
