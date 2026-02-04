export default function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`bg-white rounded-[2rem] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
