export default function RoutePanel({ routeStatus, onClearRoute }) {
    const { status, payload, error } = routeStatus;

    if (status === 'idle') return null;

    return (
        <aside className="fixed right-6 top-24 bottom-24 w-80 z-[1000] flex flex-col gap-6 pointer-events-none">
            <div className="glass-panel bg-primary/10 rounded-2xl p-6 shadow-2xl shadow-primary/5 border border-primary/20 pointer-events-auto">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                    <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-primary">Güvenli Rota</h3>
                </div>

                {/* State: LOADING */}
                {status === 'loading' && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-primary animate-spin text-4xl mb-3 block">progress_activity</span>
                        <p className="text-sm text-slate-200 font-medium">Güvenli rota hesaplanıyor...</p>
                    </div>
                )}

                {/* State: ERROR */}
                {status === 'error' && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-red-400 text-4xl mb-3 block">error</span>
                        <p className="text-sm text-red-400 font-bold">{error || 'Bağlantı hatası. Lütfen tekrar deneyin.'}</p>
                    </div>
                )}

                {/* State: SUCCESS */}
                {status === 'success' && payload && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Başlangıç</span>
                            <span className="text-xs font-headline font-bold text-right max-w-[160px] truncate text-white" title={payload.fromName}>{payload.fromName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Hedef</span>
                            <span className="text-xs font-headline font-bold text-right max-w-[160px] truncate text-white" title={payload.toName}>{payload.toName}</span>
                        </div>
                        <div className="border-t border-primary/20 pt-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Tahmini Süre</span>
                            <span className="text-lg font-headline font-black text-white">{payload.durationMin} dk</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Mesafe</span>
                            <span className="text-lg font-headline font-black text-white">{payload.distanceKm} km</span>
                        </div>
                        <div className="pt-4 mt-2 border-t border-primary/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                                    <span className="text-xs font-bold uppercase tracking-tighter text-white">Güvenlik Puanı</span>
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
