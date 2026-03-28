import { useState } from 'react';
import { floodData } from '../utils/data';

export default function Sidebar({ layers, toggleLayer, fireCount = 0, fireLoading = false, fireError = null }) {
    const [isOpen, setIsOpen] = useState(true);
    const [satelliteAiActive, setSatelliteAiActive] = useState(true);

    return (
        <aside className={`fixed left-0 top-0 bottom-0 z-[1000] w-[320px] flex flex-col bg-slate-950/85 backdrop-blur-3xl rounded-r-[2rem] h-[calc(100vh-2rem)] my-4 shadow-[10px_0_30px_rgba(0,0,0,0.8)] border-y border-r border-emerald-500/10 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-1/2 -right-10 w-10 h-16 bg-slate-950/90 rounded-r-xl flex items-center justify-center cursor-pointer shadow-[8px_0_15px_rgba(0,0,0,0.6)] border-y border-r border-emerald-500/20 hover:bg-slate-800 transition-all z-[1001] group"
                style={{ transform: 'translateY(-50%)' }}
            >
                <span className="material-symbols-outlined text-emerald-400 group-hover:scale-125 transition-transform duration-300">
                    {isOpen ? 'chevron_left' : 'chevron_right'}
                </span>
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto overflow-x-hidden rounded-r-[2rem]">
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <div>
                        <h2 className="text-emerald-400 font-black uppercase text-sm tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">COMMAND CENTER</h2>
                        <span className="text-[9px] text-emerald-500/60 uppercase tracking-widest font-bold">Taktik Operasyon Ağı</span>
                    </div>
                </div>


                
                {/* Navigation Tools */}
                <nav className="flex-1 space-y-3 shrink-0">
                    <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:text-emerald-400 bg-slate-800/20 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 font-medium tracking-wide transition-all cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-400 transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                        Rota Oluşturma
                    </button>
                    <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-300 hover:text-amber-400 bg-slate-800/20 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 font-medium tracking-wide transition-all cursor-pointer group shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-amber-400 transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
                        Risk Analiz Bölgesi
                    </button>
                </nav>

                {/* Tactical Divider */}
                <div className="flex items-center gap-2 my-8 shrink-0 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500/50"></div>
                    <div className="h-px bg-gradient-to-r from-emerald-500/50 to-transparent flex-1"></div>
                </div>

                {/* AI / Layers Section */}
                <div className="shrink-0">
                    <div className="text-[10px] text-emerald-500/80 font-black uppercase tracking-[0.2em] mb-4 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">Uydu Analiz Katmanları</div>
                    <div className="space-y-4">
                        
                        {/* Satellite AI Toggle */}
                        <div className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-300 ${satelliteAiActive ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'}`}
                             onClick={() => setSatelliteAiActive(!satelliteAiActive)}
                        >
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-sm ${satelliteAiActive ? 'text-emerald-400' : 'text-slate-400'}`}>satellite_alt</span>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${satelliteAiActive ? 'text-emerald-400' : 'text-slate-400'}`}>Satellite AI</span>
                                </div>
                                <span className="text-[9px] text-slate-500 mt-1">Yapay Zeka Destekli Anomali Taraması</span>
                            </div>
                            {/* Modern Toggle Switch */}
                            <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 relative shrink-0 ${satelliteAiActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-md transition-transform duration-300 ${satelliteAiActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </div>
                        </div>

                        {/* Hazard Toggles */}
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            <button 
                                onClick={() => toggleLayer('fire')}
                                className={`layer-toggle w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-tight flex items-center justify-between group cursor-pointer transition-all ${
                                    layers.fire 
                                    ? 'border-orange-500 bg-orange-500/10 shadow-[inset_0_0_15px_rgba(249,115,22,0.15),0_0_10px_rgba(249,115,22,0.1)] scale-[1.02]' 
                                    : 'border-slate-800/50 bg-slate-900/50 hover:border-orange-500/30 hover:bg-orange-500/5'
                                } border`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined transition-colors ${layers.fire ? 'text-orange-500' : 'text-slate-500 group-hover:text-orange-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                        local_fire_department
                                    </span>
                                    <div>
                                        <div className={`text-sm font-headline transition-colors ${layers.fire ? 'text-orange-200 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]' : 'text-slate-300'}`}>Yangın Risk</div>
                                        <div className="text-[9px] text-slate-500 font-normal normal-case tracking-normal">
                                            Tespit Edilen:{' '}
                                            {fireLoading ? (
                                                <span className="text-orange-300 font-bold animate-pulse">Yükleniyor...</span>
                                            ) : fireError ? (
                                                <span className="text-red-400 font-bold">! Bağlantı hatası</span>
                                            ) : (
                                                <span className={`font-bold ${layers.fire ? 'text-orange-400' : ''}`}>
                                                    {fireCount > 0 ? `${fireCount} Nokta` : layers.fire ? '0 Nokta' : '— Nokta'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full transition-all shrink-0 ${layers.fire ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : 'bg-slate-700 group-hover:bg-slate-600'}`}></div>
                            </button>

                            <button 
                                onClick={() => toggleLayer('flood')}
                                className={`layer-toggle w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-tight flex items-center justify-between group cursor-pointer transition-all ${
                                    layers.flood 
                                    ? 'border-blue-500 bg-blue-500/10 shadow-[inset_0_0_15px_rgba(59,130,246,0.15),0_0_10px_rgba(59,130,246,0.1)] scale-[1.02]' 
                                    : 'border-slate-800/50 bg-slate-900/50 hover:border-blue-500/30 hover:bg-blue-500/5'
                                } border`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined transition-colors ${layers.flood ? 'text-blue-500' : 'text-slate-500 group-hover:text-blue-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                        water
                                    </span>
                                    <div>
                                        <div className={`text-sm font-headline transition-colors ${layers.flood ? 'text-blue-200 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'text-slate-300'}`}>Sel Risk</div>
                                        <div className="text-[9px] text-slate-500 font-normal normal-case tracking-normal">Tespit Edilen: <span className={`font-bold ${layers.flood ? 'text-blue-400' : ''}`}>{floodData.length} Bölge</span></div>
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full transition-all shrink-0 ${layers.flood ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-700 group-hover:bg-slate-600'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-8 shrink-0">
                    <a className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 font-medium tracking-wide transition-all" href="#">
                        <span className="material-symbols-outlined">settings</span>
                        Sistem Ayarları
                    </a>
                </div>
            </div>
        </aside>
    );
}
