'use client';
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Download, Share2, Layers, Crown } from 'lucide-react';

export default function ShareCard({ user, stats }) {
    const cardRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const referralLink = `https://man2man.com/register?ref=${user.referralCode}`;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setLoading(true);
        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true });
            const link = document.createElement('a');
            link.download = `my-empire-${user.username}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* The Card to Capture */}
            <div
                ref={cardRef}
                className="relative w-[320px] h-[500px] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl mx-auto"
            >
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-[50px] translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/20 rounded-full blur-[40px] -translate-x-10 translate-y-10"></div>

                {/* Content */}
                <div className="p-6 h-full flex flex-col justify-between relative z-10">

                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-4">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-amber-200 uppercase tracking-widest">Empire Builder</span>
                        </div>
                        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 leading-tight">
                            JOIN MY<br />NETWORK
                        </h1>
                    </div>

                    {/* Stats Circle */}
                    <div className="relative w-40 h-40 mx-auto my-4">
                        <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-2 border-2 border-dashed border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{stats.totalReferrals || 0}</span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">Members</span>
                        </div>
                    </div>

                    {/* Earnings Tag */}
                    <div className="bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-slate-400 mb-1">Total Earnings</p>
                        <p className="text-xl font-bold text-emerald-400">৳{stats.totalEarnings?.toFixed(2) || '0.00'}</p>
                    </div>

                    {/* Footer / QR */}
                    <div className="bg-white p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Scan to Join</p>
                            <p className="text-sm font-black text-slate-900">@{user.username}</p>
                        </div>
                        <QRCodeSVG value={referralLink} size={48} level="M" />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="text-center">
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className="flex items-center gap-2 mx-auto bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-full font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                    {loading ? 'Generating...' : (
                        <>
                            <Download className="w-5 h-5" /> Download Card
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
