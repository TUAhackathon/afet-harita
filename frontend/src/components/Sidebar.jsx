/**
 * Sidebar.jsx — BKZS Command Center Paneli
 * Yangın istatistikleri, uydu katman kontrolleri, NASA bilgisi
 */
import { useState } from 'react';

export default function Sidebar({ layers, toggleLayer, firePoints = [], fireLoading = false, fireError = null, lastFetchTime, isOpen, setIsOpen, region, onRegionChange, aiAnalysis = { status: 'idle', results: [] }, onRiskAnalysis }) {

    // Yangın istatistikleri (NASA FIRMS verisi)
    const redCount    = firePoints.filter(f => f.color === 'red').length;
    const yellowCount = firePoints.filter(f => f.color === 'yellow').length;
    const greenCount  = firePoints.filter(f => f.color === 'green').length;
    const totalCount  = firePoints.length;

    const threatLevel = redCount >= 3 ? 'KRİTİK'
        : redCount >= 1 ? 'YÜKSEK'
        : yellowCount >= 2 ? 'ORTA'
        : totalCount > 0 ? 'DÜŞÜK'
        : 'İZLENİYOR';

    const threatColor = redCount >= 3 ? 'text-red-400'
        : redCount >= 1 ? 'text-orange-400'
        : yellowCount >= 2 ? 'text-amber-400'
        : 'text-emerald-400';

    const threatBg = redCount >= 3 ? 'bg-red-500/10 border-red-500/30'
        : redCount >= 1 ? 'bg-orange-500/10 border-orange-500/30'
        : yellowCount >= 2 ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-emerald-500/10 border-emerald-500/30';

    return (
        <aside className={`fixed left-0 top-0 bottom-0 z-[1000] w-[300px] flex flex-col
            bg-slate-950/90 backdrop-blur-3xl rounded-r-[1.75rem]
            h-[calc(100vh-1.5rem)] my-3 ml-0
            shadow-[12px_0_40px_rgba(0,0,0,0.7)]
            border-y border-r border-white/5
            transition-transform duration-500 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>

            {/* Toggle Butonu */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-1/2 -right-9 w-9 h-14 bg-slate-950/95 rounded-r-xl
                    flex items-center justify-center cursor-pointer shadow-xl
                    border-y border-r border-white/5 hover:bg-slate-800
                    transition-all z-[1001] group"
                style={{ transform: 'translateY(-50%)' }}
            >
                <span className="material-symbols-outlined text-emerald-400 text-lg group-hover:scale-125 transition-transform duration-300">
                    {isOpen ? 'chevron_left' : 'chevron_right'}
                </span>
            </button>

            <div className="flex-1 flex flex-col p-5 overflow-y-auto overflow-x-hidden rounded-r-[1.75rem]">

                {/* ── Başlık ─────────────────────────────── */}
                <div className="flex items-center gap-3 mb-5 shrink-0">
                    <div className="w-1.5 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                    <div>
                        <h2 className="text-emerald-400 font-black text-xs tracking-[0.25em] uppercase">
                            COMMAND CENTER
                        </h2>
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                            Afet Harita Sistemi
                        </p>
                    </div>

                </div>

                {/* ── Bölge Seçici ───────────────────────── */}
                <div className="shrink-0 mb-5">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">
                        Aktif Konum
                    </div>
                    <div className="flex bg-slate-900/50 rounded-xl p-1 border border-slate-800/50 relative overflow-hidden">
                        <div 
                            className={`absolute inset-y-1 w-[calc(50%-4px)] bg-slate-800/80 border border-slate-700/50 rounded-lg shadow-sm transition-transform duration-300 ease-out z-0
                            ${region === 'tr' ? 'translate-x-[2px]' : 'translate-x-[calc(100%+6px)]'}`}
                        />
                        <button
                            onClick={() => onRegionChange('tr')}
                            className={`relative z-10 flex-1 flex justify-center items-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                                region === 'tr' 
                                ? 'text-emerald-400'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                            Türkiye
                        </button>
                        <button
                            onClick={() => onRegionChange('in')}
                            className={`relative z-10 flex-1 flex justify-center items-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                                region === 'in' 
                                ? 'text-blue-400'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                            Hindistan
                        </button>
                    </div>
                </div>

                {/* ── Tehdit Seviyesi ────────────────────── */}
                {totalCount > 0 && (
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border mb-4 shrink-0 ${threatBg}`}>
                        <div>
                            <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
                                Bölgesel Tehdit
                            </div>
                            <div className={`font-black text-sm tracking-widest ${threatColor}`}>
                                {threatLevel}
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-2xl ${threatColor}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
                    </div>
                )}

                {/* ── Yangın İstatistik Kartları ──────────── */}
                {totalCount > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
                        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 text-center">
                            <div className="text-2xl font-black text-red-400 leading-none">{redCount}</div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">Büyük</div>
                        </div>
                        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-center">
                            <div className="text-2xl font-black text-amber-400 leading-none">{yellowCount}</div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">Orta</div>
                        </div>
                        <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-3 text-center">
                            <div className="text-2xl font-black text-green-400 leading-none">{greenCount}</div>
                            <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">Küçük</div>
                        </div>
                    </div>
                )}

                {/* ── Ayraç ──────────────────────────────── */}
                <div className="flex items-center gap-2 my-4 shrink-0 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500/50" />
                    <div className="h-px bg-gradient-to-r from-emerald-500/50 to-transparent flex-1" />
                </div>

                {/* ── Uydu Katmanları ─────────────────────── */}
                <div className="shrink-0">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3">
                        Uydu Katmanları
                    </div>

                    {/* Yangın Katmanı */}
                    <button
                        onClick={() => toggleLayer('fire')}
                        className={`layer-toggle w-full text-left px-4 py-3.5 rounded-xl text-xs font-bold
                            uppercase tracking-tight flex items-center justify-between
                            group cursor-pointer transition-all border
                            ${layers.fire
                                ? 'border-orange-500/50 bg-orange-500/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.1),0_0_15px_rgba(249,115,22,0.1)] scale-[1.01]'
                                : 'border-slate-800/60 bg-slate-900/40 hover:border-orange-500/30 hover:bg-orange-500/5'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                layers.fire ? 'bg-orange-500/20' : 'bg-slate-800/50'
                            }`}>
                                <span
                                    className={`material-symbols-outlined text-base transition-colors ${layers.fire ? 'text-orange-400' : 'text-slate-500 group-hover:text-orange-400'}`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >local_fire_department</span>
                                {layers.fire && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                                )}
                            </div>
                            <div>
                                <div className={`text-sm font-headline font-bold transition-colors ${
                                    layers.fire ? 'text-orange-200' : 'text-slate-300'
                                }`}>Yangın Risk</div>
                                <div className="text-[8px] text-slate-500 font-normal normal-case tracking-normal mt-0.5">
                                    {fireLoading ? (
                                        <span className="text-orange-400 animate-pulse">NASA'dan çekiliyor...</span>
                                    ) : fireError ? (
                                        <span className="text-red-400">Bağlantı hatası</span>
                                    ) : totalCount > 0 ? (
                                        <span className={layers.fire ? 'text-orange-400 font-bold' : ''}>
                                            {totalCount} aktif nokta tespit edildi
                                        </span>
                                    ) : layers.fire ? (
                                        <span className="text-slate-400">Aktif risk bulunamadı</span>
                                    ) : (
                                        <span>Aktivasyon için tıklayın</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Toggle indikatörü */}
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 relative shrink-0 ${
                            layers.fire ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-slate-700'
                        }`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                layers.fire ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </div>
                    </button>

                    {/* NASA FIRMS Bilgisi */}
                    {totalCount > 0 && (
                        <div className="mt-3 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="material-symbols-outlined text-sm text-blue-400">satellite_alt</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Veri Kaynağı</span>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-relaxed">
                                NASA FIRMS — VIIRS NOAA-20 NRT<br/>
                                <span className="text-emerald-500/70">60 saniye önbellek • Gerçek zamanlı</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Navigasyon Araçları ─────────────────── */}
                <div className="mt-4 space-y-2 shrink-0">
                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">
                        Operasyon
                    </div>
                    <button
                        onClick={() => {
                            // Menüyü kapat ve odaklan
                            setIsOpen(false);
                            setTimeout(() => document.getElementById('input-from')?.focus(), 500);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400
                        hover:text-emerald-400 bg-slate-900/40 hover:bg-emerald-500/8
                        border border-slate-800/50 hover:border-emerald-500/20
                        transition-all cursor-pointer group text-xs font-semibold">
                        <span className="material-symbols-outlined text-base text-slate-500 group-hover:text-emerald-400 transition-colors">route</span>
                        Rota Planlama
                    </button>
                    <button
                        onClick={onRiskAnalysis}
                        disabled={aiAnalysis.status === 'loading'}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400
                        hover:text-amber-400 bg-slate-900/40 hover:bg-amber-500/8
                        border border-slate-800/50 hover:border-amber-500/20
                        transition-all cursor-pointer group text-xs font-semibold
                        disabled:opacity-60 disabled:cursor-not-allowed`}>
                        {aiAnalysis.status === 'loading' ? (
                            <span className="material-symbols-outlined text-base text-amber-400 animate-spin transition-colors">autorenew</span>
                        ) : (
                            <span className="material-symbols-outlined text-base text-slate-500 group-hover:text-amber-400 transition-colors">crisis_alert</span>
                        )}
                        {aiAnalysis.status === 'loading' ? 'Analiz Yapılıyor...' : 'Risk Analizi'}
                    </button>

                    {/* ── AI Sonuç Paneli ────────────────────── */}
                    {aiAnalysis.status === 'done' && aiAnalysis.results.length > 0 && (() => {
                        const results = aiAnalysis.results;
                        const kritikCount = results.filter(r => r.risk_seviyesi === 'Kritik').length;
                        const avgFrp = (results.reduce((s, r) => s + r.frp_tahmin, 0) / results.length).toFixed(1);
                        const maxFrp = Math.max(...results.map(r => r.frp_tahmin)).toFixed(1);

                        return (
                            <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
                                {/* Özet başlık */}
                                <div className="px-4 py-3 border-b border-amber-500/15">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-sm text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                                        <span className="text-[9px] text-amber-400 font-black uppercase tracking-wider">AI Risk Analizi</span>
                                        <span className="ml-auto text-[8px] text-slate-500">{results.length} nokta</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                                            <div className="text-sm font-black text-red-400">{kritikCount}</div>
                                            <div className="text-[7px] text-slate-500 uppercase tracking-wide mt-0.5">Kritik</div>
                                        </div>
                                        <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                                            <div className="text-sm font-black text-amber-400">{avgFrp}</div>
                                            <div className="text-[7px] text-slate-500 uppercase tracking-wide mt-0.5">Ort. MW</div>
                                        </div>
                                        <div className="bg-slate-900/60 rounded-lg p-2 text-center">
                                            <div className="text-sm font-black text-orange-400">{maxFrp}</div>
                                            <div className="text-[7px] text-slate-500 uppercase tracking-wide mt-0.5">Max MW</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nokta listesi (en kritik 5) */}
                                <div className="divide-y divide-slate-800/40">
                                    {results.slice(0, 5).map((r, i) => {
                                        const renkMap = {
                                            'Kritik': 'text-red-400',
                                            'Yüksek': 'text-orange-400',
                                            'Orta':   'text-amber-400',
                                            'Düşük':  'text-emerald-400',
                                        };
                                        return (
                                            <div key={i} className="flex items-center gap-2.5 px-4 py-2">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.risk_seviyesi === 'Kritik' ? 'bg-red-400' : r.risk_seviyesi === 'Yüksek' ? 'bg-orange-400' : 'bg-amber-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[9px] text-slate-400 truncate">
                                                        {r.lat.toFixed(2)}°N {r.lon.toFixed(2)}°E
                                                    </div>
                                                    <div className={`text-[8px] font-bold ${renkMap[r.risk_seviyesi] || 'text-slate-400'}`}>
                                                        {r.risk_seviyesi}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-[10px] font-black text-white">{r.frp_tahmin.toFixed(0)}</div>
                                                    <div className="text-[7px] text-slate-500">MW</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* ── Alt Bilgi ──────────────────────────── */}
                <div className="mt-auto pt-6 shrink-0">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-4" />
                    <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500
                        hover:text-slate-300 hover:bg-slate-800/40 transition-all text-xs font-medium">
                        <span className="material-symbols-outlined text-base">settings</span>
                        Sistem Ayarları
                    </a>
                </div>
            </div>
        </aside>
    );
}
