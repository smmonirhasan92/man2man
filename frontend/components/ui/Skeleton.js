
import React from 'react';

const Skeleton = ({ className, height, width, variant = 'rect' }) => {
    // variants: rect, circle, text
    const shapeClass = variant === 'circle' ? 'rounded-full' : 'rounded-md';

    return (
        <div
            className={`bg-white/10 animate-pulse ${shapeClass} ${className}`}
            style={{ width, height }}
        />
    );
};

export default Skeleton;
