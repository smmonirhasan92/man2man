'use client';
import { useEffect, useRef } from 'react';

// Theme Constants (Hardcoded for Canvas performance)
const GOLD_PRIMARY = '#FFD700';
const GOLD_GLOW = 'rgba(255, 215, 0, 0.4)';
const GOLD_FADE = 'rgba(255, 215, 0, 0.05)';

export default function AviatorCanvas({ gameState, multiplier }) {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const planeImage = useRef(null);
    const particlesRef = useRef([]);

    // Load Assets Once
    useEffect(() => {
        const img = new Image();
        // Sleek Golden Fighter Jet SVG
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v0a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v0zm11 0l3.5-3.5a1 1 0 0 1 1.414 0l2 2a1 1 0 0 1 0 1.414l-6.914 6.914a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 0-1.414L13.5 12z'/%3E%3Cpath d='M14 12l4-8 1.5 1.5-3 6.5h-2.5z' fill='%23B39500'/%3E%3C/svg%3E";
        // Actually, let's use a simpler Paper Plane / Jet shape for cleaner look
        const planeSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <!-- Sleek Jet Design -->
            <path fill="${GOLD_PRIMARY}" d="M498.1 273.6l-180-160c-9.5-8.5-23.7-9.3-34-2l-32 24c-5.7 4.3-9.1 11.1-9.1 18.2v48H72c-13.3 0-24 10.7-24 24v32c0 13.3 10.7 24 24 24h171v48c0 7.1 3.4 13.9 9.1 18.2l32 24c10.3 7.3 24.5 6.5 34-2l180-160c8.6-7.6 8.6-20.8 0-28.4z"/>
        </svg>`;
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(planeSvg);

        img.onload = () => { planeImage.current = img; };

        // Start Animation Loop
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState, multiplier]);

    const animate = () => {
        if (!canvasRef.current) return;

        // Update Particles (Thrust effect)
        if (gameState === 'FLYING') {
            particlesRef.current.push({
                x: -30, y: 15, // Relative to plane tail
                vx: -4 - Math.random() * 3, vy: Math.random() * 2 - 1,
                alpha: 1,
                color: Math.random() > 0.5 ? GOLD_PRIMARY : '#FFF',
                size: Math.random() * 2 + 1
            });
        }

        // Move Particles
        if (particlesRef.current.length > 0) {
            particlesRef.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.04;
                if (p.alpha <= 0) particlesRef.current.splice(i, 1);
            });
        }

        draw();
        requestRef.current = requestAnimationFrame(animate);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear with transparent (handled by component background)
        ctx.clearRect(0, 0, width, height);

        // 1. Premium Grid (Faint)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = 0; y < height; y += 100) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();

        // 2. Logic based on State
        if (gameState === 'FLYING') {
            drawFlight(ctx, width, height);
        } else if (gameState === 'CRASHED') {
            drawCrash(ctx, width, height);
        } else {
            drawWaiting(ctx, width, height);
        }
    };

    const drawFlight = (ctx, width, height) => {
        // [FIX] Dynamic Logarithmic Scaling to keep plane visible
        // Base scale on current multiplier to keep it "chasing" the top right
        // But clamp it so it never exits the Viewport.

        let viewMax = 10; // Default view scale fits 10x
        if (multiplier > 10) viewMax = multiplier * 1.5; // Zoom out as we go higher

        // Logarithmic progress for current Multiplier against ViewMax
        const logM = Math.log10(multiplier);
        const logMax = Math.log10(viewMax);

        let progress = 0;
        if (logMax > 0) progress = logM / logMax;

        // Hard Clamp to 90% of screen to ensure visibility
        if (progress > 0.90) progress = 0.90;

        const safeW = width - 120; // More padding
        const safeH = height - 100;

        const planeX = 60 + (progress * safeW);
        const planeY = height - 60 - (progress * safeH);

        // Control point for smooth curve
        const cpX = 60 + (planeX - 60) * 0.6;

        // Gradient Fill (Gold to Transparent)
        const grad = ctx.createLinearGradient(0, height - 300, 0, height);
        grad.addColorStop(0, GOLD_GLOW);
        grad.addColorStop(1, GOLD_FADE);

        ctx.beginPath();
        ctx.moveTo(60, height - 60);
        ctx.quadraticCurveTo(cpX, height - 60, planeX, planeY);
        ctx.lineTo(planeX, height);
        ctx.lineTo(60, height);
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke Line (Glowing Gold)
        ctx.beginPath();
        ctx.moveTo(60, height - 60);
        ctx.quadraticCurveTo(cpX, height - 60, planeX, planeY);
        ctx.strokeStyle = GOLD_PRIMARY;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.shadowColor = GOLD_PRIMARY;
        ctx.shadowBlur = 25;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset

        // Draw Plane
        ctx.save();
        ctx.translate(planeX, planeY);

        // Tilt plane based on slope
        const angle = -15 - (progress * 25);
        ctx.rotate(angle * Math.PI / 180);

        if (planeImage.current) {
            const shake = multiplier > 100 ? (Math.random() - 0.5) * 3 : 0;
            ctx.shadowColor = GOLD_PRIMARY;
            ctx.shadowBlur = 15;
            ctx.drawImage(planeImage.current, -35, -35 + shake, 70, 70);
        }

        ctx.restore();

        // Particles
        particlesRef.current.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x + planeX, p.y + planeY, p.size, 0, Math.PI * 2); // Relative to plane pos, simplified logic needs world coords
            // Wait, previous logic was relative to plane but translated. 
            // Let's use world coords for particles to trail correctly
        });

        // Correct Particle Drawing (Batching)
        // Actually, my particle push logic (x:-30 relative) implies they are child of plane 
        // But for a trail they should be left behind in world space.
        // Let's simplified: Draw flame at tail directly
        ctx.save();
        ctx.translate(planeX, planeY);
        ctx.rotate(angle * Math.PI / 180);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = `rgba(255, 100, 0, ${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(-40 - Math.random() * 10, 0 + (Math.random() - 0.5) * 5, 10 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();


        ctx.globalAlpha = 1.0;
    };

    const drawCrash = (ctx, width, height) => {
        // Red Pulse Overlay
        ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2, height / 2);

        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 30;

        ctx.fillStyle = '#EF4444';
        ctx.font = '900 64px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("FLEW AWAY", 0, -20);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 32px Inter, sans-serif';
        ctx.fillText(`@ ${Number(multiplier).toFixed(2)}x`, 0, 40);

        ctx.restore();
    };

    const drawWaiting = (ctx, width, height) => {
        const cx = width / 2;
        const cy = height / 2;

        // Premium Loader Ring
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        const time = Date.now() / 1000;
        ctx.arc(cx, cy, 40, time, time + 4); // Rotating arc
        ctx.strokeStyle = GOLD_PRIMARY;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = GOLD_PRIMARY;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("NEXT ROUND", cx, cy + 70);
    };

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full object-contain rounded-xl"
        />
    );
}
