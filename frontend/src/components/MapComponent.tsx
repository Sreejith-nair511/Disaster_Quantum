'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '@/store/useStore';

// India geographic coordinates mapped to our 5 disaster zones
// All real locations of high disaster-risk regions in India
const GEOMAP = {
  hub: { name: "NDRF National Command Hub — New Delhi", coords: [28.6139, 77.2090] as [number, number] },
  zone_alpha: { name: "Zone Alpha — Mumbai Coast (Maharashtra)", coords: [19.0760, 72.8777] as [number, number] },
  zone_beta: { name: "Zone Beta — Brahmaputra Valley (Assam)", coords: [26.1445, 91.7362] as [number, number] },
  zone_gamma: { name: "Zone Gamma — Western Ghats (Kerala)", coords: [10.8505, 76.2711] as [number, number] },
  zone_delta: { name: "Zone Delta — Himalayan Foothills (Uttarakhand)", coords: [30.3165, 78.0322] as [number, number] },
  zone_epsilon: { name: "Zone Epsilon — Odisha Cyclone Coast", coords: [20.9517, 85.0985] as [number, number] }
};

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  const activeAlerts = useStore((state) => state.activeAlerts);
  const riskAssessment = useStore((state) => state.riskAssessment);
  const allocationResults = useStore((state) => state.allocationResults);

  // Initialize Map centered on India
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create leaflet map centered on India
    const map = L.map(mapContainerRef.current, {
      center: [22.5, 80.0], // Geographic center of India
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    // Dark tactical map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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

    // 1. Draw NDRF HQ Hub Marker (Glowing Cyan)
    const hubIcon = L.divIcon({
      className: 'custom-hub-marker',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;">
          <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(6,182,212,0.2);border:1.5px solid #22d3ee;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:16px;height:16px;border-radius:50%;background:#06b6d4;border:2px solid white;box-shadow:0 0 14px rgba(34,211,238,0.9);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const hubMarker = L.marker(GEOMAP.hub.coords, { icon: hubIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family:monospace;font-size:11px;color:#f1f5f9;padding:8px;background:#020617;border:1px solid #334155;border-radius:8px;min-width:220px;">
          <strong style="color:#22d3ee;font-size:13px;">🏛️ NDRF National Command Hub</strong><br/>
          <span style="color:#94a3b8;">New Delhi, India</span><br/>
          Lat: 28.6139°N | Lon: 77.2090°E<br/>
          Status: <span style="color:#4ade80;font-weight:bold;">OPERATIONAL</span><br/>
          <span style="color:#64748b;font-size:10px;">National Disaster Response Force HQ</span>
        </div>
      `);
    layersRef.current.push(hubMarker);

    const riskFactor = riskAssessment?.risk_score || 5.0;

    // 2. Render Zone Markers with India-specific risk coloring
    Object.entries(GEOMAP).forEach(([zoneKey, zoneData]) => {
      if (zoneKey === 'hub') return;
      const zoneId = zoneKey as keyof typeof GEOMAP;
      const coords = zoneData.coords;

      let hexColor = '#10b981';
      let severityLabel = 'NOMINAL';
      let glowColor = 'rgba(16,185,129,0.4)';
      let dotBg = '#10b981';

      const zoneAlert = activeAlerts.find(a =>
        a.message.toLowerCase().includes(zoneData.name.toLowerCase()) ||
        a.message.toLowerCase().includes(zoneId.replace('_', ' '))
      );

      if (zoneAlert || (riskFactor > 65 && (zoneId === 'zone_alpha' || zoneId === 'zone_beta'))) {
        hexColor = '#f43f5e';
        severityLabel = 'CRITICAL SECTOR';
        glowColor = 'rgba(244,63,94,0.5)';
        dotBg = '#f43f5e';
      } else if (riskFactor > 40 && (zoneId === 'zone_gamma' || zoneId === 'zone_epsilon')) {
        hexColor = '#f59e0b';
        severityLabel = 'WARNING ZONE';
        glowColor = 'rgba(245,158,11,0.4)';
        dotBg = '#f59e0b';
      }

      const zoneAllocation = allocationResults?.selected_results?.allocation?.[zoneId];

      const radarIcon = L.divIcon({
        className: 'radar-marker',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;">
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${hexColor}22;border:1px solid ${hexColor};animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative;width:14px;height:14px;border-radius:50%;background:${dotBg};border:2px solid #0f172a;box-shadow:0 0 8px ${glowColor};"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const popHTML = `
        <div style="font-family:monospace;font-size:11px;color:#f1f5f9;padding:10px;background:#020617;border:1px solid #334155;border-radius:8px;min-width:230px;">
          <div style="border-bottom:1px solid #1e293b;padding-bottom:6px;margin-bottom:6px;">
            <strong style="color:#e2e8f0;font-size:12px;">${zoneData.name}</strong>
          </div>
          <div>Status: <span style="color:${hexColor};font-weight:bold;">${severityLabel}</span></div>
          <div style="color:#64748b;font-size:10px;">Lat: ${coords[0].toFixed(4)}°N | Lon: ${coords[1].toFixed(4)}°E</div>
          ${zoneAllocation ? `
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #1e293b;">
              <div style="color:#22d3ee;font-weight:bold;margin-bottom:4px;">🚨 NDRF Assets Dispatched:</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:10px;color:#cbd5e1;">
                <div>🚑 Ambulances: <strong style="color:white;">${zoneAllocation.ambulances || 0}</strong></div>
                <div>🚁 NDRF Teams: <strong style="color:white;">${zoneAllocation.rescue_teams || 0}</strong></div>
                <div>📦 Supplies: <strong style="color:white;">${Math.round(zoneAllocation.medical_supplies || 0)}t</strong></div>
                <div>⛺ Relief Camps: <strong style="color:white;">${zoneAllocation.shelters || 0}</strong></div>
              </div>
            </div>
          ` : `
            <div style="color:#475569;font-size:10px;font-style:italic;margin-top:6px;">Awaiting resource optimization...</div>
          `}
        </div>
      `;

      const zoneMarker = L.marker(coords, { icon: radarIcon })
        .addTo(map)
        .bindPopup(popHTML);
      layersRef.current.push(zoneMarker);

      // Threat radius circle — scales with risk score
      const threatCircle = L.circle(coords, {
        color: hexColor,
        fillColor: hexColor,
        fillOpacity: 0.10,
        weight: 1.5,
        radius: 40000 + (riskFactor * 1500) // ~40–190km radius in meters
      }).addTo(map);
      layersRef.current.push(threatCircle);

      // Tactical deployment line from NDRF HQ to zone
      const isRouteActive = !!zoneAllocation;
      const routeLine = L.polyline([GEOMAP.hub.coords, coords], {
        color: isRouteActive ? '#06b6d4' : '#475569',
        weight: isRouteActive ? 2.5 : 1,
        dashArray: isRouteActive ? '8, 6' : '3, 8',
        opacity: isRouteActive ? 0.85 : 0.35
      }).addTo(map);
      layersRef.current.push(routeLine);
    });

  }, [activeAlerts, riskAssessment, allocationResults]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-slate-800/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
      {/* Map Legend Overlay */}
      <div className="absolute top-4 left-4 z-[1000] glass-panel p-3 rounded-lg border border-slate-800 max-w-[260px]">
        <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">India Tactical Map Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <span className="text-slate-300">NDRF National HQ — New Delhi</span>
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
            <span>Active NDRF Deploy Route</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-800 text-[9px] font-mono text-slate-500 space-y-0.5">
          <div>🔴 Mumbai Coast — Flood / Cyclone</div>
          <div>🔴 Brahmaputra — Flood / Earthquake</div>
          <div>🟡 Western Ghats — Landslide</div>
          <div>🟡 Uttarakhand — Earthquake / Landslide</div>
          <div>🟡 Odisha Coast — Cyclone</div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
