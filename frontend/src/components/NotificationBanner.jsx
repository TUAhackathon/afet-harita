export default function NotificationBanner() {
    return (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-error-container/90 glass-panel border border-error/30 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl shadow-error/20">
                <span className="material-symbols-outlined text-on-error-container animate-pulse">warning</span>
                <span className="font-headline font-bold text-xs tracking-widest text-on-error-container uppercase">Regional anomaly detected - National scan in progress (Turkey Central)</span>
            </div>
        </div>
    )
}
