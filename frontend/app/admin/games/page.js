'use client';
import GameControlPanel from '../../../components/admin/GameControlPanel';

export default function AdminGamesPage() {
    return (
        <div className="p-4 pb-20 space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Game Management</h1>
            <p className="text-slate-500">Configure house edge, win rates, and game status.</p>

            <GameControlPanel />
        </div>
    );
}
