'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function AdminLotteryTemplates() {
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const TEMPLATES = [
        { id: '1M', label: '1 MIN FLASH', duration: '1 Min', price: '15 TK', color: 'red' },
        { id: '5M', label: '5 MIN QUICK', duration: '5 Mins', price: '25 TK', color: 'orange' },
        { id: '15M', label: '15 MIN POWER', duration: '15 Mins', price: '30 TK', color: 'yellow' },
        { id: '30M', label: '30 MIN SUPER', duration: '30 Mins', price: '35 TK', color: 'lime' },
        { id: '60M', label: 'HOURLY JACKPOT', duration: '60 Mins', price: '45 TK', color: 'green' },
        { id: '3H', label: '3 HOUR MEGA', duration: '3 Hours', price: '55 TK', color: 'emerald' },
        { id: '6H', label: '6 HOUR GIGA', duration: '6 Hours', price: '75 TK', color: 'teal' },
        { id: '12H', label: '12 HOUR ROYAL', duration: '12 Hours', price: '85 TK', color: 'cyan' },
        { id: '24H', label: 'DAILY GRAND', duration: '24 Hours', price: '$1 (120 TK)', color: 'blue' },
        { id: '7D', label: 'WEEKLY WEALTH', duration: '7 Days', price: '$2 (240 TK)', color: 'purple' },
    ];

    const deployTemplate = (t) => {
        setConfirmModal({
            isOpen: true,
            title: `Deploy ${t.label}?`,
            message: `Price: ${t.price} \nBuffer: 20%`,
            confirmText: 'Deploy',
            onConfirm: async () => {
                try {
                    await api.post('/lottery/admin/create', {
                        tier: t.id,
                        duration: t.duration,
                        ticketPrice: parseInt(t.price.replace(/\D/g, '')) || 20, // Simple parse
                        profitBuffer: 20,
                        autoRestart: true
                    });
                    toast.success('Template Deployed! (Check Active Slots)');
                    setConfirmModal({ isOpen: false });
                } catch (e) {
                    toast.error('Error Deployment');
                }
            }
        });
    };

    useEffect(() => { }, []);

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="text-blue-500" /> Automation Templates
            </h3>
            <p className="text-slate-500 text-xs mb-4">One-Click Deploy & Auto-Restart Config (Default 20% Buffer)</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {TEMPLATES.map(t => (
                    <div key={t.id} className="bg-black/40 p-3 rounded-lg border border-white/5 relative overflow-hidden group hover:border-white/20 transition">
                        <div className={`absolute top-0 left-0 w-1 h-full bg-${t.color}-500`}></div>

                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-white text-[10px] uppercase truncate pr-1">{t.label}</h4>
                            <span className={`text-[8px] px-1 rounded bg-${t.color}-500/20 text-${t.color}-400 border border-${t.color}-500/30`}>{t.id}</span>
                        </div>

                        <div className="space-y-1 text-[10px] text-slate-400">
                            <div className="flex justify-between">
                                <span>Duration</span>
                                <span className="text-white">{t.duration}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Entry</span>
                                <span className="text-yellow-500 font-mono">{t.price}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => deployTemplate(t)}
                            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-1.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg active:scale-95 transition"
                        >
                            Deploy Now
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded text-xs text-yellow-200">
                ⚠ Note: Automation requires the backend scheduler loop to be running.
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}
