'use client';
import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, CheckCircle } from 'lucide-react';

export default function GenderSelectionModal({ user, onComplete }) {
    const [selectedGender, setSelectedGender] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!user || user.gender) return null;

    const handleSubmit = async () => {
        if (!selectedGender) return;
        setLoading(true);
        try {
            await api.post('/auth/set-gender', { gender: selectedGender });
            toast.success('Profile updated successfully!', { icon: '✨' });
            if (onComplete) onComplete(selectedGender);
        } catch (error) {
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-[#0b1221] border border-white/10 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                
                <div className="text-center mb-6 mt-2">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                        <User className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">Personalize Profile</h3>
                    <p className="text-slate-400 text-xs mt-1">Please select your gender to continue</p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {/* Male Option */}
                    <button 
                        onClick={() => setSelectedGender('male')}
                        className={`flex-1 flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all ${
                            selectedGender === 'male' 
                            ? 'bg-blue-500/20 border-blue-500 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                            : 'bg-[#131c31] border-white/10 hover:bg-white/5 opacity-70'
                        }`}
                    >
                        <svg className={`w-10 h-10 ${selectedGender === 'male' ? 'text-blue-400' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="10" cy="14" r="5" />
                            <line x1="13.5" y1="10.5" x2="19" y2="5" />
                            <polyline points="15 5 19 5 19 9" />
                        </svg>
                        <span className={`text-sm font-black uppercase tracking-widest ${selectedGender === 'male' ? 'text-blue-400' : 'text-slate-400'}`}>Male</span>
                        {selectedGender === 'male' && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-blue-500" />}
                    </button>

                    {/* Female Option */}
                    <button 
                        onClick={() => setSelectedGender('female')}
                        className={`flex-1 flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all ${
                            selectedGender === 'female' 
                            ? 'bg-pink-500/20 border-pink-500 scale-105 shadow-[0_0_20px_rgba(236,72,153,0.3)]' 
                            : 'bg-[#131c31] border-white/10 hover:bg-white/5 opacity-70'
                        }`}
                    >
                        <svg className={`w-10 h-10 ${selectedGender === 'female' ? 'text-pink-400' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="10" r="5" />
                            <line x1="12" y1="15" x2="12" y2="21" />
                            <line x1="9" y1="18" x2="15" y2="18" />
                        </svg>
                        <span className={`text-sm font-black uppercase tracking-widest ${selectedGender === 'female' ? 'text-pink-400' : 'text-slate-400'}`}>Female</span>
                        {selectedGender === 'female' && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-pink-500" />}
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedGender || loading}
                    className={`w-full py-3.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all ${
                        selectedGender && !loading
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg active:scale-95' 
                        : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                    }`}
                >
                    {loading ? 'Saving...' : 'Confirm Identity'}
                </button>
            </div>
        </div>
    );
}
