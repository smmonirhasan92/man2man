'use client';
import { Ticket, Clock } from 'lucide-react';

export default function LotteryCard({ lottery, onBuy }) {
    return (
        <div className="bg-slate-800 p-4 rounded-xl border border-white/10 flex justify-between items-center hover:border-yellow-500/50 transition-colors group">
            <div>
                <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors">{lottery.name}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-slate-500" /> Draw: {new Date(lottery.drawDate).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-3">
                    <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded">Pool: {lottery.prizePool} NXS</p>
                    <p className="text-slate-400 text-xs">Entries: {lottery.tickets?.length || 0}</p>
                </div>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
                <span className="block text-2xl font-black text-white">{lottery.price} NXS</span>
                <button
                    onClick={() => onBuy(lottery._id)}
                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold px-5 py-2 rounded-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Ticket className="w-4 h-4" /> Buy Entry
                </button>
            </div>
        </div>
    );
}
