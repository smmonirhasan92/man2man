'use client';
import { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function RatingModal({ tradeId, onClose, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Please select a star rating");

        setLoading(true);
        try {
            await api.post(`/p2p/trade/${tradeId}/rate`, { rating });
            toast.success("Rating Submitted!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to submit rating");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1e2538] border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center relative animate-in zoom-in-95 duration-200 shadow-2xl">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
                >
                    <X size={20} />
                </button>

                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Star className="w-8 h-8 text-white fill-current" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Build Trust</h2>
                <p className="text-slate-400 text-sm mb-6">How was your trading experience?</p>

                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-1 transition-transform hover:scale-110 focus:outline-none ${rating >= star ? 'text-yellow-400' : 'text-slate-600'
                                }`}
                        >
                            <Star
                                size={32}
                                className={rating >= star ? 'fill-current' : ''}
                                strokeWidth={1.5}
                            />
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || rating === 0}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
}
