'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import { ArrowLeft, Globe, Cpu, Wifi, Shield, CheckCircle, Smartphone, Zap, Server, Radio, Lock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import BannerSlider from '../../components/BannerSlider';
import DisclaimerModal from '../../components/DisclaimerModal';

export default function GlobalMarketplace() {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    // Animation States
    const [provisioning, setProvisioning] = useState(false);
    const [provisioningType, setProvisioningType] = useState('server'); // 'server' or 'number'
    const [targetCountry, setTargetCountry] = useState("USA");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansRes, userData] = await Promise.all([
                api.get('/plan'),
                authService.getCurrentUser()
            ]);
            setPlans(plansRes.data.plans || plansRes.data);
            setUser(userData);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load marketplace.");
        } finally {
            setLoading(false);
        }
    };

    const initiatePurchase = (plan) => {
        if (processing || provisioning) return;

        // 1. Determine Logic
        const isNumber = plan.type === 'number' || plan.name.toLowerCase().includes('number') || plan.name.toLowerCase().includes('sim');
        const country = plan.name.includes("Canada") ? "Canada" : plan.name.includes("Ireland") ? "Ireland" : "USA";

        setTargetCountry(country);
        setProvisioningType(isNumber ? 'number' : 'server');

        // 2. Pricing & Validation
        const price = plan.price || 500.00; // Use plan price
        const totalBalance = parseFloat(user?.wallet_balance || 0) + parseFloat(user?.purchase_balance || 0);

        if (totalBalance < price) {
            toast.error(`Insufficient Funds. Required: $${(price / 120).toFixed(2)} / ৳${price}`);
            router.push('/p2p');
            return;
        }

        // 3. Open Modal
        setSelectedPlan(plan);
        setShowModal(true);
    };

    const handleAcceptPurchase = async () => {
        setShowModal(false);
        const plan = selectedPlan;
        if (!plan) return;

        // 1. Start Animation Immediately
        setProcessing(plan._id || plan.id);
        setProvisioning(true);
        const isNumber = plan.type === 'number' || plan.name.toLowerCase().includes('number');
        setProvisioningType(isNumber ? 'number' : 'server');

        try {
            // 2. Wait for Animation (4 Seconds Strict)
            await new Promise(r => setTimeout(r, 4000));

            // 3. Execute Purchase
            const res = await api.post(`/plan/purchase/${plan._id || plan.id}`);

            if (res.data.success || res.status === 200) {
                // Success
                const purchasedPlan = res.data.plan;
                localStorage.setItem('active_server_id', purchasedPlan._id || purchasedPlan.id);
                localStorage.setItem('active_server_name', plan.name);
                localStorage.setItem('active_server_phone', purchasedPlan.syntheticPhone || 'Verifying +1 Identity...');

                await authService.refreshUser();

                toast.success("DEPLOYMENT COMPLETE", {
                    icon: <Shield className="w-5 h-5 text-emerald-400" />,
                    style: {
                        background: '#0a192f',
                        color: '#fff',
                        border: '1px solid #10b981',
                        fontWeight: 'bold'
                    }
                });

                router.push('/tasks');
            }
        } catch (err) {
            console.error(err);
            setProvisioning(false); // Stop animation on error
            toast.error(err.response?.data?.message || "Deployment Failed");
        } finally {
            setProcessing(null);
            // setProvisioning(false); // Don't turn off if redirecting, to prevent flash
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Globe className="w-12 h-12 text-blue-500 animate-pulse" />
                <p className="text-blue-400 font-mono text-xs tracking-widest uppercase">Initializing Global Uplink...</p>
            </div>
        </div>
    );

    const validPlans = plans.filter(p => p.type === 'server' || p.type === 'number' || p.type === 'vip');

    return (
        <div className="min-h-screen bg-[#0a192f] text-white font-sans pb-32 relative overflow-hidden flex justify-center">

            {/* STRICT MOBILE CONTAINER */}
            <div className="w-full max-w-[450px] relative min-h-screen bg-[#0a192f] shadow-2xl border-x border-white/5">

                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(17,34,64,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(17,34,64,0.8)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none"></div>

                {/* Header */}
                <header className="px-6 pt-8 pb-4 relative z-10 bg-[#0a192f]/80 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                            <Link href="/dashboard" className="mr-2 p-1.5 bg-white/10 rounded-full hover:bg-white/20 text-white">
                                <ArrowLeft size={16} />
                            </Link>
                            <Globe className="w-5 h-5 text-blue-500" />
                            GLOBAL <span className="text-blue-500">INFRASTRUCTURE</span>
                        </h1>
                        <div className="px-2 py-0.5 bg-emerald-900/30 border border-emerald-500/30 rounded text-[9px] font-bold text-emerald-400 flex items-center gap-1.5 animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            ONLINE
                        </div>
                    </div>
                </header>

                <div className="px-4 mt-4">
                    <BannerSlider />
                </div>

                {/* Main Content: PRICE TABLES */}
                <main className="px-4 space-y-6 relative z-10 mt-6">

                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available Nodes</h2>
                        <span className="text-[10px] text-blue-400 font-mono">SECURE UPLINK v4.2</span>
                    </div>

                    <div className="space-y-6">
                        {validPlans.map(plan => {
                            const isIreland = plan.name.includes("Ireland");
                            const isUSA = plan.name.includes("USA") || plan.name.includes("United");
                            const isUK = plan.name.includes("UK");

                            // Visual Logic
                            const accentColor = isIreland ? 'emerald' : isUK ? 'purple' : 'blue';
                            const borderColor = isIreland ? 'border-emerald-500/30' : isUK ? 'border-purple-500/30' : 'border-blue-500/30';

                            // Pricing Display
                            // USD First Logic
                            const monthlyCostBDT = plan.unlock_price || plan.price || 500;
                            const usdPrice = plan.price_usd || (monthlyCostBDT / 120).toFixed(2);

                            // [35-DAY CYCLE LOGIC]
                            const cycleDays = plan.validity_days || 35;
                            const roiLow = 1.5;
                            const roiHigh = 1.8;

                            // Convert Revenue to USD
                            const estRevenueLowUSD = (parseFloat(usdPrice) * roiLow).toFixed(2);
                            const estRevenueHighUSD = (parseFloat(usdPrice) * roiHigh).toFixed(2);

                            // Tier Logic for Tasks
                            const taskCount = plan.daily_limit || (monthlyCostBDT >= 10000 ? 7 : monthlyCostBDT >= 5000 ? 10 : 15);
                            const planTypeLabel = plan.type === 'vip' ? 'VIP NODE' : (isIreland ? 'PREMIUM' : isUK ? 'ENTERPRISE' : 'STANDARD');

                            return (
                                <div key={plan.id} className={`relative bg-[#112240] rounded-xl overflow-hidden shadow-2xl transition-all hover:scale-[1.02] border ${borderColor}`}>

                                    {/* Top Label */}
                                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-${accentColor}-500 to-transparent`}></div>
                                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white bg-${accentColor}-600/80 backdrop-blur`}>
                                            {planTypeLabel}
                                        </div>
                                        <div className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/50 border border-emerald-500/30">
                                            PROFIT SHARE: 70%
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col items-center text-center">

                                        {/* Icon */}
                                        <div className={`w-16 h-16 rounded-full bg-[#0a192f] border-2 border-${accentColor}-500/20 flex items-center justify-center mb-4 relative shadow-lg shadow-${accentColor}-900/20`}>
                                            {plan.type === 'number' ? (
                                                <Smartphone className={`w-8 h-8 text-${accentColor}-400`} />
                                            ) : (
                                                <Server className={`w-8 h-8 text-${accentColor}-400`} />
                                            )}
                                            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0a192f] flex items-center justify-center border border-white/10">
                                                <img
                                                    src={isIreland ? "https://flagcdn.com/w80/ie.png" : isUK ? "https://flagcdn.com/w80/gb.png" : "https://flagcdn.com/w80/us.png"}
                                                    className="w-3.5 h-3.5 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <h3 className="text-base font-bold text-white mb-1 uppercase tracking-wide">{plan.name}</h3>

                                        {/* USD Main Price */}
                                        <div className="flex flex-col items-center mb-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-white">${usdPrice}</span>
                                                <span className="text-sm text-slate-500 font-medium">USD</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full mt-1">{cycleDays} Day Cycle</span>
                                        </div>

                                        {/* KEY METRICS GRID (USD) */}
                                        <div className="grid grid-cols-2 gap-2 w-full mb-6">
                                            <div className="bg-[#0a192f] p-2 rounded border border-white/5">
                                                <p className="text-[9px] text-slate-500 uppercase">Est. Header Revenue</p>
                                                <p className={`font-bold text-${accentColor}-400 text-sm`}>${estRevenueLowUSD} - ${estRevenueHighUSD}</p>
                                            </div>
                                            <div className="bg-[#0a192f] p-2 rounded border border-white/5">
                                                <p className="text-[9px] text-slate-500 uppercase">Total Profit</p>
                                                <p className="font-bold text-white text-sm">{(roiLow * 100).toFixed(0)}% - {(roiHigh * 100).toFixed(0)}%</p>
                                            </div>
                                        </div>

                                        {/* FULL BENEFITS LIST */}
                                        <div className="w-full text-left bg-[#0a192f]/50 rounded-lg p-4 border border-white/5 mb-6 space-y-2">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 border-b border-white/5 pb-2">Included Features:</p>

                                            <div className="flex items-start gap-2 text-xs text-slate-300">
                                                <CheckCircle className={`w-3.5 h-3.5 text-${accentColor}-500 mt-0.5`} />
                                                <span>Dedicated Server Node ({cycleDays} Days)</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-xs text-slate-300">
                                                <CheckCircle className={`w-3.5 h-3.5 text-${accentColor}-500 mt-0.5`} />
                                                <span>Virtual USA Number (+1)</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-xs text-slate-300">
                                                <CheckCircle className={`w-3.5 h-3.5 text-${accentColor}-500 mt-0.5`} />
                                                <span>Daily Performance Bonus</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-xs text-slate-300">
                                                <CheckCircle className={`w-3.5 h-3.5 text-${accentColor}-500 mt-0.5`} />
                                                <span>Multi-Level Referral Commission</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-xs text-slate-300">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 mt-0.5 fill-current" />
                                                <span className="font-bold text-white">{taskCount} Premium Tasks / Day</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() => initiatePurchase(plan)}
                                            disabled={!!processing}
                                            className={`w-full py-4 bg-${accentColor}-600 hover:bg-${accentColor}-500 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-${accentColor}-900/20 flex items-center justify-center gap-2 uppercase tracking-widest`}
                                        >
                                            {processing === (plan._id || plan.id) ? 'INITIATING...' : 'DEPLOY NOW'}
                                            <ArrowLeft className="w-3 h-3 rotate-180" />
                                        </button>

                                        <div className="flex justify-between w-full mt-3 px-1">
                                            <p className="text-[9px] text-slate-600 font-mono flex items-center gap-1">
                                                <Lock className="w-2.5 h-2.5" /> 256-Bit SSL
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                {/* FOOTER PADDING */}
                <div className="h-24"></div>

                {/* ANIMATION OVERLAY */}
                {provisioning && (
                    <div className="absolute inset-0 z-50 bg-[#0a192f]/95 backdrop-blur-xl flex flex-col items-center justify-center border-x border-white/5">
                        {/* TYPE 1: SERVER ANIMATION */}
                        {provisioningType === 'server' && (
                            <div className="text-center w-full px-8">
                                <div className="flex gap-2 justify-center mb-8">
                                    <div className="w-4 h-20 bg-slate-800 rounded overflow-hidden flex flex-col gap-px p-px">
                                        {[...Array(6)].map((_, i) => <div key={i} className="h-2 bg-blue-500/20 rounded-[1px] relative"><div className="absolute inset-0 bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div></div>)}
                                    </div>
                                    <div className="w-4 h-20 bg-slate-800 rounded overflow-hidden flex flex-col gap-px p-px">
                                        {[...Array(6)].map((_, i) => <div key={i} className="h-2 bg-emerald-500/20 rounded-[1px] relative"><div className="absolute inset-0 bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div></div>)}
                                    </div>
                                </div>
                                <h2 className="text-lg font-bold text-white tracking-widest animate-pulse mb-2">DEPLOYING NODE</h2>
                                <p className="text-blue-400 font-mono text-[10px]">Syncing with USA Gateway...</p>
                                <div className="mt-6 w-32 h-[2px] bg-slate-800 mx-auto overflow-hidden">
                                    <div className="h-full bg-blue-500 w-full animate-[progress_4s_ease-in-out_infinite] origin-left scale-x-0"></div>
                                </div>
                            </div>
                        )}
                        {/* TYPE 2: NUMBER ANIMATION */}
                        {provisioningType === 'number' && (
                            <div className="text-center w-full px-8">
                                <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                                    <div className="absolute inset-0 border border-emerald-500/30 rounded-full animate-spin"></div>
                                    <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
                                </div>
                                <h2 className="text-lg font-bold text-white tracking-widest animate-pulse mb-2">ACTIVATING SIM</h2>
                                <p className="text-emerald-400 font-mono text-[10px]">Assigning Virtual Number...</p>
                                <p className="text-slate-500 text-[9px] mt-2 font-mono">Verifying SMS Gateway...</p>
                            </div>
                        )}
                    </div>
                )}

                <DisclaimerModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onAccept={handleAcceptPurchase}
                    plan={selectedPlan}
                />

            </div>
        </div>
    );
}
