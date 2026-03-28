import { useState, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RoutePanel from './components/RoutePanel';
import MapComponent from './components/MapComponent';
import Legend from './components/Legend';
import StatusBar from './components/StatusBar';
import { geocode, getAllRoutes } from './utils/routing';
import { fetchFirePoints } from './services/api';
import './index.css';

function App() {
    const [layers, setLayers] = useState({ fire: false });
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');

    // Yangın verisi — NASA FIRMS
    const [firePoints, setFirePoints] = useState([]);
    const [fireLoading, setFireLoading] = useState(false);
    const [fireError, setFireError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);

    // Rota durumu
    const [routeStatus, setRouteStatus] = useState({ status: 'idle', payload: null, error: null });

    // Seçili rota ID — kullanıcı panel veya harita üzerinden değiştirir
    const [selectedRouteId, setSelectedRouteId] = useState('safe');

    const toggleLayer = useCallback(async (layerName) => {
        if (layerName === 'fire' && !layers.fire && firePoints.length === 0 && !fireLoading) {
            setFireLoading(true);
            setFireError(null);
            try {
                const data = await fetchFirePoints();
                setFirePoints(data);
                setLastFetchTime(new Date());
            } catch (err) {
                console.error('Yangın verisi alınamadı:', err);
                setFireError(err.message);
            } finally {
                setFireLoading(false);
            }
        }
        setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    }, [layers.fire, firePoints.length, fireLoading]);

    const handleCalculateRoute = async () => {
        if (!fromInput.trim() || !toInput.trim()) {
            setRouteStatus({ status: 'error', error: 'Lütfen başlangıç ve hedef noktalarını girin.', payload: null });
            return;
        }

        setRouteStatus({ status: 'loading', payload: null, error: null });

        try {
            const fromGeo = await geocode(fromInput.trim());
            const toGeo   = await geocode(toInput.trim());

            if (!fromGeo || !toGeo) {
                setRouteStatus({ status: 'error', error: 'Konum bulunamadı. Lütfen geçerli bir şehir veya adres girin.', payload: null });
                return;
            }

            // Güvenli + tüm alternatif rotaları hesapla
            const { routes, threats } = await getAllRoutes(fromGeo, toGeo, firePoints);

            if (!routes.length) {
                setRouteStatus({ status: 'error', error: 'Rota hesaplanamadı.', payload: null });
                return;
            }

            // En yüksek güvenlik skorlu rotayı varsayılan seç
            const defaultId = routes.reduce(
                (best, r) => r.safetyScore > (routes.find(x => x.id === best)?.safetyScore ?? 0) ? r.id : best,
                routes[0].id
            );
            setSelectedRouteId(defaultId);

            setRouteStatus({
                status: 'success',
                error: null,
                payload: { fromName: fromGeo.name, toName: toGeo.name, fromGeo, toGeo, routes, threats },
            });

        } catch (err) {
            console.error(err);
            setRouteStatus({ status: 'error', error: 'Bağlantı hatası. Lütfen tekrar deneyin.', payload: null });
        }
    };

    const handleClearRoute = () => {
        setRouteStatus({ status: 'idle', payload: null, error: null });
        setFromInput('');
        setToInput('');
        setSelectedRouteId('safe');
    };

    const handleSelectRoute = useCallback((id) => {
        setSelectedRouteId(id);
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-background text-on-background">
            <MapComponent
                layers={layers}
                routeStatus={routeStatus}
                firePoints={firePoints}
                selectedRouteId={selectedRouteId}
                onSelectRoute={handleSelectRoute}
            />
            <Header
                fromInput={fromInput}
                setFromInput={setFromInput}
                toInput={toInput}
                setToInput={setToInput}
                onCalculateRoute={handleCalculateRoute}
                routeStatus={routeStatus}
            />
            <Sidebar
                layers={layers}
                toggleLayer={toggleLayer}
                firePoints={firePoints}
                fireLoading={fireLoading}
                fireError={fireError}
            />
            <RoutePanel
                routeStatus={routeStatus}
                selectedRouteId={selectedRouteId}
                onSelectRoute={handleSelectRoute}
                onClearRoute={handleClearRoute}
            />
            <Legend />
            <StatusBar firePoints={firePoints} lastFetchTime={lastFetchTime} />
        </div>
    );
}

export default App;
