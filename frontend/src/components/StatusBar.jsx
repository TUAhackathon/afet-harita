/**
 * StatusBar.jsx — BKZS Sistem Durum Çubuğu
 * Sağ alt köşe: NASA bağlantısı, yangın sayımı, son güncelleme
 */
export default function StatusBar({ firePoints = [], lastFetchTime }) {
    const redCount    = firePoints.filter(f => f.color === 'red').length;
    const yellowCount = firePoints.filter(f => f.color === 'yellow').length;
    const greenCount  = firePoints.filter(f => f.color === 'green').length;
    const total       = firePoints.length;

    const formatTime = (d) => {
        if (!d) return null;
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed bottom-4 right-4 z-[1000] pointer-events-none">
            <div className="bg-slate-950/88 backdrop-blur-xl rounded-xl px-4 py-2.5
                border border-white/5 shadow-2xl flex items-center gap-4
                pointer-events-auto">

                {/* NASA Status */}
                <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#3fff8b] animate-pulse" />
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">NASA FIRMS</span>
                </div>

                {total > 0 ? (
                    <>
                        <div className="w-px h-4 bg-slate-700" />
                        
                        {/* Yangın sayımı */}
                        <div className="flex items-center gap-2.5">
                            {redCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    <span className="text-[9px] text-red-400 font-bold">{redCount}</span>
                                </div>
                            )}
                            {yellowCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span className="text-[9px] text-amber-400 font-bold">{yellowCount}</span>
                                </div>
                            )}
                            {greenCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    <span className="text-[9px] text-green-400 font-bold">{greenCount}</span>
                                </div>
                            )}
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">= {total} Yangın</span>
                        </div>
                    </>
                ) : lastFetchTime && (
                    <>
                        <div className="w-px h-4 bg-slate-700" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">Aktif yangın kaydı bulunmamaktadır</span>
                        </div>
                    </>
                )}

                {lastFetchTime && (
                    <>
                        <div className="w-px h-4 bg-slate-700" />
                        <span className="text-[9px] text-slate-500">
                            Son: <span className="text-slate-400 font-semibold">{formatTime(lastFetchTime)}</span>
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
