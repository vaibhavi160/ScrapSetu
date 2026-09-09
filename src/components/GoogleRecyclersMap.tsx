import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, Navigation, ExternalLink, ShieldCheck, Star, 
  Layers, Plus, Phone, CheckCircle, Compass, Maximize2, RefreshCw
} from 'lucide-react';
import { Recycler, Language, WasteCategory } from '../types';
import { getGoogleMapsDirectionsUrl } from '../utils/geo';

// @vis.gl/react-google-maps imports
import { 
  APIProvider, 
  Map as VisGlMap, 
  AdvancedMarker, 
  Pin as VisGlPin, 
  InfoWindow as VisGlInfoWindow 
} from '@vis.gl/react-google-maps';

interface GoogleRecyclersMapProps {
  recyclers: Recycler[];
  selectedRecyclerId: string | null;
  onSelectRecycler: (recycler: Recycler) => void;
  collectorLoc: {
    lat: number;
    lng: number;
    areaName: string;
    source?: 'gps' | 'fallback';
  };
  language?: Language;
  height?: string;
  onAddRecyclersClick?: () => void;
  onPickCoordinates?: (lat: number, lng: number) => void;
  pickingMode?: boolean;
}

export const GoogleRecyclersMap: React.FC<GoogleRecyclersMapProps> = ({
  recyclers,
  selectedRecyclerId,
  onSelectRecycler,
  collectorLoc,
  language = 'en',
  height = '420px',
  onAddRecyclersClick,
  onPickCoordinates,
  pickingMode = false,
}) => {
  const apiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'satellite'>('roadmap');
  const [zoomLevel, setZoomLevel] = useState<number>(11);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: collectorLoc.lat || 19.0760,
    lng: collectorLoc.lng || 72.8777,
  });
  const [showInfoWindow, setShowInfoWindow] = useState<boolean>(true);

  // Keep center updated when collectorLoc changes
  useEffect(() => {
    if (collectorLoc.lat && collectorLoc.lng) {
      setCenter({ lat: collectorLoc.lat, lng: collectorLoc.lng });
    }
  }, [collectorLoc.lat, collectorLoc.lng]);

  const selectedRecycler = useMemo(() => {
    return recyclers.find((r) => r.id === selectedRecyclerId) || recyclers[0] || null;
  }, [recyclers, selectedRecyclerId]);

  // Center on collector
  const handleCenterOnCollector = () => {
    setCenter({ lat: collectorLoc.lat, lng: collectorLoc.lng });
    setZoomLevel(13);
  };

  // Center on selected recycler
  const handleCenterOnRecycler = (r: Recycler) => {
    onSelectRecycler(r);
    setCenter({ lat: r.lat, lng: r.lng });
    setShowInfoWindow(true);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#DDE6E0] bg-[#EBF0ED] shadow-sm flex flex-col" style={{ height }}>
      {/* MAP HEADER / CONTROLS OVERLAY */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Location & Count Pill */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#17231D] border border-[#DDE6E0] flex items-center gap-2 shadow-xs pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="truncate max-w-[170px] sm:max-w-[220px]">
            {collectorLoc.areaName || 'Mumbai Scrap Hub'}
          </span>
          <span className="text-[10px] bg-[#E8F3ED] text-[#176B45] px-2 py-0.5 rounded-full font-bold">
            {recyclers.length} {language === 'hi' ? 'रीसाइक्लर' : 'Recyclers'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {onAddRecyclersClick && (
            <button
              type="button"
              id="map-add-recyclers-btn"
              onClick={onAddRecyclersClick}
              className="bg-[#176B45] hover:bg-[#125335] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Add single or multiple recyclers to Google Map and Firebase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? '+ रीसाइक्लर जोड़ें' : '+ Add Recyclers'}</span>
            </button>
          )}

          <button
            type="button"
            id="map-recenter-btn"
            onClick={handleCenterOnCollector}
            className="bg-white hover:bg-[#F3F4F6] text-[#17231D] p-2 rounded-full border border-[#DDE6E0] shadow-xs transition-all cursor-pointer"
            title="Recenter on My Location"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* PICKING MODE BANNER */}
      {pickingMode && (
        <div className="absolute top-14 left-3 right-3 z-20 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Click anywhere on the map to pick coordinates for your new recycler</span>
          </div>
        </div>
      )}

      {/* GOOGLE MAPS CONTENT */}
      {apiKey ? (
        // PRODUCTION / DEMO KEY: Use official @vis.gl/react-google-maps SDK
        <div className="w-full h-full relative">
          <APIProvider apiKey={apiKey} solutionChannel="gmp_mcp_codeassist_v1_aistudio">
            <VisGlMap
              style={{ width: '100%', height: '100%' }}
              defaultCenter={center}
              center={center}
              defaultZoom={zoomLevel}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              mapTypeId={activeTab === 'roadmap' ? 'roadmap' : 'hybrid'}
              onClick={(e) => {
                if (pickingMode && onPickCoordinates && e.detail.latLng) {
                  onPickCoordinates(e.detail.latLng.lat, e.detail.latLng.lng);
                }
              }}
            >
              {/* Collector GPS Marker */}
              <AdvancedMarker position={{ lat: collectorLoc.lat, lng: collectorLoc.lng }}>
                <div className="relative flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                  </div>
                  <div className="absolute -bottom-5 bg-blue-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    {language === 'hi' ? 'आप यहां हैं' : 'Your GPS'}
                  </div>
                </div>
              </AdvancedMarker>

              {/* Recycler Markers */}
              {recyclers.map((rec) => {
                const isSelected = rec.id === selectedRecycler?.id;
                return (
                  <AdvancedMarker
                    key={rec.id}
                    position={{ lat: rec.lat, lng: rec.lng }}
                    onClick={() => handleCenterOnRecycler(rec)}
                  >
                    <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-md ${
                        isSelected 
                          ? 'bg-[#176B45] text-white border-white ring-2 ring-[#176B45]/40' 
                          : 'bg-white text-[#17231D] border-[#CBD5E1]'
                      }`}>
                        <span>{rec.name.slice(0, 14)}</span>
                        {rec.priceMultiplier > 1 && (
                          <span className="text-[9px] bg-amber-400 text-gray-900 px-1 rounded-sm font-black">
                            +{Math.round((rec.priceMultiplier - 1) * 100)}%
                          </span>
                        )}
                      </div>
                      <VisGlPin
                        background={isSelected ? '#176B45' : '#0F766E'}
                        borderColor="#ffffff"
                        glyphColor="#ffffff"
                        scale={isSelected ? 1.2 : 0.9}
                      />
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Info Window for Selected Recycler */}
              {selectedRecycler && showInfoWindow && (
                <VisGlInfoWindow
                  position={{ lat: selectedRecycler.lat, lng: selectedRecycler.lng }}
                  onCloseClick={() => setShowInfoWindow(false)}
                >
                  <div className="p-1 max-w-[220px] text-[#17231D]">
                    <div className="flex items-center gap-1 font-bold text-xs text-[#176B45]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="truncate">{selectedRecycler.name}</span>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5 truncate">
                      {selectedRecycler.address}, {selectedRecycler.city}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-200 text-[10px]">
                      <span className="font-semibold text-emerald-700">
                        {selectedRecycler.priceMultiplier > 1 ? `+${Math.round((selectedRecycler.priceMultiplier - 1) * 100)}% Bonus Rate` : 'Fair Price'}
                      </span>
                      <a
                        href={getGoogleMapsDirectionsUrl(selectedRecycler.lat, selectedRecycler.lng, selectedRecycler.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        Navigate
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </VisGlInfoWindow>
              )}
            </VisGlMap>
          </APIProvider>
        </div>
      ) : (
        // NO API KEY CONFIGURED YET: High-Fidelity Interactive Google Maps Simulator & Coordinates Projection
        <div 
          className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
          onClick={(e) => {
            if (pickingMode && onPickCoordinates) {
              const rect = e.currentTarget.getBoundingClientRect();
              const xRatio = (e.clientX - rect.left) / rect.width;
              const yRatio = (e.clientY - rect.top) / rect.height;
              // Project relative coords around Mumbai cluster
              const pickedLat = Math.round((19.25 - yRatio * 0.35) * 10000) / 10000;
              const pickedLng = Math.round((72.78 + xRatio * 0.40) * 10000) / 10000;
              onPickCoordinates(pickedLat, pickedLng);
            }
          }}
        >
          {/* Real Map Tiles Styling / Vector Grid */}
          <div className="absolute inset-0 bg-[#E8ECE9]">
            {/* Map Roads & Geography Canvas */}
            <svg className="w-full h-full absolute inset-0 opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gmap-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#D1D5DB" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gmap-grid)" />
              {/* Coastline / Creek */}
              <path d="M-10,320 Q90,260 140,200 T210,90 Q240,40 280,-10" fill="none" stroke="#BAE6FD" strokeWidth="28" />
              {/* National Highways (Yellow/Orange) */}
              <path d="M-30,160 Q180,120 380,180 T750,150" fill="none" stroke="#FFFFFF" strokeWidth="12" />
              <path d="M-30,160 Q180,120 380,180 T750,150" fill="none" stroke="#FBBF24" strokeWidth="4" />
              <path d="M140,-20 Q160,180 180,420" fill="none" stroke="#FFFFFF" strokeWidth="10" />
              <path d="M140,-20 Q160,180 180,420" fill="none" stroke="#FBBF24" strokeWidth="3" />
              {/* Secondary Roads (White) */}
              <path d="M300,-20 Q280,200 310,420" fill="none" stroke="#FFFFFF" strokeWidth="7" />
              <path d="M-20,290 Q220,260 520,310" fill="none" stroke="#FFFFFF" strokeWidth="7" />
            </svg>
          </div>

          {/* Collector GPS Marker */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: '42%', top: '56%' }}
          >
            <div className="relative flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                <Navigation className="w-3.5 h-3.5 rotate-45" />
              </div>
              <div className="bg-blue-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                {language === 'hi' ? 'आप (GPS)' : 'You (GPS)'}
              </div>
            </div>
          </div>

          {/* Recyclers Pins Projected on Canvas */}
          {recyclers.map((rec, idx) => {
            // Project relative position based on lat/lng or cyclic offset
            const minLat = 18.90, maxLat = 19.30;
            const minLng = 72.80, maxLng = 73.15;
            let leftPct = ((rec.lng - minLng) / (maxLng - minLng)) * 80 + 10;
            let topPct = (1 - (rec.lat - minLat) / (maxLat - minLat)) * 80 + 10;

            if (isNaN(leftPct) || leftPct < 5 || leftPct > 95) {
              leftPct = 20 + ((idx * 23) % 65);
            }
            if (isNaN(topPct) || topPct < 5 || topPct > 95) {
              topPct = 20 + ((idx * 31) % 65);
            }

            const isSelected = rec.id === selectedRecycler?.id;

            return (
              <div
                key={rec.id}
                id={`map-marker-${rec.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCenterOnRecycler(rec);
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all ${
                  isSelected ? 'scale-110 z-30' : 'scale-95 hover:scale-105'
                }`}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              >
                <div className="flex flex-col items-center">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-sm whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#176B45] text-white border-white ring-2 ring-[#176B45]/40'
                      : 'bg-white text-[#17231D] border-[#CBD5E1]'
                  }`}>
                    <span>{rec.name.slice(0, 16)}</span>
                    {rec.priceMultiplier > 1 && (
                      <span className="text-[9px] bg-amber-400 text-gray-900 px-1 rounded-sm font-black">
                        +{Math.round((rec.priceMultiplier - 1) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center text-white ${
                    isSelected ? 'bg-[#176B45]' : 'bg-[#0F766E]'
                  }`}>
                    <MapPin className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Recyclers Legend / Status */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-[#475467] font-semibold border border-[#DDE6E0] shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#176B45]" />
            <span>Google Maps Platform • CPCB Certified Network</span>
          </div>
        </div>
      )}

      {/* SELECTED RECYCLER BOTTOM DRAWER / INFO CARD */}
      {selectedRecycler && (
        <div className="p-3 bg-white border-t border-[#DDE6E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8F3ED] text-[#176B45] flex items-center justify-center shrink-0 font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-sm text-[#17231D] truncate">
                  {selectedRecycler.name}
                </h4>
                {selectedRecycler.spcbCertified && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                    CPCB/SPCB Auth
                  </span>
                )}
                {selectedRecycler.priceMultiplier > 1 && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black">
                    +{Math.round((selectedRecycler.priceMultiplier - 1) * 100)}% Fair Premium
                  </span>
                )}
              </div>
              <p className="text-xs text-[#66736C] truncate mt-0.5">
                {selectedRecycler.address}, {selectedRecycler.city}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#475467] mt-1 flex-wrap">
                {selectedRecycler.phone && (
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-[#176B45]" />
                    {selectedRecycler.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 font-bold text-amber-600">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {selectedRecycler.rating || 4.8} ({selectedRecycler.reviewCount || 40}+)
                </span>
                <span className="text-[10px] text-gray-500">
                  Lat: {selectedRecycler.lat.toFixed(4)}, Lng: {selectedRecycler.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a
              id={`navigate-google-maps-${selectedRecycler.id}`}
              href={getGoogleMapsDirectionsUrl(selectedRecycler.lat, selectedRecycler.lng, selectedRecycler.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#176B45] border border-[#BBF7D0] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'गूगल मैप में खोलें' : 'Open in Google Maps'}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
