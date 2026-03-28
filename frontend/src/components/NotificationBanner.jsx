/**
 * NotificationBanner.jsx — Canlı Tehdit Uyarısı
 */
export default function NotificationBanner() {
    return (
        <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
            <div className="bg-red-950/90 backdrop-blur-xl border border-red-500/30
                px-5 py-2 rounded-full flex items-center gap-3
                shadow-[0_4px_30px_rgba(239,68,68,0.15)] pointer-events-auto">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="material-symbols-outlined text-red-400 text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                <span className="text-[9px] font-black tracking-[0.18em] text-red-200 uppercase">
                    Türkiye Geneli Termal Anomali Taraması Aktif • NASA VIIRS
                </span>
            </div>
        </div>
    );
}
