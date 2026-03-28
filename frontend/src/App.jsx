import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import RoutePanel from './components/RoutePanel';
import MapComponent from './components/MapComponent';
import Legend from './components/Legend';
import NotificationBanner from './components/NotificationBanner';
import { geocode, getRoute, calculateSafety } from './utils/routing';
import './index.css';

function App() {
    const [layers, setLayers] = useState({ fire: false, flood: false });
    const [fromInput, setFromInput] = useState('');
    const [toInput, setToInput] = useState('');
    
    // status: 'idle' | 'loading' | 'success' | 'error'
    const [routeStatus, setRouteStatus] = useState({ status: 'idle', payload: null, error: null });

    const toggleLayer = (layerName) => {
        setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
    };

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
            <MapComponent layers={layers} routeStatus={routeStatus} />
            <Header 
                fromInput={fromInput} 
                setFromInput={setFromInput} 
                toInput={toInput} 
                setToInput={setToInput} 
                onCalculateRoute={handleCalculateRoute} 
            />
            <NotificationBanner />
            <Sidebar layers={layers} toggleLayer={toggleLayer} />
            <RoutePanel routeStatus={routeStatus} onClearRoute={handleClearRoute} />
            <Legend />
        </div>
    );
}

export default App;
