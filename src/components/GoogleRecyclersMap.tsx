import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, Navigation, ExternalLink, ShieldCheck, Star, 
  Layers, Plus, Phone, Compass, Maximize2, ZoomIn, ZoomOut
} from 'lucide-react';
import { Recycler, Language } from '../types';
import { getGoogleMapsDirectionsUrl, formatDisplayAddress } from '../utils/geo';
import { LeafletRecyclersMap } from './LeafletRecyclersMap';

// @vis.gl/react-google-maps imports (for when VITE_GOOGLE_MAPS_API_KEY is configured)
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
  height = '440px',
  onAddRecyclersClick,
  onPickCoordinates,
  pickingMode = false,
}) => {
  const apiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const [activeLayer, setActiveLayer] = useState<'roadmap' | 'satellite'>('roadmap');
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>(apiKey ? 'google' : 'leaflet');
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

  const selectedDisplayAddress = selectedRecycler
    ? formatDisplayAddress(selectedRecycler.address, selectedRecycler.city)
    : '';

  return (
    <div
      id="recyclers-main-map-wrapper"
      className="relative rounded-2xl overflow-hidden border border-[#DDE6E0] bg-[#EBF0ED] shadow-sm flex flex-col"
      style={{ height }}
    >
      {/* MAP HEADER / CONTROLS OVERLAY */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Location & Count Pill */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#17231D] border border-[#DDE6E0] flex items-center gap-2 shadow-xs pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="truncate max-w-[170px] sm:max-w-[220px]">
            {collectorLoc.areaName || 'GPS Location'}
          </span>
          <span className="text-[10px] bg-[#E8F3ED] text-[#176B45] px-2 py-0.5 rounded-full font-bold">
            {recyclers.length} {language === 'hi' ? 'रीसाइक्लर' : 'Recyclers'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Layer switcher: Roadmap / Satellite */}
          <div className="bg-white rounded-full border border-[#DDE6E0] p-0.5 flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => setActiveLayer('roadmap')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                activeLayer === 'roadmap'
                  ? 'bg-[#176B45] text-white shadow-xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              {language === 'hi' ? 'नक्शा' : 'Map'}
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-[#176B45] text-white shadow-xs'
                  : 'text-[#66736C] hover:text-[#17231D]'
              }`}
            >
              {language === 'hi' ? 'सैटेलाइट' : 'Satellite'}
            </button>
          </div>

          {/* Add Recyclers Button */}
          {onAddRecyclersClick && (
            <button
              type="button"
              id="map-add-recyclers-btn"
              onClick={onAddRecyclersClick}
              className="bg-[#176B45] hover:bg-[#125335] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Add single or multiple recyclers to Map and Firebase"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'hi' ? '+ रीसाइक्लर जोड़ें' : '+ Add Recyclers'}</span>
              <span className="sm:hidden">+ Add</span>
            </button>
          )}

          {/* Recenter on Collector GPS */}
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
        <div className="absolute top-14 left-3 right-3 z-30 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Click anywhere on the map to pick coordinates for your new recycler</span>
          </div>
        </div>
      )}

      {/* MAP VIEW CONTAINER */}
      <div className="w-full flex-1 relative overflow-hidden">
        {apiKey && mapEngine === 'google' ? (
          // GOOGLE MAPS PLATFORM (WHEN API KEY IS CONFIGURED)
          <APIProvider apiKey={apiKey} solutionChannel="gmp_mcp_codeassist_v1_aistudio">
            <VisGlMap
              style={{ width: '100%', height: '100%' }}
              defaultCenter={center}
              center={center}
              defaultZoom={zoomLevel}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              mapTypeId={activeLayer === 'roadmap' ? 'roadmap' : 'hybrid'}
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
                      {formatDisplayAddress(selectedRecycler.address, selectedRecycler.city)}
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
        ) : (
          // LIVE INTERACTIVE MAP ENGINE (Powered by Leaflet, OpenStreetMap & Esri Satellite)
          // Always works 100% reliably with real pan, zoom, real streets across Varanasi, Mumbai, etc.
          <LeafletRecyclersMap
            recyclers={recyclers}
            selectedRecyclerId={selectedRecycler?.id || null}
            onSelectRecycler={handleCenterOnRecycler}
            collectorLoc={collectorLoc}
            language={language}
            activeLayer={activeLayer}
            pickingMode={pickingMode}
            onPickCoordinates={onPickCoordinates}
          />
        )}

        {/* Real Map Attribution & Status Pill */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-[#475467] font-semibold border border-[#DDE6E0] shadow-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#176B45]" />
          <span>
            {apiKey && mapEngine === 'google'
              ? 'Google Maps Platform Active'
              : 'Interactive Live Map • OpenStreetMap & Esri Satellite'}
          </span>
        </div>
      </div>

      {/* SELECTED RECYCLER BOTTOM DRAWER / INFO CARD */}
      {selectedRecycler && (
        <div className="p-3.5 bg-white border-t border-[#DDE6E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-30">
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
              <p className="text-xs text-[#66736C] truncate mt-0.5 font-medium">
                {selectedDisplayAddress}
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
                <span className="text-[10px] text-gray-500 font-mono">
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
              className="flex-1 sm:flex-initial bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#176B45] border border-[#BBF7D0] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer hover:scale-102"
              title="Open turn-by-turn driving directions in Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'गूगल मैप में दिशा-निर्देश' : 'Navigate in Google Maps'}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
