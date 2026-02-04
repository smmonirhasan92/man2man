import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationPopup = ({ show, type, message, title, onClose }) => {
    if (!show) return null;

    // Define styles based on type
    const styles = {
        success: {
            bg: 'bg-white',
            border: 'border-green-500',
            icon: <CheckCircle className="w-8 h-8 text-green-500" />,
            titleColor: 'text-green-600',
            shadow: 'shadow-green-500/20'
        },
        error: {
            bg: 'bg-white',
            border: 'border-red-500',
            icon: <AlertCircle className="w-8 h-8 text-red-500" />,
            titleColor: 'text-red-600',
            shadow: 'shadow-red-500/20'
        },
        info: {
            bg: 'bg-white',
            border: 'border-blue-500',
            icon: <Info className="w-8 h-8 text-blue-500" />,
            titleColor: 'text-blue-600',
            shadow: 'shadow-blue-500/20'
        }
    };

    const style = styles[type] || styles.info;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none p-4">
            {/* Backdrop (Optional, kept light to feel non-blocking but focused) */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300"></div>

            {/* Modal Card */}
            <div className={`
                ${style.bg} ${style.border} pointer-events-auto
                w-full max-w-sm border-b-4 rounded-2xl p-6 shadow-2xl ${style.shadow}
                transform transition-all duration-300
                animate-in zoom-in-0 duration-300 spring-bounce
                flex flex-col items-center text-center relative
            `}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition text-slate-400"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="mb-4 p-3 rounded-full bg-slate-50 border border-slate-100 shadow-inner">
                    {style.icon}
                </div>

                <h3 className={`text-xl font-bold mb-2 ${style.titleColor}`}>
                    {title}
                </h3>

                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                    {message}
                </p>

                {/* Auto-closing progress bar could go here, but omitted for simplicity */}
            </div>
        </div>
    );
};

export default NotificationPopup;
