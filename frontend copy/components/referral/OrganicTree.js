'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '../../services/api';

// Dynamically import Sketch to avoid SSR issues with p5
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
    ssr: false,
});

export default function OrganicTree() {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTree();
    }, []);

    const fetchTree = async () => {
        try {
            const { data } = await api.get('/referral/tree');
            // Data is flat list of descendants. We need to build hierarchy.
            // But wait, the user is the ROOT. 
            // We need the Current User's info too to be the TRUNK.
            // Let's mock the trunk as "Me" and attach L1s.

            // Reconstruct Hierarchy
            // 1. Group by parentCode
            const map = {};
            data.forEach(node => {
                if (!map[node.referredBy]) map[node.referredBy] = [];
                map[node.referredBy].push(node);
            });

            // We need the current user's referral code to find L1s
            // We can fetch profile or assume the "referredBy" of L1s matches MY code.
            // Actually, querying the API gave us descendants of ME.
            // So any node whose 'referredBy' is NOT in the 'data' list (or matches my code) is L1.
            // Let's find L1s: nodes whose parent is not in the list? No, parent is Me.
            // Let's simple use the depth. depth: 0 in the response is relative to the root?
            // $graphLookup depth: 0 means immediate children (L1).

            setTreeData({ raw: data, map });
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    let growth = 0;

    const setup = (p5, canvasParentRef) => {
        p5.createCanvas(window.innerWidth > 600 ? 600 : window.innerWidth - 40, 500).parent(canvasParentRef);
        p5.frameRate(30);
    };

    const draw = (p5) => {
        // Clear with transparent bg or theme bg
        p5.clear();
        p5.background(6, 44, 29, 20); // Fade effect (Forest Green tint)

        // Growth Animation
        if (growth < 100) growth += 0.5;

        p5.translate(p5.width / 2, p5.height); // Start at bottom middle

        // Draw Roots
        p5.push();
        p5.stroke(61, 28, 16, 150); // Mahogany Roots
        drawRoots(p5, 40);
        p5.pop();

        // Draw Tree
        const wind = p5.map(p5.noise(p5.frameCount * 0.005), 0, 1, -0.1, 0.1);
        drawBranch(p5, growth, 0, wind);
    };

    const drawRoots = (p5, len) => {
        p5.strokeWeight(p5.map(len, 0, 40, 1, 4));
        p5.line(0, 0, 0, len);
        p5.translate(0, len);
        if (len > 10) {
            let n = p5.noise(len) * 2;
            p5.push();
            p5.rotate(p5.PI / 4 + n);
            drawRoots(p5, len * 0.7);
            p5.pop();
            p5.push();
            p5.rotate(-p5.PI / 4 - n);
            drawRoots(p5, len * 0.7);
            p5.pop();
        }
    };

    const drawBranch = (p5, len, depth, wind) => {
        // Style
        p5.stroke(61, 28, 16); // Mahogany Trunk
        p5.strokeWeight(p5.map(len, 0, 100, 1, 8));

        // Curve (Visual DNA: Organic)
        const curve = p5.map(p5.noise(depth, p5.frameCount * 0.01), 0, 1, -0.2, 0.2);

        // Draw line (simple for now, curveVertex better for advanced but costly)
        p5.line(0, 0, 0, -len);
        p5.translate(0, -len);

        len *= 0.7; // Shrink

        if (len < 10 || depth > 5) {
            // Leaf / Fruit
            p5.noStroke();
            if (p5.random(1) < 0.3) {
                // Gold Fruit (Harvest)
                p5.fill(212, 175, 55, 200 + p5.sin(p5.frameCount * 0.1) * 50); // Pulsing Gold
                p5.circle(0, 0, 6);
            } else {
                // Leaf
                p5.fill(6, 44, 29, 180); // Forest Green
                p5.push();
                p5.rotate(wind * 5);
                p5.ellipse(0, 0, 10, 4);
                p5.pop();
            }
            return;
        }

        // Branching (Perlin influenced)
        const count = 2;
        for (let i = 0; i < count; i++) {
            p5.push();
            const angleNoise = p5.map(p5.noise(i, depth, p5.frameCount * 0.002), 0, 1, 0.3, 0.8);
            const dir = i === 0 ? -1 : 1;
            p5.rotate((angleNoise * dir) + wind + curve);
            drawBranch(p5, len, depth + 1, wind);
            p5.pop();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Overlay Info */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/5">
                <h3 className="text-[#d4af37] font-bold text-xs uppercase tracking-widest border-b border-[#d4af37] pb-1 mb-1">Living Empire</h3>
                <p className="text-slate-300 text-[10px]">Royal Botanical Network • {treeData.raw?.length || 0} Roots</p>
            </div>

            {loading ? (
                <div className="h-[500px] flex items-center text-slate-500 animate-pulse">Growing Tree...</div>
            ) : (
                <Sketch setup={setup} draw={draw} />
            )}
        </div>
    );
}
