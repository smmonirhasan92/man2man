'use client';
import LoginForm from '../../components/LoginForm';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-xl flex items-center justify-center gap-2">
                        <span className="text-blue-500">USA</span>
                        <span className="text-white">AFFILIATE</span>
                        <span className="text-red-600 text-2xl">★</span>
                    </h1>
                    <p className="text-blue-200 text-xs font-bold tracking-widest uppercase">Official Access Protocol</p>
                </div>

                <div className="bg-[#112240]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <LoginForm />
                </div>

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs">
                        Don't have an account?{' '}
                        <a href="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors">
                            Register Now
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
