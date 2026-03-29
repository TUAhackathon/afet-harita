import { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const colors = {
        info:    'border-amber-500/50 bg-amber-500/10 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
        success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        error:   'border-red-500/50 bg-red-500/10 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    };

    const icons = {
        info:    'info',
        success: 'check_circle',
        error:   'error',
    };

    const iconColors = {
        info:    'text-amber-400',
        success: 'text-emerald-400',
        error:   'text-red-400',
    };

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none animate-[slide-down-toast_0.5s_ease-out]">
            <div className={`
                glass-panel flex items-center gap-4 px-6 py-4 rounded-2xl border
                ${colors[type]} pointer-events-auto min-w-[320px] max-w-[450px]
                shadow-2xl
            `}>
                <div className={`p-2 rounded-xl bg-white/5 ${iconColors[type]}`}>
                    <span className="material-symbols-outlined block text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {icons[type]}
                    </span>
                </div>
                
                <div className="flex-1">
                    <div className="text-[10px] opacity-50 uppercase font-black tracking-[0.2em] mb-0.5">
                        Sistem Bildirimi
                    </div>
                    <div className="text-sm font-bold leading-tight">
                        {message}
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer group"
                >
                    <span className="material-symbols-outlined text-lg opacity-40 group-hover:opacity-100">close</span>
                </button>
            </div>
        </div>
    );
}
