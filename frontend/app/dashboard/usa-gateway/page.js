'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Server, Wifi, CheckCircle, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../../services/authService';
import toast from 'react-hot-toast';

export default function USAGateway() {
    const router = useRouter();
    const [status, setStatus] = useState('idle'); // idle, connecting, verifying, success
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [usaKey, setUsaKey] = useState('');
    const [targetKey, setTargetKey] = useState(''); // [NEW]
    const [user, setUser] = useState(null);

    useEffect(() => {
        const u = authService.getCurrentUser();
        if (u) setUser(u);
    }, []);

    const addLog = (msg) => setLogs(prev => [...prev.slice(-4), `> ${msg}`]);

    const handleConnect = async () => {
        setStatus('connecting');
        addLog('Initializing Handshake Protocol...');

        try {
            // [NEW] Generate Dynamic Key
            const res = await (await import('../../../services/api')).default.post('/task/generate-key');
            // Allow time for animation to finish before showing verify
            setTargetKey(res.data.key);
            addLog(`SECURE TOKEN GENERATED: ${res.data.key}`);
        } catch (e) {
            addLog('ERROR: K_GEN_FAILED');
            console.error(e);
        }

        // Simulation Duration: 6s
        let duration = 60; // 60 * 100ms = 6s
        let tick = 0;

        const timer = setInterval(() => {
            tick++;
            setProgress(Math.min((tick / duration) * 100, 100));

            // Log Simulation
            if (tick === 10) addLog('Resolving US-East-1 Proxy...');
            if (tick === 25) addLog('Encrypting Tunnel (AES-256)...');
            if (tick === 45) addLog('Bypassing Geo-Restrictions...');
            if (tick === 55) addLog('Handshake ACK Received.');

            if (tick >= duration) {
                clearInterval(timer);
                setStatus('verifying');
                addLog('Connection Established. Authentication Required.');
            }
        }, 100);
    };

    const handleVerify = (e) => {
        e.preventDefault();

        // Check Logic
        // In a real strict app, we might verify via API, but client-side check against authService data is requested for "Simulated" 
        // We can also verify against what we know is in the user object.
        const actualKey = targetKey || user?.synthetic_phone || user?.user?.synthetic_phone;

        if (usaKey.trim() === actualKey) {
            setStatus('success');
            localStorage.setItem('usa_connected', 'true');
            localStorage.setItem('usa_connect_time', Date.now());

            // [FIX] Store Identity for API Headers (Critical for backend requireUSIdentity)
            localStorage.setItem('active_server_phone', actualKey);
            // Default Fallbacks for UI
            if (!localStorage.getItem('active_server_name')) localStorage.setItem('active_server_name', 'USA GATEWAY');

            addLog('IDENTITY VERIFIED. ACCESS GRANTED.');

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } else {
            addLog('ERROR: INVALID KEY. ACCESS DENIED.');
            toast.error("Invalid Verification Key!");
        }
    };

    // Style helper for logs
    const LogLine = ({ children }) => <div className="text-xs font-mono text-emerald-500/80 mb-1">{children}</div>;

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            <div className="absolute w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 relative z-10 shadow-2xl">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        {status === 'idle' && <Lock className="w-8 h-8 text-slate-400" />}
                        {status === 'connecting' && <Wifi className="w-8 h-8 text-indigo-400 animate-pulse" />}
                        {status === 'verifying' && <Shield className="w-8 h-8 text-amber-400" />}
                        {status === 'success' && <CheckCircle className="w-8 h-8 text-emerald-500" />}

                        {/* Orbit Animation */}
                        {status === 'connecting' && (
                            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-full animate-spin-slow border-t-indigo-500"></div>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">USA Secure Gateway</h1>
                    <p className="text-slate-400 text-sm mt-2">Establish a secure tunnel to access tasks.</p>
                </div>

                {/* Status: IDLE */}
                {status === 'idle' && (
                    <button
                        onClick={handleConnect}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                    >
                        <Server className="w-5 h-5" />
                        Inititate Security Protocol
                    </button>
                )}

                {/* Status: CONNECTING */}
                {status === 'connecting' && (
                    <div className="space-y-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="bg-black/50 rounded-lg p-3 h-32 overflow-y-auto border border-slate-800 scrollbar-hide">
                            {logs.map((L, i) => <LogLine key={i}>{L}</LogLine>)}
                        </div>
                    </div>
                )}

                {/* Status: VERIFYING */}
                {status === 'verifying' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">Gateway Locked</p>
                            <p className="text-slate-300 text-xs mt-1">Authenticating with Dynamic Session.</p>
                        </div>

                        {/* [NEW] Show Key to Copy */}
                        {targetKey && (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mb-4 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-blue-400 font-bold uppercase">Dynamic Token</div>
                                    <div className="font-mono text-white tracking-widest text-lg font-bold">{targetKey}</div>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(targetKey)}
                                    className="p-2 bg-blue-600 rounded text-white hover:bg-blue-500"
                                >
                                    Copy
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleVerify}>
                            <input
                                type="text"
                                value={usaKey}
                                onChange={(e) => setUsaKey(e.target.value)}
                                placeholder="Paste USA Key (+1 ...)"
                                className="w-full bg-black/50 border border-slate-600 rounded-xl px-4 py-3 text-white font-mono text-center focus:border-indigo-500 outline-none mb-4"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                            >
                                <Lock className="w-4 h-4" />
                                Authenticate & Unlock
                            </button>
                        </form>
                    </div>
                )}

                {/* Status: SUCCESS */}
                {status === 'success' && (
                    <div className="text-center animate-in zoom-in duration-300">
                        <p className="text-emerald-400 font-bold text-lg mb-2">Connection Secured</p>
                        <p className="text-slate-400 text-sm">Redirecting to Task Center...</p>
                    </div>
                )}

            </div>

            {/* Footer Info */}
            <div className="absolute bottom-6 text-center w-full text-slate-600 text-[10px] uppercase tracking-widest">
                Encrypted via AES-256 • Node: US-VA-04
            </div>
        </div>
    );
}
