import { Loader2 } from 'lucide-react';

export default function Button({
    children,
    variant = 'primary',
    size = 'default',
    className = '',
    loading = false,
    disabled,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-gradient-to-r from-[#0A2540] to-[#0f172a] text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 border border-white/10",
        secondary: "bg-[#EF4444] text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
        outline: "border-2 border-slate-200 bg-white text-slate-700 hover:border-[#0A2540] hover:text-[#0A2540]",
        ghost: "bg-transparent text-slate-500 hover:text-[#0A2540] hover:bg-slate-100",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        default: "px-6 py-3.5 text-sm",
        lg: "px-8 py-4 text-base",
        icon: "p-3"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={loading || disabled}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
}
