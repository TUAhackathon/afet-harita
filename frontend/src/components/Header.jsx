export default function Header({ fromInput, setFromInput, toInput, setToInput, onCalculateRoute }) {
    const handleKeyDown = (e, nextId) => {
        if (e.key === 'Enter') {
            if (nextId === 'calculate') {
                onCalculateRoute();
            } else {
                document.getElementById(nextId)?.focus();
            }
        }
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] w-[480px] max-w-[90vw]">
            <div className="flex items-center gap-2 w-full bg-slate-950/80 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-slate-700/50">
                <div className="pl-3 pr-1 hidden sm:block">
                    <span className="material-symbols-outlined text-emerald-400 text-xl animate-pulse">radar</span>
                </div>
                
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">my_location</span>
                    <input 
                        id="input-from"
                        value={fromInput}
                        onChange={(e) => setFromInput(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'input-to')}
                        className="w-full bg-slate-800/50 border-none rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder:text-slate-500 outline-none transition-all"
                        placeholder="Nereden..." 
                        type="text" 
                    />
                </div>
                
                <span className="material-symbols-outlined text-slate-500 text-sm mx-1 hidden sm:block">arrow_forward</span>
                
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-red-500 text-sm">location_on</span>
                    <input 
                        id="input-to"
                        value={toInput}
                        onChange={(e) => setToInput(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, 'calculate')}
                        className="w-full bg-slate-800/50 border-none rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-emerald-500 text-slate-200 placeholder:text-slate-500 outline-none transition-all"
                        placeholder="Nereye..." 
                        type="text" 
                    />
                </div>
                
                <button 
                    id="calculate"
                    onClick={onCalculateRoute}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all active:scale-95 group shadow-lg ml-1 whitespace-nowrap"
                >
                    <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">route</span>
                    ROTA
                </button>
            </div>
        </div>
    );
}
