import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const ReferralTree = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReferrals();
    }, []);

    const fetchReferrals = async () => {
        try {
            const { data } = await api.get('/user/referrals'); // Ensure route matches backend
            setTreeData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading Tree...</div>;
    if (!treeData) return null;

    return (
        <div className="w-full bg-white/5 p-4 rounded-xl border border-white/10 mt-6 overflow-hidden relative">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🌳 Fruits of Labor (Referrals: {treeData.totalReferrals})
            </h3>

            <div className="relative min-h-[300px] flex justify-center items-end bg-gradient-to-t from-[#4a2c2a] to-transparent rounded-lg">
                {/* Tree Trunk */}
                <div className="w-8 h-24 bg-[#5D4037] absolute bottom-0 rounded-t-lg shadow-lg"></div>

                {/* Main Branch Canopy Area */}
                <div className="absolute bottom-16 w-full flex justify-center items-end flex-wrap px-8 pb-4 gap-4">

                    {treeData.totalReferrals === 0 && (
                        <div className="text-white/50 text-sm mb-8">No fruits yet. Share your link!</div>
                    )}

                    {treeData.children.map((child, index) => (
                        <div key={child.id} className="group relative flex flex-col items-center animate-bounce-slow" style={{ animationDelay: `${index * 0.1}s` }}>
                            {/* Stem */}
                            <div className="w-1 h-4 bg-green-700"></div>

                            {/* Fruit (Apple) */}
                            <div className="w-10 h-10 bg-red-500 rounded-full shadow-lg flex items-center justify-center border-b-4 border-red-700 cursor-pointer transform group-hover:scale-125 transition-all relative z-10">
                                <span className="text-xs font-bold text-white/90">
                                    {child.name.charAt(0)}
                                </span>
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-14 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-xs p-2 rounded w-32 text-center pointer-events-none z-20 shadow-xl border border-white/10">
                                <div className="font-bold text-yellow-400">{child.name}</div>
                                <div className="text-[10px] text-gray-300">Joined: {new Date(child.joinDate).toLocaleDateString()}</div>
                                <div className="text-[10px] text-green-300">{child.tier}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ReferralTree;
