import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Flame, 
  Droplet, 
  Search, 
  ChevronUp, 
  MapPin, 
  Camera, 
  Plus, 
  Languages, 
  ArrowLeft,
  Fuel,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import locales from './locales.json';
import './App.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// Custom Marker Component
const StationMarker = ({ station, type, onClick }) => {
  const icon = L.divIcon({
    className: `custom-marker marker-${type}`,
    html: `
      <div class="marker-inner">
        ${type === 'dealer' ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9h8"/><path d="M3 11V3h18v8"/><path d="m2 11 20 0"/><path d="m5 11 0 10"/><path d="m19 11 0 10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>' : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m17 2 3.26 3.26a1.5 1.5 0 0 1 0 2.12L17 10.64"/><path d="M3 12h18"/><path d="M3 7h18"/><path d="M3 17h18"/></svg>'}
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker position={[station.lat, station.lng]} icon={icon} eventHandlers={{ click: onClick }} />
  );
};

// Map View Controller
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

function App() {
  const [lang, setLang] = useState('en');
  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [userPos, setUserPos] = useState([6.9271, 79.8612]); // Default Colombo

  const t = locales[lang];

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fuel'); // 'fuel' or 'gas'
  const [selectedItemType, setSelectedItemType] = useState('petrol');
  const [selectedStatus, setSelectedStatus] = useState('normal');
  const [selectedUnits, setSelectedUnits] = useState(0);

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations');
      const data = await res.json();
      if (Array.isArray(data)) setStations(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    const interval = setInterval(fetchStations, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.address && s.address.toLowerCase().includes(search.toLowerCase()));
      const matchesTab = activeTab === 'gas' ? s.type === 'dealer' : s.type === 'shed';
      return matchesSearch && matchesTab;
    });
  }, [search, stations, activeTab]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!activeStation) return;

    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: activeStation.id,
          item_type: selectedItemType,
          queue_status: selectedStatus,
          units_available: parseInt(selectedUnits) || 0,
          photo_url: null
        })
      });

      if (res.ok) {
        setIsUpdating(false);
        fetchStations();
      }
    } catch (err) {
      alert('Error submitting update');
    }
  };

  const handleStationClick = (s) => {
    setActiveStation(s);
    setIsUpdating(false);
    // Suggest item type based on station type
    setSelectedItemType(s.type === 'dealer' ? 'litro' : 'petrol');
    setSelectedUnits(0);
  };

  return (
    <div className={`app-container ${lang === 'si' ? 'sinhala' : ''}`}>
      <header>
        <div className="logo-section">
          <Fuel size={28} color="var(--fuel)" />
          <h1>{t.title}</h1>
        </div>
        
        <div className="lang-switch">
          {['en', 'si', 'ta'].map(l => (
            <button 
              key={l} 
              className={`lang-btn ${lang === l ? 'active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>
      </header>

      <div className="main-container">
        {/* Map Layer */}
        <div className="map-wrapper">
          <MapContainer 
            center={userPos} 
            zoom={13} 
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {filteredStations.map(s => (
              <StationMarker 
                key={s.id} 
                station={s} 
                type={s.type} 
                onClick={() => handleStationClick(s)}
              />
            ))}
            <ChangeView center={userPos} zoom={13} />
          </MapContainer>
        </div>

        {/* Floating UI Layer */}
        <div className="overlay-layer">
          <div className="tab-switcher">
            <button 
              className={`lang-btn ${activeTab === 'fuel' ? 'active' : ''}`} 
              onClick={() => setActiveTab('fuel')}
            >
              <Droplet size={14} style={{ marginRight: 6 }} /> {t.view_fuel}
            </button>
            <button 
              className={`lang-btn ${activeTab === 'gas' ? 'active' : ''}`} 
              onClick={() => setActiveTab('gas')}
            >
              <Flame size={14} style={{ marginRight: 6 }} /> {t.view_gas}
            </button>
          </div>

          <div className="controls-overlay">
            <div className="search-bar">
              <Search size={20} color="var(--text-dim)" />
              <input 
                type="text" 
                placeholder={t.search} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {!activeStation && (
            <motion.button 
              className="fab"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => alert('Select a station on the map first')}
            >
              <Plus size={32} />
            </motion.button>
          )}
        </div>

        {/* Bottom Drawer */}
        <AnimatePresence>
          {activeStation && (
            <motion.div 
              className="bottom-panel active"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
              <div className="panel-handle" onClick={() => setActiveStation(null)} />
              
              {!isUpdating ? (
                <>
                  <div className="station-header">
                    <div className="station-title">
                      <h2>{activeStation.name}</h2>
                      <p><MapPin size={14} style={{ marginRight: 4 }} /> {activeStation.address}</p>
                    </div>
                    <button className="lang-btn" onClick={() => setActiveStation(null)}>Close</button>
                  </div>

                  <div className="status-grid">
                    {Object.entries(activeStation.items).map(([key, data]) => (
                      <div key={key} className="status-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, justifyContent: 'center' }}>
                          {key === 'litro' || key === 'laugfs' ? <Flame size={18} color="var(--gas)" /> : <Droplet size={18} color="var(--fuel)" />}
                          <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{t[key]}</span>
                        </div>
                        <div className={`status-badge status-${data.status}`}>
                          {t.status[data.status]}
                        </div>
                        {(key === 'litro' || key === 'laugfs') && (
                          <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--gas)', fontWeight: 700 }}>
                            {data.units} {t.units}
                          </p>
                        )}
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 8 }}>
                          {t.last_updated}: {data.updated ? new Date(data.updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </p>
                      </div>
                    ))}
                    {Object.keys(activeStation.items).length === 0 && (
                      <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <Info size={40} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.5 }} />
                        {t.status.no_data}
                      </p>
                    )}
                  </div>

                  <button 
                    className="fab" 
                    style={{ position: 'relative', bottom: 0, right: 0, width: '100%', marginTop: 24, borderRadius: 16 }}
                    onClick={() => setIsUpdating(true)}
                  >
                    <Plus size={20} style={{ marginRight: 8 }} /> {t.add_update}
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateSubmit}>
                  <div className="station-header">
                    <button type="button" className="lang-btn" onClick={() => setIsUpdating(false)}>
                      <ArrowLeft size={16} />
                    </button>
                    <h2>{t.add_update}</h2>
                    <div style={{ width: 40 }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <p style={{ marginBottom: 10, fontWeight: 600 }}>1. {t.select_station}</p>
                      <div className="status-card active">{activeStation.name}</div>
                    </div>

                    <div>
                      <p style={{ marginBottom: 10, fontWeight: 600 }}>2. {t.categories}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {activeStation.type === 'dealer' ? (
                          ['litro', 'laugfs'].map(i => (
                            <button key={i} type="button" className={`lang-btn ${selectedItemType === i ? 'active' : ''}`} onClick={() => setSelectedItemType(i)}>
                              {t[i]}
                            </button>
                          ))
                        ) : (
                          ['petrol', 'diesel'].map(i => (
                            <button key={i} type="button" className={`lang-btn ${selectedItemType === i ? 'active' : ''}`} onClick={() => setSelectedItemType(i)}>
                              {t[i]}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p style={{ marginBottom: 10, fontWeight: 600 }}>3. {t.queue_length}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['very_long', 'normal', 'short', 'no_queue'].map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            className={`lang-btn ${selectedStatus === s ? 'active' : ''}`}
                            onClick={() => setSelectedStatus(s)}
                            style={{ padding: '12px', fontSize: '0.9rem' }}
                          >
                            {t.status[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeStation.type === 'dealer' && (
                      <div>
                        <p style={{ marginBottom: 10, fontWeight: 600 }}>4. {t.units}</p>
                        <input 
                          type="number" 
                          className="search-bar" 
                          style={{ width: '100%', backdropFilter: 'none' }}
                          value={selectedUnits}
                          onChange={(e) => setSelectedUnits(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    )}

                    <button 
                      type="button" 
                      className="lang-btn" 
                      style={{ width: '100%', padding: 20, borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    >
                      <Camera size={24} /> {t.photo}
                    </button>

                    <button 
                      type="submit" 
                      className="fab" 
                      style={{ position: 'relative', bottom: 0, right: 0, width: '100%', borderRadius: 16 }}
                    >
                      {t.submit}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
