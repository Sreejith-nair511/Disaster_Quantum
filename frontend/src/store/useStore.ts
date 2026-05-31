import { create } from 'zustand';

export interface Telemetry {
  rainfall: number;
  temperature: number;
  humidity: number;
  river_level: number;
  wind_speed: number;
  seismic_activity: number;
  land_slope: number;
}

export interface RiskAssessment {
  prediction: string;
  confidence: number;
  risk_score: number;
  probabilities: Record<string, number>;
  model_stats: {
    algorithm: string;
    accuracy: number;
    alternative_algorithm: string;
    alternative_accuracy: number;
  };
}

export interface Alert {
  id: number;
  timestamp: string;
  hazard_type: string;
  severity: string;
  message: string;
  resolved: number;
}

export interface OptimizationResult {
  selected_results: {
    algorithm: string;
    allocation: Record<string, Record<string, number>>;
    cost_breakdown: {
      total_cost: number;
      mismatch_penalty: number;
      transit_cost: number;
      constraint_violation_penalty: number;
    };
    fitness: number;
    convergence_history: number[];
  };
  comparisons: Array<{
    algorithm: string;
    fitness: number;
    time_ms: number;
  }>;
  limits: Record<string, number>;
  zones: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    demand: Record<string, number>;
  }>;
}

interface User {
  username: string;
  name: string;
  role: string;
}

interface AppState {
  // Auth State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Real-Time Telemetry
  telemetry: Telemetry;
  riskAssessment: RiskAssessment | null;
  activeAlerts: Alert[];
  
  // Optimization State
  selectedAlgorithm: 'genetic' | 'pso' | 'annealing';
  allocationResults: OptimizationResult | null;
  isOptimizing: boolean;
  
  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateLiveFeed: (data: { telemetry: Telemetry; risk_assessment: RiskAssessment; active_alerts: Alert[] }) => void;
  addAlert: (alert: Alert) => void;
  setAlgorithm: (alg: 'genetic' | 'pso' | 'annealing') => void;
  setAllocationResults: (results: OptimizationResult | null) => void;
  setOptimizing: (val: boolean) => void;
}

// Initial Telemetry placeholder
const initialTelemetry: Telemetry = {
  rainfall: 0.0,
  temperature: 20.0,
  humidity: 50.0,
  river_level: 1.0,
  wind_speed: 10.0,
  seismic_activity: 0.01,
  land_slope: 25.0
};

export const useStore = create<AppState>((set) => ({
  // Auth State initializers
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('aegis_user') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('aegis_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('aegis_token') : false,
  
  // Telemetry & Predictions
  telemetry: initialTelemetry,
  riskAssessment: null,
  activeAlerts: [],
  
  // Optimizer
  selectedAlgorithm: 'genetic',
  allocationResults: null,
  isOptimizing: false,
  
  // Actions
  setAuth: (user, token) => {
    localStorage.setItem('aegis_user', JSON.stringify(user));
    localStorage.setItem('aegis_token', token);
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('aegis_user');
    localStorage.removeItem('aegis_token');
    set({ user: null, token: null, isAuthenticated: false, allocationResults: null });
  },
  
  updateLiveFeed: (data) => {
    set({
      telemetry: data.telemetry,
      riskAssessment: data.risk_assessment,
      activeAlerts: data.active_alerts
    });
  },
  
  addAlert: (alert) => {
    set((state) => {
      // Avoid duplicate alert cards
      if (state.activeAlerts.some((a) => a.id === alert.id)) return state;
      return { activeAlerts: [alert, ...state.activeAlerts] };
    });
  },
  
  setAlgorithm: (selectedAlgorithm) => set({ selectedAlgorithm }),
  setAllocationResults: (allocationResults) => set({ allocationResults }),
  setOptimizing: (isOptimizing) => set({ isOptimizing })
}));
