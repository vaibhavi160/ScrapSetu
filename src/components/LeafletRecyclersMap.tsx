import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Recycler, Language } from '../types';
import { getGoogleMapsDirectionsUrl, formatDisplayAddress } from '../utils/geo';
import { ExternalLink, Navigation, ShieldCheck, Phone } from 'lucide-react';

interface LeafletRecyclersMapProps {
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
  activeLayer: 'roadmap' | 'satellite';
  pickingMode?: boolean;
  onPickCoordinates?: (lat: number, lng: number) => void;
}

export const LeafletRecyclersMap: React.FC<LeafletRecyclersMapProps> = ({
  recyclers,
  selectedRecyclerId,
  onSelectRecycler,
  collectorLoc,
  language = 'en',
  activeLayer,
  pickingMode = false,
  onPickCoordinates,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Check if map already initialized on this container
    if (!mapRef.current) {
      const initialLat = collectorLoc.lat || 19.0760;
      const initialLng = collectorLoc.lng || 72.8777;

      const map = L.map(containerRef.current, {
        center: [initialLat, initialLng],
        zoom: 11,
        zoomControl: false, // We use custom styled controls
        attributionControl: true,
      });

      mapRef.current = map;

      // Click listener for picking mode
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (onPickCoordinates) {
          onPickCoordinates(lat, lng);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (activeLayer === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      // Crisp, beautiful CartoDB Voyager tiles (OpenStreetMap based)
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
    }
  }, [activeLayer]);

  // Update Markers and Fit Bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // 1. Collector GPS Location Marker
    const collectorIcon = L.divIcon({
      className: 'collector-map-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
          <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background-color: #2563EB; border: 3px solid white; box-shadow: 0 4px 12px rgba(37,99,235,0.4); display: flex; items-center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: white;"></div>
          </div>
          <div style="position: absolute; bottom: -18px; background-color: #1E3A8A; color: white; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap;">
            ${language === 'hi' ? 'आप यहां हैं' : 'Your GPS'}
          </div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const collectorMarker = L.marker([collectorLoc.lat, collectorLoc.lng], {
      icon: collectorIcon,
      zIndexOffset: 1000,
    }).addTo(markersGroup);

    collectorMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #17231D;">
        <strong style="color: #2563EB;">📍 ${language === 'hi' ? 'आपका स्थान' : 'Collector Location'}</strong>
        <div style="color: #4B5563; font-size: 11px; margin-top: 2px;">${collectorLoc.areaName || 'GPS Fixed Location'}</div>
        <div style="color: #6B7280; font-size: 10px; margin-top: 2px;">Lat: ${collectorLoc.lat.toFixed(4)}, Lng: ${collectorLoc.lng.toFixed(4)}</div>
      </div>
    `);

    // 2. Recycler Markers
    const bounds = L.latLngBounds([[collectorLoc.lat, collectorLoc.lng]]);

    recyclers.forEach((rec) => {
      bounds.extend([rec.lat, rec.lng]);
      const isSelected = rec.id === selectedRecyclerId;
      const premiumText = rec.priceMultiplier > 1 ? `+${Math.round((rec.priceMultiplier - 1) * 100)}%` : '';
      const displayLoc = formatDisplayAddress(rec.address, rec.city);

      const markerIcon = L.divIcon({
        className: `recycler-pin-${rec.id}`,
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
            <!-- Facility Pill -->
            <div style="
              background-color: ${isSelected ? '#176B45' : '#FFFFFF'};
              color: ${isSelected ? '#FFFFFF' : '#17231D'};
              border: 1.5px solid ${isSelected ? '#FFFFFF' : '#176B45'};
              box-shadow: 0 4px 10px rgba(0,0,0,0.18);
              border-radius: 9999px;
              padding: 2px 8px;
              font-size: 10px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              max-width: 140px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              <span>${rec.name.slice(0, 15)}</span>
              ${
                premiumText
                  ? `<span style="background-color: #F59E0B; color: #111827; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 3px;">${premiumText}</span>`
                  : ''
              }
            </div>

            <!-- Pin Body -->
            <div style="
              width: 18px;
              height: 18px;
              background-color: ${isSelected ? '#176B45' : '#16834A'};
              border: 2px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              margin-top: -3px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
            "></div>
          </div>
        `,
        iconSize: [120, 44],
        iconAnchor: [60, 44],
      });

      const marker = L.marker([rec.lat, rec.lng], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 900 : 500,
      }).addTo(markersGroup);

      const navUrl = getGoogleMapsDirectionsUrl(rec.lat, rec.lng, rec.name);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #17231D; min-width: 180px;">
          <div style="font-weight: 800; font-size: 13px; color: #176B45; display: flex; align-items: center; gap: 4px;">
            🛡️ ${rec.name}
          </div>
          <div style="color: #4B5563; font-size: 11px; margin-top: 3px;">
            ${displayLoc}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 4px; border-top: 1px solid #E5E7EB; font-size: 11px;">
            <span style="font-weight: 700; color: #047857;">
              ${premiumText ? `${premiumText} Fair Bonus` : 'CPCB Verified'}
            </span>
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; font-weight: 700; text-decoration: none;">
              Open in Maps ↗
            </a>
          </div>
          ${rec.phone ? `<div style="margin-top: 4px; font-size: 10px; color: #6B7280;">📞 ${rec.phone}</div>` : ''}
        </div>
      `);

      marker.on('click', () => {
        onSelectRecycler(rec);
      });
    });

    // Auto-fit bounds if we have valid coordinates
    if (bounds.isValid() && recyclers.length > 0) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 14,
        animate: true,
      });
    }
  }, [recyclers, collectorLoc.lat, collectorLoc.lng, selectedRecyclerId, language]);

  // Center on selected recycler when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedRecyclerId) return;

    const selected = recyclers.find((r) => r.id === selectedRecyclerId);
    if (selected) {
      map.panTo([selected.lat, selected.lng], { animate: true, duration: 0.6 });
    }
  }, [selectedRecyclerId]);

  return (
    <div
      ref={containerRef}
      id="leaflet-map-container"
      className="w-full h-full relative z-0"
      style={{ minHeight: '100%' }}
    />
  );
};
