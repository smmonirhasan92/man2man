'use client';
import { useEffect, useState, useRef } from 'react';

export default function RollingCounter({ value, prefix = '৳', duration = 1000 }) {
    const [displayValue, setDisplayValue] = useState(value);
    const startValue = useRef(value);
    const startTime = useRef(null);

    useEffect(() => {
        startValue.current = displayValue;
        startTime.current = null;

        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime.current) startTime.current = timestamp;
            const progress = timestamp - startTime.current;
            const progressRatio = Math.min(progress / duration, 1);

            // Ease Out Quart
            const ease = 1 - Math.pow(1 - progressRatio, 4);

            const current = startValue.current + (value - startValue.current) * ease;
            setDisplayValue(current);

            if (progressRatio < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span className="font-mono tabular-nums">
            {prefix}{displayValue.toFixed(2)}
        </span>
    );
}
