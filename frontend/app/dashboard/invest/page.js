'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const StakingDashboard = dynamic(() => import('../../../components/staking/StakingDashboard'), { 
    ssr: false,
    loading: () => <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
    </div>
});

export default function InvestPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
        } catch (e) {
            console.error(e);
            toast.error("Please login first");
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 pb-24">
            {/* Header section can match your existing dashboard's design token */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StakingDashboard userWallet={user.wallet} />
            </div>
        </div>
    );
}
