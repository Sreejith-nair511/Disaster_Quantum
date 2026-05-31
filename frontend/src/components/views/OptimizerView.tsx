'use client';

import { useStore } from '@/store/useStore';
import { useState } from 'react';
import axios from 'axios';
import { 
  Zap, Cpu, Sliders, Play, AlertCircle, BarChart3, CheckSquare, 
  TrendingDown, Layers, Terminal 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

export default function OptimizerView() {
  const selectedAlgorithm = useStore((state) => state.selectedAlgorithm);
  const setAlgorithm = useStore((state) => state.setAlgorithm);
  const allocationResults = useStore((state) => state.allocationResults);
  const setAllocationResults = useStore((state) => state.setAllocationResults);
  const isOptimizing = useStore((state) => state.isOptimizing);
  const setOptimizing = useStore((state) => state.setOptimizing);

  // Dynamic Sector Severities Sliders
  const [severities, setSeverities] = useState<Record<string, number>>({
    zone_alpha: 75.0,
    zone_beta: 45.0,
    zone_gamma: 85.0,
    zone_delta: 30.0,
    zone_epsilon: 20.0
  });

  // Terminal log simulation strings
  const [logs, setLogs] = useState<string[]>([]);

  // Update slider value
  const handleSeverityChange = (zoneId: string, val: number) => {
    setSeverities(prev => ({ ...prev, [zoneId]: val }));
  };

  // Run Optimization against FastAPI
  const handleOptimize = async () => {
    setOptimizing(true);
    setLogs([
      "[SYSTEM] Initializing Resource Allocation Command...",
      "[INFO] Fetching environmental hazard constraints...",
      `[INFO] Target Algorithm collapse selected: ${selectedAlgorithm.toUpperCase()}`
    ]);

    // Fast terminal log animations
    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        "[GA-ENGINE] Initializing Quantum Chromosome phase grid in Superposition...",
        "[GA-ENGINE] Enforcing supply pool capacity limits (Ambulances=25, Teams=18, Supplies=150t)..."
      ]);
    }, 400);

    setTimeout(() => {
      setLogs(prev => [
        ...prev,
        "[EVALUATOR] Calculating logistical transit distance costs from Honolulu HQ Hub...",
        "[OPTIMIZER] Running continuous phase gate rotations on Qubits (Generations 1 to 50)...",
        "[SUCCESS] Converging optimal solution. Fitting state constraints..."
      ]);
    }, 900);

    try {
      const res = await axios.post('http://localhost:8000/api/allocate-resources', {
        algorithm: selectedAlgorithm,
        severities: severities
      });

      setTimeout(() => {
        setAllocationResults(res.data);
        setLogs(prev => [
          ...prev,
          "[SUCCESS] Allocation collapsed successfully. Dispatched assets synced."
        ]);
        setOptimizing(false);
      }, 1400);

    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, "[FATAL] Connection to optimization engines failed."]);
      setOptimizing(false);
    }
  };

  // Chart Formatting Helpers
  const convergenceData = allocationResults?.selected_results?.convergence_history.map((cost, idx) => ({
    iteration: idx + 1,
    cost: Math.round(cost)
  })) || [];

  const comparisonData = allocationResults?.comparisons.map((c) => ({
    name: c.algorithm.replace("Quantum ", "").replace(" Optimizer", ""),
    cost: Math.round(c.fitness)
  })) || [];

  // Zone Display Metadata Map
  const ZONE_NAMES: Record<string, string> = {
    zone_alpha: "Zone Alpha (Coastline)",
    zone_beta: "Zone Beta (Urban Core)",
    zone_gamma: "Zone Gamma (Nuuanu Hills)",
    zone_delta: "Zone Delta (Pearl Harbor)",
    zone_epsilon: "Zone Epsilon (Rural North)"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Tactical Allocation Command</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">QUANTUM-AI ENGINES: GENETIC GA, PARTICLE SWARM & SIMULATED ANNEALING</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-slate-300">ENGINES HOT: ONLINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Sliders & Alg Choice */}
        <div className="glass-panel p-5 rounded-xl border border-slate-800 flex flex-col justify-between h-[550px]">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Sector Priority Tuner</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Calibrate regional threat weights based on active ground indicators.
            </p>
            
            <div className="space-y-4">
              {Object.entries(severities).map(([zoneId, score]) => (
                <div key={zoneId} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-medium">{ZONE_NAMES[zoneId]}</span>
                    <span className={`font-bold ${score > 70 ? 'text-rose-400' : score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {score.toFixed(0)} W
                    </span>
                  </div>
                  <input 
                    type="range" min="10" max="100" step="5"
                    value={score}
                    onChange={(e) => handleSeverityChange(zoneId, parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-ew-resize bg-slate-900 rounded h-1.5"
                  />
                </div>
              ))}
            </div>

            {/* Algorithm Select */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-mono text-slate-400 uppercase block mb-2">Collapse Selector</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'genetic', label: 'Quantum GA' },
                  { id: 'pso', label: 'Particle Swarm' },
                  { id: 'annealing', label: 'Thermal SA' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAlgorithm(opt.id as any)}
                    className={`p-2 rounded text-[10px] font-mono uppercase font-semibold text-center border cursor-pointer transition-all ${
                      selectedAlgorithm === opt.id 
                        ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full py-3 mt-4 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-mono text-xs uppercase tracking-widest font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300 cursor-pointer"
          >
            {isOptimizing ? 'Compressing Wave Functions...' : 'Trigger Quantum Optimization'}
          </button>
        </div>

        {/* Right Columns: Results, Charts & Terminal Logs */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {isOptimizing ? (
            /* Terminal Optimization Log Screen */
            <div className="glass-panel p-5 rounded-xl border border-cyan-500/20 bg-slate-950/80 h-[550px] flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800 text-cyan-400">
                  <Terminal className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-widest font-bold">Optimization Core Logs</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 shrink-0">&gt;&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-cyan-400/80 animate-pulse">
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Running dynamic resource calculations...</span>
              </div>
            </div>
          ) : allocationResults ? (
            /* Optimization Results Visual Dashboard */
            <div className="space-y-6 max-h-[550px] overflow-y-auto pr-1">
              
              {/* 1. Results Allocation Table */}
              <div className="glass-panel p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">Tactical Allocation Dispatch</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                    FEASIBLE STATE COLLAPSED
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 font-semibold">Operational Sector</th>
                        <th className="py-2.5 font-semibold text-center">🚑 Ambulances</th>
                        <th className="py-2.5 font-semibold text-center">🚁 Helicopters</th>
                        <th className="py-2.5 font-semibold text-center">📦 Supplies (t)</th>
                        <th className="py-2.5 font-semibold text-center">⛺ Shelters</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {Object.entries(allocationResults.selected_results.allocation).map(([zId, alloc]: [string, any]) => (
                        <tr key={zId} className="hover:bg-slate-900/40">
                          <td className="py-2.5 font-semibold text-slate-200">{ZONE_NAMES[zId]}</td>
                          <td className="py-2.5 text-center font-bold text-cyan-400">{alloc.ambulances}</td>
                          <td className="py-2.5 text-center font-bold text-purple-400">{alloc.rescue_teams}</td>
                          <td className="py-2.5 text-center font-bold text-amber-400">{Math.round(alloc.medical_supplies)}t</td>
                          <td className="py-2.5 text-center font-bold text-sky-400">{alloc.shelters}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Charts Row: Convergence History & Cost Comparisons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Convergence Curve */}
                <div className="glass-panel p-5 rounded-xl border border-slate-800 h-64">
                  <div className="flex items-center gap-2 mb-3 text-xs font-mono text-slate-400 uppercase">
                    <TrendingDown className="w-4 h-4 text-cyan-400" />
                    <span>Convergence Descent Speed</span>
                  </div>
                  <div className="w-full h-44 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={convergenceData}>
                        <XAxis dataKey="iteration" stroke="#475569" fontSize={9} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                          itemStyle={{ color: '#22d3ee', fontFamily: 'monospace', fontSize: 11 }}
                        />
                        <Line type="monotone" dataKey="cost" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Model Comparison Bar Chart */}
                <div className="glass-panel p-5 rounded-xl border border-slate-800 h-64">
                  <div className="flex items-center gap-2 mb-3 text-xs font-mono text-slate-400 uppercase">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Cost Function Contrast (Min=Best)</span>
                  </div>
                  <div className="w-full h-44 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData}>
                        <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
                          itemStyle={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: 11 }}
                        />
                        <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                          {comparisonData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.name.includes("Swarm") ? '#8b5cf6' : entry.name.includes("Genetic") ? '#06b6d4' : '#64748b'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Standby Dashboard State */
            <div className="glass-panel p-6 rounded-xl border border-dashed border-slate-800 h-[550px] flex flex-col items-center justify-center text-center">
              <Cpu className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Awaiting Resource Dispatch Command</p>
              <p className="text-[10px] text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                Tune priority parameters in the sector panel, select a mathematical solver, and collapse the quantum optimization engine to dispatch emergency resources.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
