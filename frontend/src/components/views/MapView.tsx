'use client';

import CommandMap from '../CommandMap';
import { useStore } from '@/store/useStore';
import { MapPin, Compass, ShieldAlert } from 'lucide-react';

// India's 5 high-risk disaster zones — real geographic locations
const SECTOR_INFO = [
  {
    id: "zone_alpha",
    name: "Zone Alpha — Mumbai Coast (Maharashtra)",
    coords: "19.0760°N, 72.8777°E",
    desc: "India's financial capital on the Arabian Sea coast. Extreme exposure to cyclones, storm surges, and urban flooding during monsoon season.",
    risk: "Flood / Cyclone"
  },
  {
    id: "zone_beta",
    name: "Zone Beta — Brahmaputra Valley (Assam)",
    coords: "26.1445°N, 91.7362°E",
    desc: "The Brahmaputra river basin — one of the world's most flood-prone regions. Annual flooding displaces millions. Also sits on seismic zone V.",
    risk: "Flood / Earthquake"
  },
  {
    id: "zone_gamma",
    name: "Zone Gamma — Western Ghats (Kerala)",
    coords: "10.8505°N, 76.2711°E",
    desc: "Steep mountain terrain with heavy monsoon rainfall. High landslide risk, especially in Wayanad and Idukki districts. 2018 Kerala floods reference zone.",
    risk: "Landslide / Flood"
  },
  {
    id: "zone_delta",
    name: "Zone Delta — Himalayan Foothills (Uttarakhand)",
    coords: "30.3165°N, 78.0322°E",
    desc: "Seismic zone IV/V. Prone to glacial lake outburst floods (GLOFs), landslides, and earthquakes. Kedarnath 2013 disaster reference zone.",
    risk: "Earthquake / Landslide"
  },
  {
    id: "zone_epsilon",
    name: "Zone Epsilon — Odisha Cyclone Coast",
    coords: "20.9517°N, 85.0985°E",
    desc: "Bay of Bengal cyclone corridor. Historically hit by super cyclones (Fani 2019, Amphan 2020). Dense coastal population at extreme risk.",
    risk: "Cyclone / Flood"
  }
];

export default function MapView() {
  const activeAlerts = useStore((state) => state.activeAlerts);
  const riskAssessment = useStore((state) => state.riskAssessment);
  const allocation = useStore((state) => state.allocationResults);

  const riskFactor = riskAssessment?.risk_score || 5.0;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">India Tactical Command Map</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">NDRF GIS GEOLOCATION — 5 HIGH-RISK DISASTER ZONES ACROSS INDIA</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-slate-300">CENTER: NDRF HQ — NEW DELHI</span>
        </div>
      </div>

      {/* Main Map + Sidebar grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[500px]">
        {/* Leaflet Map */}
        <div className="xl:col-span-3 h-[580px] xl:h-full min-h-[480px]">
          <CommandMap />
        </div>

        {/* India Sector Sidebar */}
        <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
          <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">India Disaster Zones</h3>

          {SECTOR_INFO.map((sector) => {
            const hasAlert = activeAlerts.some(a =>
              a.message.toLowerCase().includes(sector.name.toLowerCase()) ||
              a.message.toLowerCase().includes(sector.id.replace('_', ' '))
            );

            const zoneAlloc = allocation?.selected_results?.allocation?.[sector.id];

            return (
              <div key={sector.id} className={`p-3.5 rounded-xl border bg-slate-950/40 transition-all ${
                hasAlert
                  ? 'border-rose-500/50 bg-rose-950/5 shadow-[0_0_10px_rgba(244,63,94,0.05)]'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2">
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${hasAlert ? 'text-rose-400' : 'text-cyan-400'}`} />
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-200 leading-tight">{sector.name}</h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5">{sector.coords}</p>
                    </div>
                  </div>
                  {hasAlert && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-ping mt-1"></span>
                  )}
                </div>

                <div className="mt-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-mono text-amber-400 font-semibold">{sector.risk}</span>
                </div>

                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{sector.desc}</p>

                {zoneAlloc ? (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                    <div className="text-cyan-400 font-bold mb-1">NDRF Assets Dispatched:</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <div>Ambulances: <span className="text-white font-bold">{zoneAlloc.ambulances}</span></div>
                      <div>NDRF Teams: <span className="text-white font-bold">{zoneAlloc.rescue_teams}</span></div>
                      <div>Supplies: <span className="text-white font-bold">{Math.round(zoneAlloc.medical_supplies)}t</span></div>
                      <div>Relief Camps: <span className="text-white font-bold">{zoneAlloc.shelters}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-[9px] font-mono text-slate-500 italic flex items-center gap-1">
                    <span>• Status: Nominal (Standby)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
