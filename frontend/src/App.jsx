import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RoutePanel from './components/RoutePanel';
import MapComponent from './components/MapComponent';
import Legend from './components/Legend';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';
import { geocode, getRoute, calculateSafety } from './utils/routing';
import { fetchFirePoints } from './services/api';
import './index.css';

function App() {
    const [layers, setLayers] = useState({ fire: false, flood: false });
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');
    
    // status: 'idle' | 'loading' | 'success' | 'error'
    const [routeStatus, setRouteStatus] = useState({ status: 'idle', payload: null, error: null });

    // Yangın verisi durumu
    const [firePoints, setFirePoints] = useState([]);
    const [fireLoading, setFireLoading] = useState(false);
    const [fireError, setFireError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);

    // Seçili rota ID
    const [selectedRouteId, setSelectedRouteId] = useState('safe');

    // Bildirim durumu
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const toggleLayer = useCallback(async (layerName) => {
        if (layerName === 'fire' && !layers.fire && firePoints.length === 0 && !fireLoading) {
            setFireLoading(true);
            setFireError(null);
            try {
                const data = await fetchFirePoints();
                setFirePoints(data);
                setLastFetchTime(new Date());
                if (data.length === 0) {
                    showToast("Şu anda Türkiye genelinde aktif yangın kaydı bulunmamaktadır.", 'info');
                }
            } catch (err) {
                console.error('Yangın verisi alınamadı:', err);
                setFireError(err.message);
                showToast("Yangın verileri alınırken bir hata oluştu.", "error");
            } finally {
                setFireLoading(false);
            }
        }
        setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    }, [layers, firePoints, fireLoading]);

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

    const handleSelectRoute = (id) => {
        setSelectedRouteId(id);
    };

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
                lastFetchTime={lastFetchTime}
            />
            <RoutePanel 
                routeStatus={routeStatus} 
                selectedRouteId={selectedRouteId}
                onSelectRoute={handleSelectRoute}
                onClearRoute={handleClearRoute} 
            />
            <Legend />
            <StatusBar firePoints={firePoints} lastFetchTime={lastFetchTime} />
            
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
    );
}

export default App;
