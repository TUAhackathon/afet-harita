/**
 * Header.jsx — BKZS Komuta Çubuğu
 * Sistem logosu + arama girişleri + rota hesaplama butonu
 */
export default function Header({ fromInput, setFromInput, toInput, setToInput, onCalculateRoute, routeStatus, isSidebarOpen }) {
    const isLoading = routeStatus?.status === 'loading';

    const handleKeyDown = (e, nextId) => {
        if (e.key === 'Enter') {
            if (nextId === 'calculate') onCalculateRoute();
            else document.getElementById(nextId)?.focus();
        }
    };

    return (
        <header className={`fixed top-0 right-0 z-[1000] flex items-center justify-center px-6 pt-4 pb-2 pointer-events-none transition-all duration-500 ease-in-out ${
            isSidebarOpen ? 'left-[300px]' : 'left-0'
        }`}>
            <div className="w-full max-w-4xl flex items-center gap-3 pointer-events-auto">



                {/* ── Arama & Rota Kutusu ───────────────── */}
                <div className="flex-1 flex items-center gap-2 bg-slate-950/90 backdrop-blur-2xl p-2 rounded-2xl border border-slate-700/40 shadow-2xl">
                    {/* Nereden */}
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
                        <input
                            id="input-from"
                            value={fromInput}
                            onChange={e => setFromInput(e.target.value)}
                            onKeyDown={e => handleKeyDown(e, 'input-to')}
                            className="w-full bg-slate-800/60 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/60 transition-all"
                            placeholder="Nereden..."
                            type="text"
                        />
                    </div>

                    {/* Ayraç */}
                    <span className="material-symbols-outlined text-slate-600 text-base shrink-0">east</span>

                    {/* Nereye */}
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-red-400 text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        <input
                            id="input-to"
                            value={toInput}
                            onChange={e => setToInput(e.target.value)}
                            onKeyDown={e => handleKeyDown(e, 'calculate')}
                            className="w-full bg-slate-800/60 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500/60 transition-all"
                            placeholder="Nereye..."
                            type="text"
                        />
                    </div>

                    {/* Hesapla Butonu */}
                    <button
                        id="calculate"
                        onClick={onCalculateRoute}
                        disabled={isLoading}
                        className="relative overflow-hidden flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all active:scale-95 shadow-lg shrink-0 group cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                <span>Hesaplanıyor</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                                <span>Güvenli Rota</span>
                            </>
                        )}
                        {/* Shimmer efekti */}
                        {!isLoading && (
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
