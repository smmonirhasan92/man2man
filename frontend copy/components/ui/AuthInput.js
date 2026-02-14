import { LucideIcon } from 'lucide-react';

export default function AuthInput({ icon: Icon, label, type = "text", placeholder, value, onChange, name, required = false, className = "", ...props }) {
    return (
        <div className="group w-full">
            {label && (
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-4 group-focus-within:text-[var(--brand-secondary)] transition-colors duration-300">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Icon className="w-5 h-5 text-slate-400 group-focus-within:text-[var(--brand-secondary)] transition-colors duration-300" strokeWidth={2} />
                </div>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`input-premium ${className}`}
                    {...props}
                />
            </div>
        </div>
    );
}
