'use client';
import { useState } from 'react';
import { Zap, Clock, ShieldCheck } from 'lucide-react';

export default function WithdrawalTierUI({ selectedTier, onSelect }) {

    const tiers = [
        {
            id: 'express',
            name: 'Express',
            fee: '5%',
            time: 'Instant - 1 Hour',
            icon: <Zap className="w-5 h-5 text-yellow-400" />,
            color: 'border-yellow-400/50 bg-yellow-400/10',
            desc: 'Priority Processing'
        },
        {
            id: 'standard',
            name: 'Standard',
            fee: '2%',
            time: '24 - 48 Hours',
            icon: <Clock className="w-5 h-5 text-slate-400" />,
            color: 'border-white/10 bg-white/5',
            desc: 'Regular Processing'
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            {tiers.map((tier) => (
                <div
                    key={tier.id}
                    onClick={() => onSelect(tier.id)}
                    className={`
                        relative p-3 rounded-xl border cursor-pointer transition-all duration-300
                        ${selectedTier === tier.id ? tier.color + ' shadow-lg scale-[1.02]' : 'border-white/5 bg-slate-900/50 hover:bg-white/5'}
                    `}
                >
                    {selectedTier === tier.id && (
                        <div className="absolute top-2 right-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                    )}

                    <div className="mb-2">{tier.icon}</div>
                    <h3 className="font-bold text-sm text-white">{tier.name}</h3>
                    <p className="text-[10px] text-slate-400 mb-2">{tier.desc}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-white/10 pt-2">
                        <span className="text-slate-500">Fee: {tier.fee}</span>
                        <span className="text-slate-300">{tier.time}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
