'use client';
import P2PCommandCenter from '../../../components/admin/P2PCommandCenter';

export default function P2PControlPage() {
    return (
        <div className="p-4 h-screen bg-black overflow-hidden">
            <h1 className="text-xl font-black text-slate-400 mb-4 tracking-tight uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Mission Control: P2P Security
            </h1>
            <P2PCommandCenter />
        </div>
    );
}
