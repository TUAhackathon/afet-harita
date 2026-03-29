/**
 * Sidebar.jsx — BKZS Command Center Paneli
 * Yangın istatistikleri, uydu katman kontrolleri, NASA bilgisi
 */
import { useState } from 'react';

export default function Sidebar({ layers, toggleLayer, firePoints = [], fireLoading = false, fireError = null, lastFetchTime }) {
    const [isOpen, setIsOpen] = useState(true);

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
        <aside className="fixed left-0 top-0 bottom-0 z-[1000] w-72 flex flex-col p-6 bg-slate-950/80 backdrop-blur-2xl rounded-r-3xl h-[calc(100vh-2rem)] my-4 shadow-2xl shadow-black/50 overflow-y-auto">
            <div className="text-emerald-400 font-bold uppercase text-xs mb-8 tracking-[0.2em]">COMMAND CENTER</div>
            
            <nav className="flex-1 space-y-2">
                <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 font-medium tracking-wide transition-all cursor-pointer">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                    Rota Oluşturma
                </button>
                <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 font-medium tracking-wide transition-all cursor-pointer">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
                    Risk Analiz Bölgesi
                </button>
            </nav>

            <div className="mt-8 pt-8 border-t border-outline-variant/10">
                <div className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-4">Afet Veri Katmanları</div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-300">Satellite AI</span>
                        <div className="w-8 h-4 bg-primary rounded-full relative shadow-[0_0_8px_rgba(63,255,139,0.4)]">
                            <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mt-4">
                        <button 
                            onClick={() => toggleLayer('fire')}
                            className={`layer-toggle w-full text-left px-4 py-3 bg-surface-container-highest rounded-xl text-xs font-bold uppercase tracking-tight flex items-center justify-between group cursor-pointer transition-all ${
                                layers.fire 
                                ? 'border-orange-500/50 border bg-orange-500/10 scale-[1.02]' 
                                : 'hover:bg-orange-500/5'
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
                                        ) : lastFetchTime ? (
                                            <span className="text-amber-500 font-bold italic tracking-tight">Şu anda aktif yangın bulunmamaktadır</span>
                                        ) : (
                                            <span>Aktivasyon için tıklayın</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full transition-all ${layers.fire ? 'bg-[#ff4500] shadow-[0_0_8px_#ff4500]' : 'bg-slate-600'}`}></div>
                        </button>

                        <button 
                            onClick={() => toggleLayer('flood')}
                            className={`layer-toggle w-full text-left px-4 py-3 bg-surface-container-highest rounded-xl text-xs font-bold uppercase tracking-tight flex items-center justify-between group cursor-pointer transition-all ${
                                layers.flood 
                                ? 'border-blue-500/50 border bg-blue-500/10 scale-[1.02]' 
                                : 'hover:bg-blue-500/5'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>water</span>
                                <div>
                                    <div className="text-sm font-headline text-slate-200">Sel</div>
                                    <div className="text-[9px] text-slate-500 font-normal normal-case tracking-normal">Sel risk bölgelerini göster</div>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full transition-all ${layers.flood ? 'bg-[#1e90ff] shadow-[0_0_8px_#1e90ff]' : 'bg-slate-600'}`}></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6">
                <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 font-medium tracking-wide transition-all" href="#">
                    <span className="material-symbols-outlined">settings</span>
                    Settings
                </a>
            </div>
        </aside>
    );
}
