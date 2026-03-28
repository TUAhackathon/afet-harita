/**
 * Legend.jsx — Güncellendi: Çok rota + yangın seviyeleri
 */
export default function Legend() {
    const items = [
        { type: 'dot',  color: '#3fff8b', shadow: '0 0 8px #3fff8b', label: 'Güvenli Rota' },
        { type: 'dot',  color: '#94a3b8', shadow: '',                 label: 'Doğrudan Rota', dash: true },
        { type: 'dot',  color: '#60a5fa', shadow: '0 0 8px #60a5fa', label: 'Alternatif Rota', dash: true },
        { type: 'divider' },
        { type: 'dot',  color: '#ff4500', shadow: '0 0 8px #ff4500', label: 'Büyük Yangın' },
        { type: 'dot',  color: '#eab308', shadow: '0 0 8px #eab308', label: 'Orta Yangın' },
        { type: 'dot',  color: '#22c55e', shadow: '0 0 8px #22c55e', label: 'Küçük Yangın' },
    ];

    return (
        <div className="fixed bottom-14 left-[310px] z-40 pointer-events-none">
            <div className="bg-slate-950/88 backdrop-blur-xl px-4 py-3 rounded-xl border border-white/5 shadow-xl">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5">
                    Harita Lejantı
                </div>
                <div className="flex flex-col gap-1.5">
                    {items.map((item, i) => {
                        if (item.type === 'divider') {
                            return <div key={i} className="h-px bg-slate-800/80 my-0.5" />;
                        }
                        return (
                            <div key={i} className="flex items-center gap-2">
                                {item.dash ? (
                                    <div className="w-3 h-0 border-dashed border-t opacity-60"
                                        style={{ borderColor: item.color, borderWidth: '1.5px' }} />
                                ) : (
                                    <div className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: item.color, boxShadow: item.shadow }} />
                                )}
                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
