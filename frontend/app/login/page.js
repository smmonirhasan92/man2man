'use client';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Premium Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 shadow-2xl mb-4 shadow-emerald-500/20">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                        USA Affiliate
                    </h1>
                    <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase mt-2">Secure Access Portal</p>
                </div>

                <div className="bg-[#0b1221]/80 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden">
                    <LoginForm />
                </div>

                <div className="mt-8 text-center space-y-4">
                    {/* [NEW] Persistent Install Link for Public Entry */}
                    <button
                        onClick={() => window.triggerPWAInstall && window.triggerPWAInstall()}
                        className="w-full py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all active:scale-95 group"
                    >
                        <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Install Official App
                    </button>

                    <p className="text-slate-500 text-xs">
                        Don't have an account?{' '}
                        <a href="/register" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
                            Register Now
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
