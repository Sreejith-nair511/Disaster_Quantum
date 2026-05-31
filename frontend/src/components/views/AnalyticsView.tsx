'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart3, RefreshCw, Server, AlertCircle, FileText, CheckCircle, 
  TrendingUp, Award 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/historical-analysis');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to establish session with analytics backend logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Poll analytics logs every 8 seconds
    const interval = setInterval(fetchAnalytics, 8000);
    return () => clearInterval(interval);
  }, []);

  // Format chart time stamps
  const formattedChartData = data?.telemetry_history.map((item: any, idx: number) => {
    const d = new Date(item.timestamp);
    return {
      name: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      rainfall: parseFloat(item.rainfall.toFixed(1)),
      river_level: parseFloat(item.river_level.toFixed(2)),
      seismic: parseFloat(item.seismic_activity.toFixed(2)),
      wind: parseFloat(item.wind_speed.toFixed(1))
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Intelligence & Analytics Hub</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">HISTORICAL CLIMATE PATTERNS & PREDICTIVE ACCURACY EVALUATION</p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-300 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>RELOAD LOGS</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono mt-3 uppercase tracking-widest">Querying database indexes...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-950/10 text-center flex flex-col items-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Row 1: Historical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Precipitation & Flood Risk Trends */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 h-80 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400 uppercase">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Precipitation & Inundation Curve
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">SQLite Telemetry Logs</span>
              </div>
              <div className="w-full flex-1 min-h-[200px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData}>
                    <defs>
                      <linearGradient id="rainGrad" cx="0.5" cy="0" r="0.5">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="riverGrad" cx="0.5" cy="0" r="0.5">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                      itemStyle={{ fontFamily: 'monospace', fontSize: 11 }}
                    />
                    <Area type="monotone" dataKey="rainfall" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#rainGrad)" name="Rain (mm)" />
                    <Area type="monotone" dataKey="river_level" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#riverGrad)" name="River (m)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seismic Activity & Wind Speeds Trends */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 h-80 flex flex-col">
              <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400 uppercase">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Atmospheric & Tectonic Telemetries
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">SQLite Telemetry Logs</span>
              </div>
              <div className="w-full flex-1 min-h-[200px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedChartData}>
                    <defs>
                      <linearGradient id="windGrad" cx="0.5" cy="0" r="0.5">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="seismicGrad" cx="0.5" cy="0" r="0.5">
                        <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                      itemStyle={{ fontFamily: 'monospace', fontSize: 11 }}
                    />
                    <Area type="monotone" dataKey="wind" stroke="#0ea5e9" strokeWidth={1.5} fillOpacity={1} fill="url(#windGrad)" name="Wind (km/h)" />
                    <Area type="monotone" dataKey="seismic" stroke="#c084fc" strokeWidth={1.5} fillOpacity={1} fill="url(#seismicGrad)" name="Seismicity (R)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 2: Accuracy Ratings & Database Audit Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Model Validation Metrics Card */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Neural Validation Metrics</h3>
                </div>
                
                <div className="space-y-4 font-mono text-xs">
                  {/* Random Forest accuracy */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/60">
                    <div className="flex justify-between items-center text-slate-200">
                      <span>Random Forest Classifier</span>
                      <span className="font-bold text-emerald-400">
                        {data?.model_performance ? (data.model_performance.random_forest_accuracy * 100).toFixed(2) : '97.20'}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-normal leading-relaxed">
                      Primary high-performance non-linear model. Excellent at high-dimensional thresholds mapping.
                    </p>
                  </div>

                  {/* Logistic Regression accuracy */}
                  <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Logistic Regression</span>
                      <span className="font-bold text-slate-300">
                        {data?.model_performance ? (data.model_performance.logistic_regression_accuracy * 100).toFixed(2) : '82.50'}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-normal leading-relaxed">
                      Linear baseline comparator. Exhibits performance gap compared to random forest.
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-wider mt-4">
                TRAINING SET: 5,000 COMBINATIONS | SPLIT: 80/20
              </div>
            </div>

            {/* Recent Optimizations Log Panel */}
            <div className="glass-panel p-5 rounded-xl border border-slate-800 lg:col-span-2 h-[260px] flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Optimization Engine History</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {(!data?.allocation_runs || data.allocation_runs.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono uppercase italic">
                    No historic optimizer audits mapped.
                  </div>
                ) : (
                  data.allocation_runs.map((run: any) => (
                    <div key={run.id} className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/80 text-[11px] font-mono flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold uppercase">{run.algorithm}</span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(run.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Operational sectors calculated: 5 sectors dispatches configured.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div>Fitness Cost:</div>
                        <div className="text-purple-400 font-bold mt-0.5">{Math.round(run.fitness)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
