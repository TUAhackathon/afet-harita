/**
 * RoutePanel.jsx — Çok Rota Seçim & Güvence Raporu
 *
 * Navigasyon uygulaması tarzı:
 *   • Tüm rota seçenekleri liste halinde gösterilir
 *   • Tıklayarak rota seçilir → haritada öne çıkar
 *   • Seçili rota için detaylı güvenlik raporu açılır
 */

/* ── Yardımcı: Güvenlik rengi ─── */
function safetyMeta(score) {
    if (score >= 80) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', label: 'Güvenli' };
    if (score >= 55) return { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   label: 'Dikkatli' };
    return              { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/25',  label: 'Tehlikeli' };
}

/* ── SVG Daire Gauge ─── */
function SafetyGauge({ score }) {
    const meta = safetyMeta(score);
    const r    = 26;
    const circ = 2 * Math.PI * r;
    const dash = circ * (score / 100);
    const hex  = score >= 80 ? '#3fff8b' : score >= 55 ? '#facc15' : '#f97316';

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r={r} fill="none" stroke="#1e2433" strokeWidth="5" />
                    <circle
                        cx="32" cy="32" r={r}
                        fill="none" stroke={hex} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        style={{ filter: `drop-shadow(0 0 4px ${hex})`, transition: 'stroke-dasharray 0.8s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-base font-black leading-none ${meta.color}`}>{score}</span>
                    <span className="text-[7px] text-slate-600">/ 100</span>
                </div>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${meta.color}`}>{meta.label}</span>
        </div>
    );
}

/* ── Rota Kartı ─── */
function RouteCard({ route, isSelected, onSelect }) {
    const meta       = safetyMeta(route.safetyScore);
    const typeConfig = {
        safe:        { icon: 'shield',     accent: route.color, dim: 'rgba(63,255,139,0.08)' },
        direct:      { icon: 'route',      accent: route.color, dim: 'rgba(148,163,184,0.06)' },
        alternative: { icon: 'alt_route',  accent: route.color, dim: 'rgba(96,165,250,0.06)' },
    };
    const cfg = typeConfig[route.type] || typeConfig.alternative;

    return (
        <button
            onClick={() => onSelect(route.id)}
            className={`w-full text-left rounded-xl px-4 py-3.5 border transition-all duration-200 cursor-pointer group relative overflow-hidden
                ${isSelected
                    ? 'border-slate-600/60 bg-slate-800/60 shadow-lg scale-[1.01]'
                    : 'border-slate-800/50 bg-slate-900/40 hover:border-slate-700/60 hover:bg-slate-800/40 hover:scale-[1.005]'
                }`}
        >
            {/* Seçili rota sol çizgisi */}
            {isSelected && (
                <div
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ backgroundColor: cfg.accent, boxShadow: `0 0 10px ${cfg.accent}` }}
                />
            )}

            <div className="flex items-center gap-3">
                {/* İkon */}
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                        backgroundColor: isSelected ? `${cfg.accent}20` : 'rgba(30,36,53,0.8)',
                        border: `1px solid ${isSelected ? `${cfg.accent}40` : 'rgba(100,116,139,0.2)'}`,
                    }}
                >
                    <span
                        className="material-symbols-outlined text-base"
                        style={{ fontVariationSettings: "'FILL' 1", color: isSelected ? cfg.accent : '#64748b' }}
                    >{cfg.icon}</span>
                </div>

                {/* Bilgiler */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span
                            className="text-sm font-bold truncate"
                            style={{ color: isSelected ? cfg.accent : '#cbd5e1' }}
                        >{route.label}</span>
                        {route.badge && (
                            <span
                                className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border shrink-0"
                                style={{
                                    color: cfg.accent, borderColor: `${cfg.accent}40`,
                                    backgroundColor: `${cfg.accent}15`,
                                }}
                            >{route.badge}</span>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                        {route.durationMin} dk &nbsp;•&nbsp; {route.distanceKm} km
                    </div>
                </div>

                {/* Güvenlik skoru */}
                <div className={`text-right shrink-0 px-2 py-1 rounded-lg ${isSelected ? meta.bg : ''}`}>
                    <div className={`text-sm font-black leading-none ${meta.color}`}>%{route.safetyScore}</div>
                    <div className="text-[7px] text-slate-600 uppercase tracking-wider">güvenlik</div>
                </div>
            </div>

            {/* Seçili: ek detaylar */}
            {isSelected && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-700/50 flex gap-2 flex-wrap">
                    {route.bypassed > 0 && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            ✓ {route.bypassed} yangın bypassed
                        </span>
                    )}
                    {route.remainingThreats > 0 && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            ⚠ {route.remainingThreats} bölgede alternatif yok
                        </span>
                    )}
                    {route.bypassed === 0 && route.remainingThreats === 0 && route.type !== 'safe' && (
                        <span className="text-[9px] text-slate-600 italic">Yangın bypass yok</span>
                    )}
                </div>
            )}
        </button>
    );
}

/* ── Ana Bileşen ─── */
export default function RoutePanel({ routeStatus, selectedRouteId, onSelectRoute, onClearRoute }) {
    const { status, payload, error } = routeStatus;
    if (status === 'idle') return null;

    const selectedRoute = payload?.routes?.find(r => r.id === selectedRouteId);

    return (
        <aside className="fixed right-4 top-20 z-[1000] w-[320px] flex flex-col gap-2 pointer-events-none">
            <div className="bg-slate-950/93 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/5 pointer-events-auto overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/5 bg-slate-900/40">
                    <span className="material-symbols-outlined text-emerald-400 text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                        Güvence Raporu
                    </span>
                    {payload?.routes && (
                        <span className="ml-auto text-[8px] text-slate-500 font-semibold">
                            {payload.routes.length} seçenek
                        </span>
                    )}
                </div>

                {/* ── LOADING ─── */}
                {status === 'loading' && (
                    <div className="px-5 py-8 text-center">
                        <div className="relative w-14 h-14 mx-auto mb-3">
                            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-spin"
                                style={{ borderTopColor: '#3fff8b', animationDuration: '0.8s' }} />
                            <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-emerald-400 text-xl"
                                style={{ fontVariationSettings: "'FILL' 1" }}>satellite_alt</span>
                        </div>
                        <p className="text-sm text-slate-300 font-semibold">Güvenli rotalar hesaplanıyor</p>
                        <p className="text-[10px] text-slate-500 mt-1">NASA yangın verisi + alternatifleri paralel analiz ediliyor...</p>
                    </div>
                )}

                {/* ── ERROR ─── */}
                {status === 'error' && (
                    <div className="px-5 py-6 text-center">
                        <span className="material-symbols-outlined text-red-400 text-4xl block mb-3">error</span>
                        <p className="text-sm text-red-300 font-bold">{error}</p>
                        <button onClick={onClearRoute}
                            className="mt-4 text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer">
                            Geri Dön
                        </button>
                    </div>
                )}

                {/* ── SUCCESS ─── */}
                {status === 'success' && payload && (
                    <div className="p-3 space-y-2">
                        {/* Güzergah */}
                        <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl px-3 py-2">
                            <span className="material-symbols-outlined text-emerald-400 text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                            <span className="text-xs text-slate-200 font-semibold truncate flex-1">{payload.fromName}</span>
                            <span className="material-symbols-outlined text-slate-600 text-xs shrink-0">east</span>
                            <span className="text-xs text-slate-200 font-semibold truncate flex-1 text-right">{payload.toName}</span>
                            <span className="material-symbols-outlined text-red-400 text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        </div>

                        {/* Rota Listesi */}
                        <div className="space-y-1.5">
                            {payload.routes.map(route => (
                                <RouteCard
                                    key={route.id}
                                    route={route}
                                    isSelected={route.id === selectedRouteId}
                                    onSelect={onSelectRoute}
                                />
                            ))}
                        </div>

                        {/* Seçili Rota Gauge */}
                        {selectedRoute && (
                            <div className="flex items-center gap-4 bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-800/50">
                                <SafetyGauge score={selectedRoute.safetyScore} />
                                <div>
                                    <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                                        Seçili Rota
                                    </div>
                                    <div
                                        className="text-sm font-black mb-1"
                                        style={{ color: selectedRoute.color }}
                                    >{selectedRoute.label}</div>
                                    <div className="text-[9px] text-slate-500 leading-relaxed">
                                        {selectedRoute.durationMin} dk &nbsp;|&nbsp; {selectedRoute.distanceKm} km<br />
                                        <span className="text-slate-600">NASA FIRMS verisi kullanılarak hesaplandı</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Temizle */}
                        <button
                            onClick={onClearRoute}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-red-500/15
                                text-slate-400 hover:text-red-300 border border-slate-700/50 hover:border-red-500/30
                                font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-[0.15em]
                                transition-all cursor-pointer active:scale-95"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                            Rotaları Temizle
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
