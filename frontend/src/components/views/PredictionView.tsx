'use client';

import { useStore } from '@/store/useStore';
import { useState } from 'react';
import axios from 'axios';
import { Brain, Cpu, BarChart2, ShieldCheck, HelpCircle } from 'lucide-react';

export default function PredictionView() {
  const liveAssessment = useStore((state) => state.riskAssessment);
  const liveTelemetry = useStore((state) => state.telemetry);
  
  // Sandbox State
  const [sandboxTelemetry, setSandboxTelemetry] = useState({
    rainfall: 45.0,
    temperature: 24.5,
    humidity: 55.0,
    river_level: 1.8,
    wind_speed: 12.0,
    seismic_activity: 0.1,
    land_slope: 25.0
  });
  
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [runningInference, setRunningInference] = useState(false);

  // Trigger manual inference against FastAPI
  const handleRunInference = async () => {
    setRunningInference(true);
    try {
      const res = await axios.post('http://localhost:8000/api/predict-risk', sandboxTelemetry);
      setSandboxResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningInference(false);
    }
  };

  // Color mapping per disaster type
  const getDisasterColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'flood': return 'bg-blue-500';
      case 'earthquake': return 'bg-purple-500';
      case 'wildfire': return 'bg-orange-500';
      case 'cyclone': return 'bg-sky-500';
      case 'landslide': return 'bg-rose-500';
      default: return 'bg-emerald-500';
    }
  };

  // Highlight active classification
  const activeClass = liveAssessment?.prediction || "No Hazard";
  const activeConfidence = liveAssessment?.confidence || 0.98;
  const activeScore = liveAssessment?.risk_score || 5.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">AI Predictive Risk Console</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">RANDOM FOREST RISK CLASSIFIER & MULTI-MODEL DEEP INFERENCE</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-slate-300">MODELS TRAINED: RF & LOGISTIC REGRESSION</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Live Risk Telemetry Probabilities */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Real-Time Risk Probability Vectors</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Primary Gauge */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Aegis Risk Index</span>
                <div className="relative flex items-center justify-center w-36 h-36 mt-4">
                  {/* SVG glowing circle border */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="64" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="64" 
                      stroke={activeScore > 70 ? "#f43f5e" : activeScore > 45 ? "#f59e0b" : "#06b6d4"} 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray="402"
                      strokeDashoffset={402 - (402 * activeScore) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold font-mono text-slate-100">{Math.round(activeScore)}%</span>
                    <span className="text-[9px] font-mono text-slate-400 tracking-wider uppercase mt-0.5">{activeClass}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-mono">
                  <span>Confidence Rating: </span>
                  <span className="text-cyan-400 font-bold">{(activeConfidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Individual Probability Bars */}
              <div className="space-y-4 flex flex-col justify-center">
                {liveAssessment?.probabilities ? (
                  Object.entries(liveAssessment.probabilities).map(([name, prob]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{name}</span>
                        <span className="text-slate-400">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getDisasterColor(name)}`} 
                          style={{ width: `${prob * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 font-mono text-center">Awaiting central telemetry stream connection...</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col md:flex-row justify-between gap-4 text-xs font-mono text-slate-400">
            <div>
              Active Model: <span className="text-cyan-400 font-bold">{liveAssessment?.model_stats?.algorithm || 'Random Forest'}</span>
            </div>
            <div>
              Empirical Validation Accuracy: <span className="text-emerald-400 font-bold">{(liveAssessment?.model_stats?.accuracy ? liveAssessment.model_stats.accuracy * 100 : 96.5).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Module 2: Scenario Simulation Sandbox Sliders */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col h-[520px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <BarChart2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Scenario Sandbox</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Slide parameters to simulate extreme conditions, then execute the predictive neural inference.
            </p>
            
            {/* Sliders Container */}
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {/* Rainfall Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Rainfall: {sandboxTelemetry.rainfall.toFixed(0)}mm</span>
                  <span className="text-slate-500">Max: 450mm</span>
                </div>
                <input 
                  type="range" min="0" max="450" step="5"
                  value={sandboxTelemetry.rainfall}
                  onChange={(e) => setSandboxTelemetry({...sandboxTelemetry, rainfall: parseFloat(e.target.value)})}
                  className="w-full accent-cyan-400 cursor-ew-resize bg-slate-900 rounded"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Temperature: {sandboxTelemetry.temperature.toFixed(1)}°C</span>
                  <span className="text-slate-500">Max: 50°C</span>
                </div>
                <input 
                  type="range" min="-10" max="50" step="0.5"
                  value={sandboxTelemetry.temperature}
                  onChange={(e) => setSandboxTelemetry({...sandboxTelemetry, temperature: parseFloat(e.target.value)})}
                  className="w-full accent-cyan-400 cursor-ew-resize bg-slate-900 rounded"
                />
              </div>

              {/* River Level Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">River Level: {sandboxTelemetry.river_level.toFixed(1)}m</span>
                  <span className="text-slate-500">Max: 12m</span>
                </div>
                <input 
                  type="range" min="0.5" max="12" step="0.1"
                  value={sandboxTelemetry.river_level}
                  onChange={(e) => setSandboxTelemetry({...sandboxTelemetry, river_level: parseFloat(e.target.value)})}
                  className="w-full accent-cyan-400 cursor-ew-resize bg-slate-900 rounded"
                />
              </div>

              {/* Wind Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Wind Speed: {sandboxTelemetry.wind_speed.toFixed(0)}km/h</span>
                  <span className="text-slate-500">Max: 220km/h</span>
                </div>
                <input 
                  type="range" min="0" max="220" step="2"
                  value={sandboxTelemetry.wind_speed}
                  onChange={(e) => setSandboxTelemetry({...sandboxTelemetry, wind_speed: parseFloat(e.target.value)})}
                  className="w-full accent-cyan-400 cursor-ew-resize bg-slate-900 rounded"
                />
              </div>

              {/* Seismic Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-300">Seismic (Richter): {sandboxTelemetry.seismic_activity.toFixed(2)}R</span>
                  <span className="text-slate-500">Max: 8.5R</span>
                </div>
                <input 
                  type="range" min="0" max="8.5" step="0.05"
                  value={sandboxTelemetry.seismic_activity}
                  onChange={(e) => setSandboxTelemetry({...sandboxTelemetry, seismic_activity: parseFloat(e.target.value)})}
                  className="w-full accent-cyan-400 cursor-ew-resize bg-slate-900 rounded"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleRunInference}
            disabled={runningInference}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-widest font-semibold rounded-lg shadow-[0_0_15px_rgba(124,58,237,0.25)] transition-all duration-300 cursor-pointer"
          >
            {runningInference ? 'Running Neural Inference...' : 'Execute Predictive Inference'}
          </button>
        </div>
      </div>

      {/* Render Sandbox Results Overlay if calculated */}
      {sandboxResult && (
        <div className="glass-panel p-5 rounded-xl border border-purple-500/30 bg-purple-950/5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">Sandbox Prediction Complete</h3>
              <p className="text-xs text-slate-300 mt-1">
                Primary predicted result: <span className="text-purple-400 font-bold uppercase">{sandboxResult.prediction}</span> (Risk Score: <span className="font-bold text-white">{Math.round(sandboxResult.risk_score)}%</span>)
              </p>
              
              {/* Collapsed small details */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400 mt-2">
                {Object.entries(sandboxResult.probabilities).map(([name, prob]: [string, any]) => (
                  <div key={name}>
                    {name}: <span className="text-white font-bold">{Math.round(prob * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setSandboxResult(null)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all"
          >
            Clear Sandbox Result
          </button>
        </div>
      )}
    </div>
  );
}
