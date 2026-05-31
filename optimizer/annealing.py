import numpy as np
from typing import Dict, List, Tuple
import copy
from optimizer.base import ZONES, TOTAL_RESOURCES, evaluate_allocation

class SimulatedAnnealingOptimizer:
    def __init__(self, initial_temp: float = 1000.0, cooling_rate: float = 0.94, max_iterations: int = 150):
        self.init_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.max_iter = max_iterations
        
        self.zone_ids = [z['id'] for z in ZONES]
        self.res_types = list(TOTAL_RESOURCES.keys())

    def _generate_initial_state(self) -> Dict[str, Dict[str, float]]:
        """Generates a simple proportional-severity allocation to start with."""
        state = {z_id: {} for z_id in self.zone_ids}
        num_zones = len(ZONES)
        
        for res_type in self.res_types:
            total_limit = TOTAL_RESOURCES[res_type]
            is_int = isinstance(total_limit, int)
            
            # Initially, distribute evenly
            even_share = total_limit / num_zones
            
            for zone_id in self.zone_ids:
                if is_int:
                    state[zone_id][res_type] = float(max(0, int(round(even_share))))
                else:
                    state[zone_id][res_type] = float(even_share)
                    
        return state

    def _get_neighbor(self, current_state: Dict[str, Dict[str, float]]) -> Dict[str, Dict[str, float]]:
        """
        Creates a neighboring solution by perturbing the current allocation.
        Randomly moves resources between zones or applies a small variance.
        """
        neighbor = copy.deepcopy(current_state)
        
        # Select random resource and two random zones
        res_type = np.random.choice(self.res_types)
        zone1, zone2 = np.random.choice(self.zone_ids, 2, replace=False)
        
        total_limit = TOTAL_RESOURCES[res_type]
        is_int = isinstance(total_limit, int)
        
        val1 = neighbor[zone1][res_type]
        val2 = neighbor[zone2][res_type]
        
        if is_int:
            # Transfer a small integer amount (1 or 2 units)
            delta = int(np.random.choice([1, 2]))
            if val1 >= delta:
                neighbor[zone1][res_type] = float(int(val1 - delta))
                neighbor[zone2][res_type] = float(int(val2 + delta))
        else:
            # Transfer continuous amounts (percentage of value or small fraction)
            delta = float(np.random.uniform(0.1, 5.0))
            if val1 >= delta:
                neighbor[zone1][res_type] = max(0.0, val1 - delta)
                neighbor[zone2][res_type] = val2 + delta
                
        return neighbor

    def optimize(self, zone_severities: Dict[str, float]) -> Tuple[Dict[str, Dict[str, float]], dict]:
        """
        Runs Simulated Annealing to optimize resource allocation.
        """
        # 1. Initialize
        current_state = self._generate_initial_state()
        current_cost, current_bdown = evaluate_allocation(current_state, zone_severities)
        
        best_state = copy.deepcopy(current_state)
        best_cost = current_cost
        best_bdown = current_bdown
        
        history = []
        temp = self.init_temp
        
        # 2. Annealing Loop
        for iteration in range(self.max_iter):
            # Generate neighbor state
            neighbor = self._get_neighbor(current_state)
            neighbor_cost, neighbor_bdown = evaluate_allocation(neighbor, zone_severities)
            
            # Energy gap
            d_energy = neighbor_cost - current_cost
            
            # Acceptance criteria
            if d_energy < 0:
                # Better solution: always accept
                current_state = copy.deepcopy(neighbor)
                current_cost = neighbor_cost
                current_bdown = neighbor_bdown
            else:
                # Worse solution: accept probabilistically based on thermodynamic temperature
                p_accept = np.exp(-d_energy / temp) if temp > 0 else 0.0
                if np.random.rand() < p_accept:
                    current_state = copy.deepcopy(neighbor)
                    current_cost = neighbor_cost
                    current_bdown = neighbor_bdown
                    
            # Check global best
            if current_cost < best_cost:
                best_state = copy.deepcopy(current_state)
                best_cost = current_cost
                best_bdown = current_bdown
                
            history.append(float(best_cost))
            
            # Cooling schedule
            temp = temp * self.cooling_rate
            
        result = {
            "algorithm": "Simulated Annealing",
            "allocation": best_state,
            "cost_breakdown": best_bdown,
            "fitness": float(best_cost),
            "convergence_history": history
        }
        
        return best_state, result
