import { forwardRef } from 'react';

const Input = forwardRef(({ icon: Icon, className = '', ...props }, ref) => {
    return (
        <div className="relative group">
            {Icon && (
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Icon className="w-5 h-5 text-slate-400 group-focus-within:text-[#0056D2] transition-colors duration-300" strokeWidth={2} />
                </div>
            )}
            <input
                ref={ref}
                className={`w-full ${Icon ? 'pl-12' : 'px-6'} pr-6 py-4 bg-slate-50 border border-slate-200 rounded-full focus:ring-4 focus:ring-[#0056D2]/10 focus:border-[#0056D2] outline-none transition-all duration-300 font-medium text-slate-800 placeholder:text-slate-400 text-sm shadow-sm group-hover:bg-white group-hover:shadow-md ${className}`}
                {...props}
            />
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
