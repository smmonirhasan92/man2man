import Link from 'next/link';

export default function DashboardCard({ href, title, description, icon: Icon, colorClass, badge }) {

    // Updated Dark Theme Color Map
    const colorMap = {
        blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
        green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
        purple: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
        emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        teal: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
        orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
        red: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
        pink: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
        cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
        amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
        gray: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
        slate: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600/30' }
    };

    const styles = colorMap[colorClass] || colorMap.gray;

    return (
        <Link href={href} className={`
            relative overflow-hidden group 
            bg-[#111] hover:bg-[#161616] 
            border border-white/5 hover:border-white/10 ${styles.border}
            rounded-2xl p-8 
            flex flex-col items-center justify-center gap-4
            transition-all duration-300 active:scale-95
            shadow-lg shadow-black/40
            aspect-square md:aspect-auto md:h-40
        `}>
            {/* Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-b from-transparent to-${styles.text.split('-')[1]}-500/10`}></div>

            {/* Icon Container */}
            <div className={`
                w-16 h-16 rounded-full flex items-center justify-center 
                ${styles.bg} ${styles.text} 
                shadow-[0_0_15px_rgba(0,0,0,0.5)] 
                group-hover:scale-110 transition-transform duration-300
                border border-white/5
            `}>
                <Icon className="w-8 h-8" />
            </div>

            {/* Label */}
            <div className="flex flex-col items-center gap-1 z-10">
                <span className="text-sm font-bold text-slate-200 tracking-wide text-center group-hover:text-white transition-colors">
                    {title}
                </span>
                {description && (
                    <span className="text-[10px] text-slate-500 font-medium text-center uppercase tracking-wider">
                        {description}
                    </span>
                )}
            </div>

            {/* Notification Badge */}
            {badge && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse border border-red-400/50">
                    {badge}
                </div>
            )}
        </Link>
    );
}
