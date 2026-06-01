'use client';

import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  CloudRain, Thermometer, Droplet, Waves, Wind, Activity, 
  ShieldAlert, AlertTriangle, Play, RefreshCw, CheckCircle 
} from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import SpeechPanel from '@/components/SpeechPanel';

export default function OverviewView() {
  const telemetry = useStore((state) => state.telemetry);
  const riskAssessment = useStore((state) => state.riskAssessment);
  const activeAlerts = useStore((state) => state.activeAlerts);
  const setAlerts = useStore((state) => state.setAlerts);
  const clearAlert = useStore((state) => state.clearAlert);
  
  const [injecting, setInjecting] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [lastAlertRefresh, setLastAlertRefresh] = useState<string | null>(null);

  const updateAlertFeed = (alerts: any[]) => {
    setAlerts(alerts);
    setLastAlertRefresh(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    const loadActiveAlerts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/alerts');
        if (Array.isArray(response.data)) {
          updateAlertFeed(response.data);
        }
      } catch (err) {
        console.error('[ALERTS] Failed to load active alerts.', err);
      }
    };

    loadActiveAlerts();
  }, []);

  // Trigger simulated disaster anomaly via backend
  const handleTriggerAnomaly = async (hazardType: string) => {
    setInjecting(hazardType);
    try {
      await axios.post('http://localhost:8000/api/alerts/trigger-anomaly', {
        hazard_type: hazardType
      });
      // Small pause to let simulator spin up
      setTimeout(() => setInjecting(null), 1000);
    } catch (err) {
      console.error(err);
      setInjecting(null);
    }
  };

  // Resolve active alert
  const handleResolveAlert = async (id: number) => {
    setResolvingId(id);
    try {
      await axios.post('http://localhost:8000/api/alerts/resolve', {
        alert_id: id
      });
      clearAlert(id);
      const response = await axios.get('http://localhost:8000/api/alerts');
      if (Array.isArray(response.data)) {
        updateAlertFeed(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  // Format sensor display helper
  const getSensorStatusColor = (val: number, caution: number, critical: number) => {
    if (val >= critical) return 'text-rose-500 text-glow-rose';
    if (val >= caution) return 'text-amber-500 text-glow-amber';
    return 'text-cyan-400 text-glow-cyan';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Live Operational Overview</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">REAL-TIME SENSOR TELEMETRY & DECISION CONTROL LOGS</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse neon-pulse-dot"></span>
          <span className="text-slate-300">WEBSOCKET CHANNEL ACTIVE</span>
        </div>
      </div>

      {/* Notification Center (demo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <NotificationCenter />
        </div>
        <div>
          <SpeechPanel />
        </div>
      </div>

      {/* 2. Live Sensor Telemetry Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Rainfall Card */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Rainfall</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${getSensorStatusColor(telemetry.rainfall, 120, 180)}`}>
              {telemetry.rainfall.toFixed(1)} <span className="text-xs text-slate-400">mm</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Threshold: 180mm</p>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Temperature</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${getSensorStatusColor(telemetry.temperature, 36, 42)}`}>
              {telemetry.temperature.toFixed(1)} <span className="text-xs text-slate-400">°C</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Threshold: 38°C</p>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Humidity</span>
            <Droplet className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-cyan-400 text-glow-cyan">
              {telemetry.humidity.toFixed(1)} <span className="text-xs text-slate-400">%</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Threshold: Variable</p>
          </div>
        </div>

        {/* River Level Card */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">River Level</span>
            <Waves className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${getSensorStatusColor(telemetry.river_level, 4.5, 6.5)}`}>
              {telemetry.river_level.toFixed(2)} <span className="text-xs text-slate-400">m</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Threshold: 6.0m</p>
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Wind Speed</span>
            <Wind className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${getSensorStatusColor(telemetry.wind_speed, 90, 130)}`}>
              {telemetry.wind_speed.toFixed(1)} <span className="text-xs text-slate-400">km/h</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Threshold: 110km/h</p>
          </div>
        </div>

        {/* Seismic Activity Card */}
        <div className="glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-slate-400 uppercase">Seismic (M)</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono ${getSensorStatusColor(telemetry.seismic_activity, 3.5, 5.0)}`}>
              {telemetry.seismic_activity.toFixed(2)} <span className="text-xs text-slate-400">R</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Threshold: 4.5 R</p>
          </div>
        </div>
      </div>

      {/* 3. Threat Warning Console & Anomaly Injectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Warning Alerts Panel */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Incident Management Console</h3>
            </div>
            {lastAlertRefresh ? (
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-[0.16em]">
                Updated {lastAlertRefresh}
              </span>
            ) : (
              <span className="text-[10px] font-mono uppercase text-slate-500 tracking-[0.16em]">Loading alerts...</span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2 opacity-65" />
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Aegis Grid Clear</p>
                <p className="text-[10px] text-slate-500 mt-1">No active critical environmental alerts identified.</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div key={alert.id} className={`p-3.5 rounded-lg border flex justify-between items-start gap-4 transition-all duration-300 ${
                  alert.severity === 'CRITICAL' 
                    ? 'bg-rose-950/20 border-rose-800/80 shadow-[0_0_12px_rgba(244,63,94,0.05)]' 
                    : 'bg-amber-950/20 border-amber-800/80'
                }`}>
                  <div className="flex gap-2.5">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-500/25 text-rose-400' : 'bg-amber-500/25 text-amber-400'
                        }`}>{alert.severity}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="shrink-0 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/80 hover:text-emerald-400 text-slate-400 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {resolvingId === alert.id ? 'Deactivating...' : 'Acknowledge'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Anomaly Injectors Control Panel */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Scenario Control Room</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Manually override regional telemetry feeds. Inject dynamic climate spikes to test AI predictions and trigger real-time alert routines.
          </p>
          
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {[
              { id: 'flood', label: 'Brahmaputra Inundation (Flood)', color: 'border-blue-800 hover:border-blue-500 text-blue-400' },
              { id: 'earthquake', label: 'Himalayan Seismic Event (Quake)', color: 'border-purple-800 hover:border-purple-500 text-purple-400' },
              { id: 'wildfire', label: 'Uttarakhand Forest Fire (Wildfire)', color: 'border-orange-800 hover:border-orange-500 text-orange-400' },
              { id: 'cyclone', label: 'Bay of Bengal Super Cyclone', color: 'border-sky-800 hover:border-sky-500 text-sky-400' },
              { id: 'landslide', label: 'Western Ghats Slope Failure', color: 'border-rose-800 hover:border-rose-500 text-rose-400' },
              { id: 'heatwave', label: 'Rajasthan Extreme Heatwave', color: 'border-red-800 hover:border-red-500 text-red-400' },
              { id: 'cloudburst', label: 'Delhi / Himachal Cloudburst', color: 'border-indigo-800 hover:border-indigo-500 text-indigo-400' }
            ].map((inj) => (
              <button
                key={inj.id}
                onClick={() => handleTriggerAnomaly(inj.id)}
                disabled={injecting !== null}
                className={`w-full text-left p-3 rounded-lg border bg-slate-950/50 flex justify-between items-center transition-all duration-300 disabled:opacity-50 cursor-pointer ${inj.color}`}
              >
                <span className="text-xs font-mono uppercase tracking-wide font-semibold">{inj.label}</span>
                <Play className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
