import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Flame, 
  Droplet, 
  Search, 
  MapPin, 
  Plus, 
  ArrowLeft,
  Fuel,
  Info,
  Clock,
  Layers,
  Zap,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import locales from './locales.json';
import './App.css';

// Custom Marker Component
const StationMarker = ({ station, active, onClick }) => {
  const icon = L.divIcon({
    className: `custom-marker marker-${station.type === 'dealer' ? 'gas' : 'fuel'} ${active ? 'active' : ''}`,
    html: `
      <div class="marker-pin">
        ${station.type === 'dealer' 
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9h8"/><path d="M3 11V3h18v8"/><path d="m2 11 20 0"/><path d="m5 11 0 10"/><path d="m19 11 0 10"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>' 
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m17 2 3.26 3.26a1.5 1.5 0 0 1 0 2.12L17 10.64"/><path d="M3 12h18"/><path d="M3 7h18"/><path d="M3 17h18"/></svg>'}
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker position={[station.lat, station.lng]} icon={icon} eventHandlers={{ click: onClick }} />
  );
};

const ChangeView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

function App() {
  const [lang, setLang] = useState('si'); // Defaulting to Sinhala as requested
  const [stations, setStations] = useState([]);
  const [activeStation, setActiveStation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [userPos, setUserPos] = useState([6.9271, 79.8612]);
  const [activeTab, setActiveTab] = useState('fuel');
  
  // Selection states for update
  const [selectedItemType, setSelectedItemType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('normal');
  const [selectedUnits, setSelectedUnits] = useState(0);

  const t = locales[lang] || locales.en;

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/stations');
      if (!res.ok) throw new Error('API down');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (Array.isArray(data) && data.length > 0) {
        setStations(data);
      } else {
        throw new Error('Empty stations');
      }
    } catch (err) {
      console.warn('Fetch error, using default stations:', err);
      // Fallback mock data if DB is empty or API fails
      setStations([
        { id: 's1', name: 'Colombo Gas Center', type: 'dealer', lat: 6.9271, lng: 79.8612, address: '123 Main St, Colombo', items: { litro: { status: 'normal', units: 45, updated: new Date().toISOString() } } },
        { id: 's2', name: 'Lanka Fuel Shed', type: 'shed', lat: 6.9126, lng: 79.8646, address: 'Cinnamon Gardens, Col 7', items: { petrol_92: { status: 'very_long', updated: new Date().toISOString() }, auto_diesel: { status: 'short', updated: new Date().toISOString() } } },
        { id: 's3', name: 'Kollupitiya Super Shed', type: 'shed', lat: 6.9100, lng: 79.8510, address: 'Galle Road, Colombo 3', items: { petrol_95: { status: 'no_queue', updated: new Date().toISOString() }, super_diesel: { status: 'normal', updated: new Date().toISOString() } } },
      ]);
    }
  };

  useEffect(() => {
    fetchStations();
    const interval = setInterval(fetchStations, 15000); // More frequent polling
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!activeStation || !selectedItemType) return;

    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: activeStation.id,
          item_type: selectedItemType,
          queue_status: selectedStatus,
          units_available: parseInt(selectedUnits) || 0,
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

  const openUpdateForm = () => {
    if (!activeStation) return;
    setSelectedItemType(activeStation.type === 'dealer' ? 'litro' : 'petrol_92');
    setSelectedUnits(0);
    setSelectedStatus('normal');
    setIsUpdating(true);
  };

  return (
    <div className={`app-container ${lang === 'si' ? 'sinhala' : ''}`}>
      <header>
        <div className="logo-section">
          <Zap size={24} className="logo-icon" fill="var(--fuel)" color="var(--fuel)" />
          <h1>{t.title}</h1>
        </div>
        
        <div className="lang-switch">
          {['en', 'si', 'ta'].map(l => (
            <button key={l} className={`lang-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
              {l === 'en' ? 'EN' : l === 'si' ? 'සිං' : 'த'}
            </button>
          ))}
        </div>
      </header>

      <main className="main-container">
        <div className="map-wrapper">
          <MapContainer center={userPos} zoom={14} zoomControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OSM'
            />
            {filteredStations.map(s => (
              <StationMarker 
                key={s.id} 
                station={s} 
                active={activeStation?.id === s.id}
                onClick={() => { setActiveStation(s); setIsUpdating(false); }}
              />
            ))}
            <ChangeView center={userPos} />
          </MapContainer>
        </div>

        <div className="overlay-layer">
          <div className="top-controls">
            <div className="tab-switcher">
              <button 
                className={`tab-btn ${activeTab === 'fuel' ? 'active fuel' : ''}`} 
                onClick={() => setActiveTab('fuel')}
              >
                <Droplet size={18} /> {t.view_fuel}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'gas' ? 'active gas' : ''}`} 
                onClick={() => setActiveTab('gas')}
              >
                <Flame size={18} /> {t.view_gas}
              </button>
            </div>

            <div className="search-bar-container">
              <Search size={18} color="var(--text-dim)" />
              <input 
                type="text" 
                placeholder={t.search} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <AnimatePresence>
            {!activeStation && (
              <motion.button 
                className={`fab ${activeTab === 'gas' ? 'gas-theme' : ''}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => alert('Select a station on the map first')}
              >
                <Plus size={28} strokeWidth={3} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {activeStation && (
            <motion.div 
              className="bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="sheet-handle" onClick={() => setActiveStation(null)} />
              
              {!isUpdating ? (
                <>
                  <div className="station-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h2>{activeStation.name}</h2>
                        <p><MapPin size={14} /> {activeStation.address}</p>
                      </div>
                      <button className="lang-btn" onClick={() => setActiveStation(null)}>✕</button>
                    </div>
                  </div>

                  <div className="status-cards">
                    {Object.entries(activeStation.items).map(([key, data]) => (
                      <div key={key} className="item-card">
                        <span className="type-label">{t[key] || key}</span>
                        <div className="status-text" style={{ color: `var(--status-${data.status === 'no_queue' ? 'no' : data.status === 'short' ? 'short' : data.status === 'normal' ? 'normal' : 'long'})` }}>
                          {t.status[data.status]}
                        </div>
                        <div className="status-indicator">
                          <div className={`indicator-fill status-${data.status}`} />
                        </div>
                        {activeStation.type === 'dealer' && (
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', margin: '4px 0' }}>
                            {data.units} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t.units}</span>
                          </div>
                        )}
                        <div className="update-time">
                          <Clock size={10} style={{ marginRight: 4 }} />
                          {data.updated ? new Date(data.updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </div>
                    ))}
                    {Object.keys(activeStation.items).length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', opacity: 0.6 }}>
                        <Info size={32} style={{ marginBottom: 8 }} />
                        <p>{t.status.no_data}</p>
                      </div>
                    )}
                  </div>

                  <button className="submit-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} onClick={openUpdateForm}>
                    <Navigation size={18} /> {t.add_update}
                  </button>
                </>
              ) : (
                <form className="form-section" onSubmit={handleUpdateSubmit}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" className="lang-btn" onClick={() => setIsUpdating(false)}>
                      <ArrowLeft size={18} />
                    </button>
                    <h2 style={{ fontSize: '1.2rem' }}>{t.add_update}</h2>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 8 }}>{t.categories}</p>
                    <div className="selection-group">
                      {(activeStation.type === 'dealer' ? ['litro', 'laugfs'] : ['petrol_92', 'petrol_95', 'auto_diesel', 'super_diesel', 'kerosene']).map(i => (
                        <button 
                          key={i} 
                          type="button" 
                          className={`choice-btn ${selectedItemType === i ? 'active' : ''}`} 
                          onClick={() => setSelectedItemType(i)}
                        >
                          {t[i] || i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 8 }}>{t.queue_length}</p>
                    <div className="selection-group">
                      {['no_queue', 'short', 'normal', 'very_long'].map(s => (
                        <button 
                          key={s} 
                          type="button" 
                          className={`choice-btn ${selectedStatus === s ? 'active' : ''}`}
                          onClick={() => setSelectedStatus(s)}
                        >
                          {t.status[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeStation.type === 'dealer' && (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 8 }}>{t.units}</p>
                      <div className="search-bar-container">
                        <input 
                          type="number" 
                          value={selectedUnits}
                          onChange={(e) => setSelectedUnits(e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="submit-btn">
                    {t.submit}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
