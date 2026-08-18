import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Phone, MessageCircle, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const artisanIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', 
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const clientIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png', 
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

export function LiveTrackingScreen() {
  const { navigateTo } = useApp();

  const clientLocation = [9.0632, 7.4233]; 
  const [artisanLocation, setArtisanLocation] = useState([9.0550, 7.4100]);
  const [eta, setEta] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setArtisanLocation(prev => {
        const [lat, lng] = prev;
        const [targetLat, targetLng] = clientLocation;
        
        const latDiff = targetLat - lat;
        const lngDiff = targetLng - lng;
        
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          clearInterval(interval);
          setEta(0);
          return [targetLat, targetLng];
        }

        return [
          lat + (latDiff * 0.05),
          lng + (lngDiff * 0.05)
        ];
      });

      setEta(prev => Math.max(0, prev - 1));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-[1000] pointer-events-none">
        <div className="pointer-events-auto bg-white/80 backdrop-blur-md">
          <Header backTo="client_dash" />
        </div>
      </div>

      <div className="flex-1 w-full h-full relative z-0 mt-16">
        <MapContainer 
          center={[9.0591, 7.4166]}
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <Marker position={clientLocation} icon={clientIcon}>
            <Popup>Your Location (Destination)</Popup>
          </Marker>
          <Marker position={artisanLocation} icon={artisanIcon}>
            <Popup>Artisan en route</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="absolute bottom-6 left-0 w-full px-4 z-[1000]">
        <div className="bg-white rounded-[24px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col gap-4 max-w-md mx-auto">
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <h3 className="text-xl font-extrabold text-[#0E3B40]">
                {eta > 0 ? 'Artisan is on the way' : 'Artisan has arrived!'}
              </h3>
            </div>
            <div className="bg-[#E8F5F6] text-[#16858F] px-4 py-2.5 rounded-[16px] font-bold flex flex-col items-center justify-center border border-[#16858F]/20">
              <span className="text-2xl leading-none">{eta > 0 ? `${eta}` : '0'}</span>
              <span className="text-[10px] uppercase tracking-wider mt-0.5">Mins</span>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 my-1"></div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&h=150&fit=crop" alt="Artisan" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#0E3B40] text-base">Sunday O.</h4>
              <p className="text-sm text-slate-500 font-medium">Expert Plumber</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-[#16858F] font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>Live Location Active</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              onClick={() => navigateTo('chat_screen')}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[14px] flex items-center justify-center gap-2 transition-all btn-press"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
            </button>
            <a 
              href="tel:+2348031234567"
              className="flex-1 py-3.5 bg-[#16858F] hover:bg-[#0E5C63] text-white font-bold rounded-[14px] flex items-center justify-center gap-2 transition-all shadow-sm btn-press"
            >
              <Phone className="w-5 h-5" />
              <span>Call</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
