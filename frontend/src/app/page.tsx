'use client';

import { useStore } from '@/store/useStore';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, User, LogOut, Terminal, Key, LayoutDashboard, 
  BrainCircuit, Globe2, Compass, BarChart3, Database, ShieldCheck 
} from 'lucide-react';

// Views
import OverviewView from '@/components/views/OverviewView';
import PredictionView from '@/components/views/PredictionView';
import MapView from '@/components/views/MapView';
import OptimizerView from '@/components/views/OptimizerView';
import AnalyticsView from '@/components/views/AnalyticsView';

type TabType = 'overview' | 'predictions' | 'map' | 'optimizer' | 'analytics';

export default function Page() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);
  const setAuth = useStore((state) => state.setAuth);
  const logout = useStore((state) => state.logout);
  const updateLiveFeed = useStore((state) => state.updateLiveFeed);
  const addAlert = useStore((state) => state.addAlert);

  // Client-side Navigation
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Hydration guard — prevents SSR/client mismatch.
  // Server always renders null (no localStorage). Client rehydrates after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Rehydrate auth state from localStorage on client mount
    const storedToken = localStorage.getItem('aegis_token');
    const storedUser = localStorage.getItem('aegis_user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setAuth(parsedUser, storedToken);
      } catch {
        localStorage.removeItem('aegis_token');
        localStorage.removeItem('aegis_user');
      }
    }
    setMounted(true);
  }, []);

  // Render nothing until client has mounted — avoids hydration mismatch entirely
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Login Local States
  const [username, setUsername] = useState('admin'); // pre-fill demo admin for hackathon convenience
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // Handle Login authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await axios.post('http://localhost:8000/api/auth/login', {
        username,
        password
      });
      setAuth(res.data.user, res.data.access_token);
    } catch (err: any) {
      setLoginError(err.response?.data?.detail || "Authentication request failed.");
    } finally {
      setLoggingIn(false);
    }
  };

  // WebSocket Lifecycle Consumer
  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    let reconnectInterval: NodeJS.Timeout;
    
    const connectWS = () => {
      console.log("[WEBSOCKET] Attempting connection to sensor stream...");
      const ws = new WebSocket('ws://localhost:8000/api/sensor-stream');
      
      ws.onopen = () => {
        console.log("[WEBSOCKET] Channel established successfully.");
      };

      ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          
          if (packet.type === 'TELEMETRY_UPDATE') {
            updateLiveFeed({
              telemetry: packet.telemetry,
              risk_assessment: packet.risk_assessment,
              active_alerts: packet.active_alerts
            });
          } else if (packet.type === 'ALERT_TRIGGERED') {
            addAlert(packet.data);
          }
        } catch (err) {
          console.error("[WEBSOCKET] Failed to decode packet: ", err);
        }
      };

      ws.onclose = () => {
        console.log("[WEBSOCKET] Connection closed. Attempting reconnect in 3.5s...");
        reconnectInterval = setTimeout(connectWS, 3500);
      };

      ws.onerror = (err) => {
        console.error("[WEBSOCKET] Connection error: ", err);
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      clearTimeout(reconnectInterval);
    };
  }, [isAuthenticated, updateLiveFeed, addAlert]);

  // Authenticator Holographic Portal View (Unauthenticated)
  if (!isAuthenticated) {
    return (
      <main className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 overflow-hidden tech-grid p-4">
        {/* Decorative Neon Blurs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-cyan-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10">
          {/* Logo Insignia */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldAlert className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-lg font-bold tracking-widest text-slate-100 uppercase">AEGIS INDIA COMMAND PORTAL</h1>
            <p className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase mt-1">NDRF Strategic Operations Control Authenticator</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 text-xs font-mono bg-rose-950/20 border border-rose-800 rounded-lg text-rose-400 text-center animate-shake">
                {loginError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Operator Username</label>
              <div className="relative">
                <input 
                  type="text" required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / field_agent"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono focus:border-cyan-400 outline-none text-slate-100 placeholder:text-slate-600"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Tactical Password Key</label>
              <div className="relative">
                <input 
                  type="password" required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono focus:border-cyan-400 outline-none text-slate-100 placeholder:text-slate-600"
                />
                <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[9px] font-mono text-slate-500 leading-normal">
              <div className="text-slate-400 font-semibold mb-0.5">Demo Bypass Keys:</div>
              <div>• Command Director: <span className="text-cyan-400">admin</span> / password: <span className="text-cyan-400">admin123</span></div>
              <div>• Field Operative: <span className="text-cyan-400">field_agent</span> / password: <span className="text-cyan-400">field123</span></div>
              <div className="mt-1 text-slate-600">NDRF India Disaster Intelligence Platform</div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs uppercase tracking-widest font-semibold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all cursor-pointer"
            >
              {loggingIn ? 'Decrypting Security Keys...' : 'Authenticate Credentials'}
            </button>
          </form>

          {/* Footer Insignia */}
          <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-slate-900 text-[8px] font-mono text-slate-600 tracking-wider">
            <Terminal className="w-3 h-3" />
            <span>AEGIS INDIA PLATFORM SECURED NODE // SEC-VER: 2.0.0</span>
          </div>
        </div>
      </main>
    );
  }

  // Active Dashboard Shell (Authenticated)
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 flex flex-col tech-grid">
      
      {/* 1. Futuristic Tactical Navbar */}
      <header className="glass-panel border-b border-slate-800/80 sticky top-0 z-[2000] px-4 md:px-6 py-3.5 flex items-center justify-between shadow-lg">
        {/* Branding insignia */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400 flex items-center justify-center shadow-[0_0_10px_rgba(3,105,161,0.2)]">
            <ShieldCheck className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-widest text-slate-100 font-sans uppercase">AEGIS INDIA OPERATIONS CENTER</h1>
            <p className="text-[8px] font-mono text-slate-400 tracking-wider uppercase">National Disaster Intelligence Network — NDRF</p>
          </div>
        </div>

        {/* User Badge & LogOut Button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end font-mono">
            <span className="text-[10px] font-semibold text-slate-200">{user?.name}</span>
            <span className="text-[8px] text-cyan-400/90 font-bold uppercase tracking-wider">{user?.role}</span>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 border border-slate-800/80 bg-slate-900/60 hover:bg-rose-950/20 hover:border-rose-800 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OFFLINE</span>
          </button>
        </div>
      </header>

      {/* 2. Main Sidebar & Content Container */}
      <div className="flex flex-1 flex-col md:flex-row h-full min-h-[calc(100vh-65px)]">
        
        {/* Cyberpunk Navigation Sidebar */}
        <aside className="glass-panel w-full md:w-64 border-r border-slate-800/80 py-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            
            {/* Sector indicator lights */}
            <div className="px-4">
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase block mb-2">Systems Status</span>
              <div className="space-y-1.5 font-mono text-[9px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse neon-pulse-dot"></span>
                  <span>AI Predictive Engine: ONLINE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse neon-pulse-dot"></span>
                  <span>Quantum Optimization: READY</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse neon-pulse-dot"></span>
                  <span>India Telemetry Stream: LIVE</span>
                </div>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5 px-2">
              {[
                { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
                { id: 'predictions', label: 'AI Risk Predictor', icon: BrainCircuit },
                { id: 'map', label: 'Tactical GIS Map', icon: Globe2 },
                { id: 'optimizer', label: 'Resource Optimizer', icon: Compass },
                { id: 'analytics', label: 'Intelligence Analytics', icon: BarChart3 }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold shadow-[inset_0_0_12px_rgba(6,182,212,0.08)]'
                        : 'border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Infrastructure status log card */}
          <div className="hidden md:block mx-3 mt-6 p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-[9px] font-mono text-slate-500 leading-normal">
            <span className="text-slate-400 font-semibold block mb-1">Audit Ledger Entry:</span>
            <div className="truncate">Node IP: 127.0.0.1</div>
            <div>DB Core: SQLite.db</div>
            <div>Security: TLS/AES-256</div>
            <div className="text-[8px] text-cyan-500/70 font-semibold mt-1 animate-pulse">SYSTEM READINESS: NOMINAL</div>
          </div>
        </aside>

        {/* Dynamic Display Board (Render Active View Component) */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-full">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'predictions' && <PredictionView />}
          {activeTab === 'map' && <MapView />}
          {activeTab === 'optimizer' && <OptimizerView />}
          {activeTab === 'analytics' && <AnalyticsView />}
        </main>

      </div>
    </div>
  );
}
