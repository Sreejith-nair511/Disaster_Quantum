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
  setAlerts: (alerts: Alert[]) => void;
  removeAlert: (id: number) => void;
  clearAlert: (id: number) => void;
  setAlgorithm: (alg: 'genetic' | 'pso' | 'annealing') => void;
  setAllocationResults: (results: OptimizationResult | null) => void;
  setOptimizing: (val: boolean) => void;
}

// India monsoon-season baseline telemetry — realistic values shown before WebSocket connects
const initialTelemetry: Telemetry = {
  rainfall: 38.5,
  temperature: 32.4,
  humidity: 74.0,
  river_level: 2.8,
  wind_speed: 19.5,
  seismic_activity: 0.08,
  land_slope: 27.5
};

export const useStore = create<AppState>((set) => ({
  // Auth State — always start as unauthenticated for SSR safety.
  // Client rehydration from localStorage happens in page.tsx via useEffect.
  user: null,
  token: null,
  isAuthenticated: false,
  
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

  setAlerts: (alerts) => set({ activeAlerts: alerts }),

  removeAlert: (id) => set((state) => ({
    activeAlerts: state.activeAlerts.filter((a) => a.id !== id)
  })),

  clearAlert: (id) => set((state) => ({
    activeAlerts: state.activeAlerts.filter((a) => a.id !== id)
  })),
  
  setAlgorithm: (selectedAlgorithm) => set({ selectedAlgorithm }),
  setAllocationResults: (allocationResults) => set({ allocationResults }),
  setOptimizing: (isOptimizing) => set({ isOptimizing })
}));
