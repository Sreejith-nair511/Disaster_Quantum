'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '@/store/useStore';

// Hawaii geographic coordinates mapped to our system zones
const GEOMAP = {
  hub: { name: "Honolulu Strategic HQ", coords: [21.3069, -157.8583] as [number, number] },
  zone_alpha: { name: "Zone Alpha (Waikiki Coast)", coords: [21.2750, -157.8250] as [number, number] },
  zone_beta: { name: "Zone Beta (Downtown Core)", coords: [21.3150, -157.8600] as [number, number] },
  zone_gamma: { name: "Zone Gamma (Nuuanu Valley)", coords: [21.3500, -157.8300] as [number, number] },
  zone_delta: { name: "Zone Delta (Pearl Harbor Ind.)", coords: [21.3350, -157.9000] as [number, number] },
  zone_epsilon: { name: "Zone Epsilon (Rural Kaneohe)", coords: [21.4000, -157.8500] as [number, number] }
};

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  
  const activeAlerts = useStore((state) => state.activeAlerts);
  const riskAssessment = useStore((state) => state.riskAssessment);
  const allocationResults = useStore((state) => state.allocationResults);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create leaflet map centered in Honolulu
    const map = L.map(mapContainerRef.current, {
      center: GEOMAP.hub.coords,
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    // Custom tactical dark map tiles: CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Position Zoom Controls in bottom-right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Overlays when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old layers
    layersRef.current.forEach(layer => layer.remove());
    layersRef.current = [];

    // 1. Draw central Hub Marker (Glowing Cyan SVG Icon)
    const hubIcon = L.divIcon({
      className: 'custom-hub-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-500/25 border border-cyan-400 animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full bg-cyan-400 border border-white shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const hubMarker = L.marker(GEOMAP.hub.coords, { icon: hubIcon })
      .addTo(map)
      .bindPopup(`
        <div class="text-xs font-sans text-slate-100 p-1 bg-slate-900 border border-slate-700 rounded-md">
          <strong class="text-cyan-400 text-sm">Honolulu HQ Command Hub</strong><br/>
          Latitude: 21.3069 | Longitude: -157.8583<br/>
          Status: <span class="text-emerald-400 font-bold">OPERATIONAL</span>
        </div>
      `);
    layersRef.current.push(hubMarker);

    // Extract zone-specific risk weighting if applicable
    const activeRisk = riskAssessment?.probabilities || {};
    const riskFactor = riskAssessment?.risk_score || 5.0;

    // 2. Render Zone Markers & Threat Radiuses
    Object.entries(GEOMAP).forEach(([zoneKey, zoneData]) => {
      if (zoneKey === 'hub') return;
      const zoneId = zoneKey as keyof typeof GEOMAP;
      const coords = zoneData.coords;
      
      // Determine severity coloring
      // Default baseline or custom based on dynamic alert matches
      let colorClass = 'bg-emerald-500';
      let hexColor = '#10b981';
      let borderGlow = 'rgba(16, 185, 129, 0.4)';
      let severityLabel = 'NOMINAL';
      
      const zoneAlert = activeAlerts.find(a => 
        a.message.toLowerCase().includes(zoneData.name.toLowerCase()) || 
        a.message.toLowerCase().includes(zoneId.replace('_', ' '))
      );

      // Increase risk visually if telemetry or predictions spike
      if (zoneAlert || (riskFactor > 60 && zoneId === 'zone_alpha') || (riskFactor > 75 && zoneId === 'zone_gamma')) {
        colorClass = 'bg-rose-500';
        hexColor = '#f43f5e';
        borderGlow = 'rgba(244, 63, 94, 0.5)';
        severityLabel = 'CRITICAL SECTOR';
      } else if (riskFactor > 40 && (zoneId === 'zone_alpha' || zoneId === 'zone_beta')) {
        colorClass = 'bg-amber-500';
        hexColor = '#f59e0b';
        borderGlow = 'rgba(245, 158, 11, 0.4)';
        severityLabel = 'WARNING ZONE';
      }

      // Check if this zone has optimizer allocations to display
      const zoneAllocation = allocationResults?.selected_results?.allocation?.[zoneId];

      // Custom Glowing Radar Radar Circle
      const radarIcon = L.divIcon({
        className: 'radar-marker',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <div class="absolute w-6 h-6 rounded-full ${colorClass}/30 border border-${colorClass.split('-')[1]}-400 animate-ping"></div>
            <div class="relative w-3.5 h-3.5 rounded-full ${colorClass} border border-slate-900 shadow-md"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const popHTML = `
        <div class="text-xs font-sans text-slate-100 p-2 bg-slate-950 border border-slate-800 rounded-lg min-w-[200px]">
          <div class="flex items-center justify-between mb-1 pb-1 border-b border-slate-800">
            <strong class="text-slate-200 text-sm font-semibold">${zoneData.name}</strong>
          </div>
          <div class="space-y-1 mt-1">
            <div>Sector Class: <span class="font-bold" style="color: ${hexColor}">${severityLabel}</span></div>
            ${zoneAllocation ? `
              <div class="mt-2 pt-2 border-t border-slate-800">
                <div class="text-cyan-400 font-bold mb-1">Dispatched Resources:</div>
                <div class="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                  <div>🚑 Amb: <span class="text-white font-bold">${zoneAllocation.ambulances || 0}</span></div>
                  <div>🚁 Rescue: <span class="text-white font-bold">${zoneAllocation.rescue_teams || 0}</span></div>
                  <div>📦 Medical: <span class="text-white font-bold">${Math.round(zoneAllocation.medical_supplies || 0)}t</span></div>
                  <div>⛺ Shelters: <span class="text-white font-bold">${zoneAllocation.shelters || 0}</span></div>
                </div>
              </div>
            ` : `
              <div class="text-[10px] text-slate-400 italic mt-1">Waiting for resource optimization...</div>
            `}
          </div>
        </div>
      `;

      const zoneMarker = L.marker(coords, { icon: radarIcon })
        .addTo(map)
        .bindPopup(popHTML);
      layersRef.current.push(zoneMarker);

      // Add a translucent danger coverage circle
      const threatCircle = L.circle(coords, {
        color: hexColor,
        fillColor: hexColor,
        fillOpacity: 0.12,
        weight: 1,
        radius: 800 + (riskFactor * 10) // dynamically scales radius based on AI hazard score
      }).addTo(map);
      layersRef.current.push(threatCircle);

      // 3. Draw Tactical Deployment Lines (Dotted connecting Hub to Zones)
      // If resource allocations are live, make lines glowing cyan/active, else low-opacity dotted
      const isRouteActive = !!zoneAllocation;
      const routeLine = L.polyline([GEOMAP.hub.coords, coords], {
        color: isRouteActive ? '#06b6d4' : '#475569',
        weight: isRouteActive ? 2.5 : 1,
        dashArray: isRouteActive ? '6, 6' : '3, 6',
        opacity: isRouteActive ? 0.8 : 0.4
      }).addTo(map);
      layersRef.current.push(routeLine);
    });

  }, [activeAlerts, riskAssessment, allocationResults]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-800/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      {/* Absolute Map Layer Overlays */}
      <div className="absolute top-4 left-4 z-[1000] glass-panel p-3 rounded-lg border border-slate-800 max-w-[240px]">
        <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">Tactical Map Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <span className="text-slate-300">Command Headquarters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Nominal Sector (Safe)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-slate-300">Warning Sector (Alert)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-slate-300">Critical Sector (Disaster)</span>
          </div>
          <div className="pt-1.5 mt-1.5 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="w-6 h-0.5 border-t-2 border-dashed border-cyan-400"></span>
            <span>Active Deploy Route</span>
          </div>
        </div>
      </div>
      
      {/* Map Target Anchor */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
