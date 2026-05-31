'use client';

import CommandMap from '../CommandMap';
import { useStore } from '@/store/useStore';
import { MapPin, Compass, ShieldAlert } from 'lucide-react';

const SECTOR_INFO = [
  { id: "zone_alpha", name: "Zone Alpha (Waikiki Coast)", coords: "21.2750° N, 157.8250° W", desc: "Low-lying tourist shoreline. High exposure to flood and cyclone storms." },
  { id: "zone_beta", name: "Zone Beta (Downtown Core)", coords: "21.3150° N, 157.8600° W", desc: "Dense financial and residential zone. Critical high-value infrastructure." },
  { id: "zone_gamma", name: "Zone Gamma (Nuuanu Valley)", coords: "21.3500° N, 157.8300° W", desc: "Mountain valleys and streams. Extreme exposure to landslide debris flows." },
  { id: "zone_delta", name: "Zone Delta (Pearl Harbor)", coords: "21.3350° N, 157.9000° W", desc: "Naval shipping yards and airport hubs. Crucial transport assets." },
  { id: "zone_epsilon", name: "Zone Epsilon (Rural Kaneohe)", coords: "21.4000° N, 157.8500° W", desc: "Northern agricultural and rolling hills. Prone to isolated forest blazes." }
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
          <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Tactical Command Map</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">GIS GEOGRAPHIC GEOLOCATION MAP & ROUTING GRAPH OVERLAY</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-slate-300">CENTER: HONOLULU HAWAII HQ</span>
        </div>
      </div>

      {/* Main Map + Sidebar grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[500px]">
        {/* The Leaflet Map wrapper */}
        <div className="xl:col-span-3 h-[550px] xl:h-full min-h-[450px]">
          <CommandMap />
        </div>

        {/* Geographic Sector Sidebar */}
        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
          <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">Operational Sectors</h3>
          
          {SECTOR_INFO.map((sector) => {
            // Determine active sector warning state
            const hasAlert = activeAlerts.some(a => 
              a.message.toLowerCase().includes(sector.name.toLowerCase()) || 
              a.message.toLowerCase().includes(sector.id.replace('_', ' '))
            );
            
            // Check allocations
            const zoneAlloc = allocation?.selected_results?.allocation?.[sector.id];

            return (
              <div key={sector.id} className={`p-4 rounded-xl border bg-slate-950/40 transition-all ${
                hasAlert 
                  ? 'border-rose-500/50 bg-rose-950/5 shadow-[0_0_10px_rgba(244,63,94,0.05)]' 
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-2">
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${hasAlert ? 'text-rose-400' : 'text-cyan-400'}`} />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{sector.name}</h4>
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5">{sector.coords}</p>
                    </div>
                  </div>
                  {hasAlert && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{sector.desc}</p>
                
                {zoneAlloc ? (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                    <div className="text-cyan-400 font-bold mb-1">Tactical Assets Dispatched:</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <div>Ambulances: <span className="text-white font-bold">{zoneAlloc.ambulances}</span></div>
                      <div>Helicopters: <span className="text-white font-bold">{zoneAlloc.rescue_teams}</span></div>
                      <div>Supplies: <span className="text-white font-bold">{Math.round(zoneAlloc.medical_supplies)}t</span></div>
                      <div>Shelters: <span className="text-white font-bold">{zoneAlloc.shelters}</span></div>
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
