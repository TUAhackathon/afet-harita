import { useState, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RoutePanel from './components/RoutePanel';
import MapComponent from './components/MapComponent';
import Legend from './components/Legend';
import NotificationBanner from './components/NotificationBanner';
import { geocode, getRoute, calculateSafety } from './utils/routing';
import { fetchFirePoints } from './services/api';
import './index.css';

function App() {
    const [layers, setLayers] = useState({ fire: false, flood: false });
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');

    // Yangın verisi — backend'den çekilir, App seviyesinde tutulur
    const [firePoints, setFirePoints] = useState([]);
    const [fireLoading, setFireLoading] = useState(false);
    const [fireError, setFireError] = useState(null);

    // status: 'idle' | 'loading' | 'success' | 'error'
    const [routeStatus, setRouteStatus] = useState({ status: 'idle', payload: null, error: null });

    const toggleLayer = useCallback(async (layerName) => {
        // Yangın katmanı ilk kez açılıyorsa veriyi çek
        if (layerName === 'fire' && !layers.fire && firePoints.length === 0 && !fireLoading) {
            setFireLoading(true);
            setFireError(null);
            try {
                const data = await fetchFirePoints();
                setFirePoints(data);
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
            const toGeo = await geocode(toInput.trim());

            if (!fromGeo || !toGeo) {
                setRouteStatus({ status: 'error', error: 'Konum bulunamadı. Lütfen geçerli bir şehir veya adres girin.', payload: null });
                return;
            }

            const routeObj = await getRoute(fromGeo, toGeo);
            if (!routeObj) {
                setRouteStatus({ status: 'error', error: 'Rota hesaplanamadı.', payload: null });
                return;
            }

            const routeCoords = routeObj.geometry.coordinates;
            const distKm = (routeObj.distance / 1000).toFixed(1);
            const durationMin = Math.round(routeObj.duration / 60);
            const safetyScore = calculateSafety(routeCoords);

            setRouteStatus({
                status: 'success',
                error: null,
                payload: {
                    fromName: fromGeo.name,
                    toName: toGeo.name,
                    fromGeo,
                    toGeo,
                    routeObj,
                    distanceKm: distKm,
                    durationMin,
                    safetyScore
                }
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
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-background text-on-background">
            <MapComponent layers={layers} routeStatus={routeStatus} firePoints={firePoints} />
            <Header 
                fromInput={fromInput} 
                setFromInput={setFromInput} 
                toInput={toInput} 
                setToInput={setToInput} 
                onCalculateRoute={handleCalculateRoute} 
            />
            <NotificationBanner />
            <Sidebar
                layers={layers}
                toggleLayer={toggleLayer}
                fireCount={firePoints.length}
                fireLoading={fireLoading}
                fireError={fireError}
            />
            <RoutePanel routeStatus={routeStatus} onClearRoute={handleClearRoute} />
            <Legend />
        </div>
    );
}

export default App;

