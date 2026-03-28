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
        <header className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-6 h-16 max-w-7xl mx-auto rounded-full mt-4 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_20px_rgba(63,255,139,0.1)]">
            <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">radar</span>
                <h1 className="font-headline tracking-widest text-xl text-emerald-400 font-black uppercase hidden sm:block">VIGILANT LENS</h1>
            </div>
            
            <div className="flex-1 max-w-xl mx-4 relative z-[1001]">
                <div className="flex items-center gap-2 w-full">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">my_location</span>
                        <input 
                            id="input-from"
                            value={fromInput}
                            onChange={(e) => setFromInput(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'input-to')}
                            className="w-full bg-surface-container-highest/50 border-none rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                            placeholder="Başlangıç noktası..." 
                            type="text" 
                        />
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm hidden md:block">arrow_forward</span>
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-red-400 text-sm">location_on</span>
                        <input 
                            id="input-to"
                            value={toInput}
                            onChange={(e) => setToInput(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'calculate')}
                            className="w-full bg-surface-container-highest/50 border-none rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                            placeholder="Hedef noktası..." 
                            type="text" 
                        />
                    </div>
                    <button 
                        id="calculate"
                        onClick={onCalculateRoute}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all active:scale-95 whitespace-nowrap z-[1001]"
                    >
                        <span className="material-symbols-outlined text-sm">route</span>
                        <span className="hidden md:inline">ROTA</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="hidden md:flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-xl text-xs font-bold tracking-wider hover:bg-slate-700/50 transition-all active:scale-95 duration-150">
                    <span className="material-symbols-outlined text-sm">layers</span>
                    KATMANLAR
                </button>
                <div className="relative">
                    <span className="material-symbols-outlined text-emerald-400">notifications_active</span>
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full animate-ping"></span>
                </div>
            </div>
        </header>
    );
}
