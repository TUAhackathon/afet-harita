export default function RoutePanel({ routeStatus, onClearRoute }) {
    const { status, payload, error } = routeStatus;

    return (
        <aside className="fixed right-6 top-24 bottom-24 w-80 z-[1000] flex flex-col gap-6 pointer-events-none">
            <div className="glass-panel bg-primary/10 rounded-2xl p-6 shadow-2xl shadow-primary/5 border border-primary/20 pointer-events-auto">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                    <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-primary">Güvenli Rota</h3>
                </div>

                {/* State: IDLE */}
                {status === 'idle' && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-primary/30 text-5xl mb-3 block">explore</span>
                        <p className="text-sm text-on-surface-variant">Rota oluşturmak için başlangıç ve hedef noktalarını girin</p>
                        <p className="text-[10px] text-on-surface-variant/50 mt-2">Üst çubuktaki alanları kullanın</p>
                    </div>
                )}

                {/* State: LOADING */}
                {status === 'loading' && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-primary animate-spin text-4xl mb-3 block">progress_activity</span>
                        <p className="text-sm text-on-surface-variant">Güvenli rota hesaplanıyor...</p>
                    </div>
                )}

                {/* State: ERROR */}
                {status === 'error' && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-red-400 text-4xl mb-3 block">error</span>
                        <p className="text-sm text-red-400">{error || 'Bağlantı hatası. Lütfen tekrar deneyin.'}</p>
                    </div>
                )}

                {/* State: SUCCESS */}
                {status === 'success' && payload && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-on-surface-variant">Başlangıç</span>
                            <span className="text-xs font-headline font-bold text-right max-w-[160px] truncate text-slate-200" title={payload.fromName}>{payload.fromName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-on-surface-variant">Hedef</span>
                            <span className="text-xs font-headline font-bold text-right max-w-[160px] truncate text-slate-200" title={payload.toName}>{payload.toName}</span>
                        </div>
                        <div className="border-t border-primary/10 pt-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-on-surface-variant">Tahmini Süre</span>
                            <span className="text-lg font-headline font-bold text-slate-200">{payload.durationMin} dk</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-on-surface-variant">Mesafe</span>
                            <span className="text-lg font-headline font-bold text-slate-200">{payload.distanceKm} km</span>
                        </div>
                        <div className="pt-4 mt-2 border-t border-primary/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                                    <span className="text-xs font-bold uppercase tracking-tighter text-slate-200">Güvenlik Puanı</span>
                                </div>
                                <span className={`text-2xl font-headline font-black ${
                                    payload.safetyScore >= 80 ? 'text-primary' : payload.safetyScore >= 60 ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                    {payload.safetyScore}%
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={onClearRoute}
                            className="w-full bg-red-500/20 text-red-400 font-headline font-bold py-3 rounded-lg text-xs uppercase tracking-widest hover:bg-red-500/30 active:scale-95 transition-all mt-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm align-middle mr-1">close</span>
                            Rotayı Temizle
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
