import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function RoleDropdown({ currentRole, onChange, direction = 'down' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const roles = [
        { value: 'user', label: 'User' },
        { value: 'agent', label: 'Agent' },
        { value: 'employee_admin', label: 'Employee' },
        { value: 'super_admin', label: 'Super Admin' }
    ];

    const currentLabel = roles.find(r => r.value === currentRole)?.label || currentRole;

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all text-xs font-bold text-slate-700"
            >
                <span className="font-sans">{currentLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isOpen && (
                <div className={`absolute ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[99999] overflow-hidden animate-in fade-in zoom-in-95`}>
                    {roles.map((role) => (
                        <button
                            key={role.value}
                            onClick={() => {
                                onChange(role.value);
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center justify-between px-4 py-4 hover:bg-indigo-50 transition-colors text-sm font-bold text-slate-700 font-sans"
                        >
                            <span>{role.label}</span>
                            {currentRole === role.value && <Check className="w-3 h-3 text-indigo-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
