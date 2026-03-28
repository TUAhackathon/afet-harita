export default function Legend() {
    return (
        <div className="fixed bottom-10 left-80 z-40">
            <div className="glass-panel bg-surface-container-low/90 px-4 py-3 rounded-xl border border-outline-variant/10 shadow-xl">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-3">Harita Lejantı</div>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
                        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-tighter">Güvenli Geçiş</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_var(--color-secondary)]"></div>
                        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-tighter">Risk Bölgesi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-tertiary shadow-[0_0_8px_var(--color-tertiary)]"></div>
                        <span className="text-[10px] font-medium text-slate-300 uppercase tracking-tighter">Medikal Nokta</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
