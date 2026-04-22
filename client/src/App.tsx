import React, { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getProperties } from './services/api';
import FilterBar from './components/Filters/FilterBar';
import PropertyPanel from './components/Layout/PropertyPanel';
import DrawControl from './components/Map/DrawControl';
import { Maximize2, Heart, Bookmark, Bed, Shield, Plus, Map as MapIcon, Users } from 'lucide-react';
import FlatmateFilters from './components/Flatmate/FlatmateFilters';
import FlatmateList from './components/Flatmate/FlatmateList';
import FlatmatePanel from './components/Flatmate/FlatmatePanel';
import AddListingModal from './components/Listings/AddListingModal';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const formatPrice = (price: number) => {
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}k`;
  return `₹${price}`;
};

export default function App() {
  const [mode, setMode] = useState<'flat' | 'flatmate'>('flat');
  const [flatmateFilters, setFlatmateFilters] = useState<any>({});
  const [selectedFlatmate, setSelectedFlatmate] = useState<any | null>(null);
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [flatmateRefreshKey, setFlatmateRefreshKey] = useState(0);

  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [mapStyle, setMapStyle] = useState('streets-v11');
  const [bounds, setBounds] = useState<any>(null);
  const [polygon, setPolygon] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [viewState, setViewState] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    zoom: 11
  });
  
  // Wishlist State
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(savedIds));
  }, [savedIds]);

  const toggleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      const b = mapRef.current.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      setBounds([[sw.lng, sw.lat], [ne.lng, ne.lat]]);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const params = {
        ...filters,
        bounds: bounds && !polygon ? JSON.stringify(bounds) : undefined,
        polygon: polygon ? JSON.stringify(polygon) : undefined
      };
      const data = await getProperties(params);
      
      // Client-side filtering for wishlist if active
      const finalData = showSavedOnly ? data.filter((p: any) => savedIds.includes(p._id)) : data;
      setProperties(finalData);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  }, [bounds, filters, polygon, showSavedOnly, savedIds]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onMove = useCallback(({ viewState }: any) => {
    setViewState(viewState);
    if (mapRef.current) {
      const b = mapRef.current.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      setBounds([[sw.lng, sw.lat], [ne.lng, ne.lat]]);
    }
  }, []);

  const onDrawUpdate = useCallback((e: any) => {
    if (e.features.length > 0) setPolygon(e.features[0].geometry.coordinates[0]);
    else setPolygon(null);
  }, []);

  const onDrawDelete = useCallback(() => setPolygon(null), []);
  const handleMarkerClick = (property: any) => setSelectedProperty(property);

  return (
    <div className="h-screen w-screen relative bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 w-full z-40 flex flex-col items-center">
        <div className="w-full h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200">

          {/* Company name — always visible */}
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-black tracking-tighter text-slate-800 leading-none">
              Delhi NCR <span className="text-indigo-600">Rentals</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Premium Living</span>
          </div>

          {/* Desktop-only: mode toggle + actions */}
          <div className="hidden md:flex items-center gap-3 bg-slate-100/80 p-1.5 rounded-[1.2rem] border border-slate-200/60 shadow-inner">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-3 pr-1 hidden lg:block">Looking for:</div>
            <button
              onClick={() => setMode('flat')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'flat' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Flat
            </button>
            <button
              onClick={() => setMode('flatmate')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'flatmate' ? 'bg-white text-indigo-600 shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Flatmate
            </button>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setIsAddListingOpen(true)}
              className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-2.5 rounded-2xl transition-all font-black text-xs uppercase tracking-wider bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add listing</span>
            </button>
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-2.5 rounded-2xl transition-all font-black text-xs uppercase tracking-wider ${
                showSavedOnly ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${showSavedOnly ? 'fill-current' : ''}`} />
              <span>Saved {savedIds.length > 0 && `(${savedIds.length})`}</span>
            </button>
          </div>
        </div>

        {/* Filter bar — desktop only floats below header */}
        {mode === 'flat' && (
          <div className="hidden md:flex w-full justify-center mt-6 px-4 pointer-events-none">
            <div className="pointer-events-auto">
              <FilterBar onFilterChange={setFilters} onStyleChange={setMapStyle} mapStyle={mapStyle} currentFilters={filters} />
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 flex bg-slate-50 pt-16 md:pt-20 pb-0 md:pb-0 relative overflow-hidden">
        {mode === 'flat' ? (
          <>
        <aside className="hidden md:flex flex-col w-[360px] h-full bg-white border-r border-slate-200 z-10 shadow-2xl">
          <div className="p-6 border-b border-slate-100 bg-slate-50/20">
            <div className="flex justify-between items-end mb-1">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {showSavedOnly ? "Your Wishlist" : "Properties"}
              </h2>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl">{properties.length} Results</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {properties.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <Bookmark className="w-12 h-12 mb-4" />
                <div className="font-black uppercase text-xs">No properties found</div>
              </div>
            )}
            {properties.map((prop) => (
              <div
                key={prop._id}
                onClick={() => setSelectedProperty(prop)}
                className={`group bg-white rounded-[2rem] border-2 transition-all duration-500 cursor-pointer overflow-hidden
                  ${selectedProperty?._id === prop._id ? "border-indigo-600 shadow-2xl scale-[1.02]" : "border-slate-50 shadow-sm hover:border-slate-200"}
                `}
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={prop.images?.[0]} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                    {prop.femaleOnly && (
                      <div className="bg-pink-500 text-white px-2 py-1 rounded-xl text-[9px] font-black uppercase shadow-sm flex items-center gap-1 border border-pink-400">
                        <Shield className="w-3 h-3 fill-current" /> Female Only
                      </div>
                    )}
                    <div className="bg-white/95 backdrop-blur px-2.5 py-1 rounded-xl text-[9px] font-black uppercase shadow-sm text-slate-800">
                      {prop.bhk === 0.5 ? '1RK' : `${prop.bhk} BHK`}
                    </div>
                  </div>
                  {/* Heart Toggle */}
                  <button 
                    onClick={(e: any) => toggleSave(e, prop._id)}
                    className={`absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-xl backdrop-blur-md
                      ${savedIds.includes(prop._id) ? "bg-red-500 text-white" : "bg-white/80 text-slate-400 hover:text-red-500"}`}
                  >
                    <Heart className={`w-5 h-5 ${savedIds.includes(prop._id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-slate-800 uppercase text-sm truncate mr-2">{prop.title}</h3>
                      <span className="text-lg font-black text-indigo-600 leading-none">{formatPrice(prop.price)}</span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest items-center mt-3">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                        <Bed className="w-3.5 h-3.5 text-indigo-500" />
                      {prop.bhk === 0.5 ? '1RK' : `${prop.bhk} BHK`}
                      </span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                        {prop.size} sqft
                      </span>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 relative">
          <Map
            {...viewState}
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            onMove={onMove}
            onLoad={onMapLoad}
            mapStyle={`mapbox://styles/mapbox/${mapStyle}`}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="bottom-right" />
            <GeolocateControl 
              position="bottom-right" 
              trackUserLocation 
              showUserLocation 
              onGeolocate={(e: any) => setUserLocation([e.coords.longitude, e.coords.latitude])} 
            />
            <DrawControl position="top-right" onCreate={onDrawUpdate} onUpdate={onDrawUpdate} onDelete={onDrawDelete} />

            {/* SIMPLE COST PINS ONLY (NO CLUSTERING) */}
            {properties.map((prop) => (
              <Marker 
                key={`prop-${prop._id}`} 
                latitude={prop.location.coordinates[1]} 
                longitude={prop.location.coordinates[0]} 
                anchor="bottom"
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(prop);
                }}
              >
                <div 
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleMarkerClick(prop);
                  }}
                  onTouchEnd={(e: any) => {
                    e.stopPropagation();
                    handleMarkerClick(prop);
                  }}
                  className={`relative cursor-pointer transition-all duration-300 transform hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]
                    ${selectedProperty?._id === prop._id ? "z-50 scale-125" : "z-10"}`}
                >
                  <div className={`px-5 py-2.5 rounded-[1.2rem] font-black text-sm shadow-2xl border-[3.5px] transition-all
                    ${selectedProperty?._id === prop._id 
                      ? "bg-indigo-600 text-white border-white scale-110" 
                      : "bg-white text-indigo-800 border-indigo-600"
                    }`}
                  >
                    {formatPrice(prop.price)}
                    {savedIds.includes(prop._id) && <Heart className="absolute -top-2 -right-2 w-4 h-4 fill-red-500 text-red-500 filter drop-shadow-md" />}
                  </div>
                  <div className={`mx-auto w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px]
                    ${selectedProperty?._id === prop._id ? "border-t-indigo-600" : "border-t-indigo-600"}`} 
                  />
                </div>
              </Marker>
            ))}
          </Map>
          

        </main>
        </>
        ) : (
          <>
            <aside className="hidden md:flex flex-col w-[360px] h-full bg-white border-r border-slate-200 z-10 shadow-2xl relative">
              <FlatmateFilters filters={flatmateFilters} setFilters={setFlatmateFilters} />
            </aside>
            <main className="flex-1 relative bg-slate-50 h-full">
              <FlatmateList
                filters={flatmateFilters}
                onSelect={setSelectedFlatmate}
                selectedId={selectedFlatmate?._id || null}
                refreshKey={flatmateRefreshKey}
                savedIds={savedIds}
                onToggleSave={toggleSave}
              />
            </main>
          </>
        )}
      </div>

      {mode === 'flat' ? (
        <PropertyPanel 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
          userLocation={userLocation}
          isSaved={selectedProperty ? savedIds.includes(selectedProperty._id) : false}
          onToggleSave={selectedProperty ? (e) => toggleSave(e, selectedProperty._id) : () => {}}
        />
      ) : (
        <FlatmatePanel
          req={selectedFlatmate}
          onClose={() => setSelectedFlatmate(null)}
          isSaved={selectedFlatmate ? savedIds.includes(selectedFlatmate._id) : false}
          onToggleSave={selectedFlatmate ? (e) => toggleSave(e, selectedFlatmate._id) : () => {}}
        />
      )}

      <AddListingModal
        isOpen={isAddListingOpen}
        onClose={() => setIsAddListingOpen(false)}
        onCreated={() => {
          fetchProperties();
          setFlatmateRefreshKey(k => k + 1);
        }}
      />

      {/* ===== MOBILE FLOATING FILTER BAR (above map, above bottom nav) ===== */}
      {mode === 'flat' && (
        <div className="md:hidden fixed bottom-[84px] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto pb-1">
            <FilterBar onFilterChange={setFilters} onStyleChange={setMapStyle} mapStyle={mapStyle} currentFilters={filters} />
          </div>
        </div>
      )}

      {/* ===== MOBILE STICKY BOTTOM NAV ===== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <nav
          className="w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex items-stretch"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Flat */}
          <button
            onClick={() => setMode('flat')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 ${mode === 'flat' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Flat</span>
          </button>

          {/* Flatmate */}
          <button
            onClick={() => setMode('flatmate')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 ${mode === 'flatmate' ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Flatmate</span>
          </button>

          {/* Add Listing */}
          <button
            onClick={() => setIsAddListingOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 text-slate-400"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Add</span>
          </button>

          {/* Saved */}
          <button
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all active:scale-95 relative ${showSavedOnly ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Heart className={`w-5 h-5 ${showSavedOnly ? 'fill-current text-red-500' : ''}`} />
            {savedIds.length > 0 && (
              <span className="absolute top-2 right-[calc(50%-14px)] w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                {savedIds.length}
              </span>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
          </button>
        </nav>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
