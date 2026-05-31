import numpy as np
from typing import Dict, List, Tuple
from optimizer.base import ZONES, TOTAL_RESOURCES, evaluate_allocation

class ParticleSwarmOptimizer:
    def __init__(self, swarm_size: int = 30, max_iterations: int = 50, 
                 w: float = 0.7, c1: float = 1.5, c2: float = 1.5):
        self.swarm_size = swarm_size
        self.max_iter = max_iterations
        self.w = w      # Inertia weight
        self.c1 = c1    # Cognitive coefficient
        self.c2 = c2    # Social coefficient
        
        self.num_zones = len(ZONES)
        self.zone_ids = [z['id'] for z in ZONES]
        self.res_types = list(TOTAL_RESOURCES.keys())
        self.num_resources = len(self.res_types)

    def _matrix_to_allocation(self, pos_matrix: np.ndarray) -> Dict[str, Dict[str, float]]:
        """Converts continuous position matrix to a discrete/continuous resource allocation mapping."""
        allocation = {z_id: {} for z_id in self.zone_ids}
        
        # Ensure sum of allocations doesn't exceed total resources by normalising if needed
        # But evaluate_allocation will penalise exceedance, so we can normalise to start off with a valid solution
        for r_idx, res_type in enumerate(self.res_types):
            total_limit = TOTAL_RESOURCES[res_type]
            res_values = pos_matrix[:, r_idx]
            
            # Clip negative values
            res_values = np.clip(res_values, 0.0, None)
            
            # Normalize to sum up to total limit if they exceed, which guides swarm to feasible regions much faster
            sum_val = np.sum(res_values)
            if sum_val > total_limit:
                res_values = (res_values / sum_val) * total_limit
                
            is_int = isinstance(total_limit, int)
            for z_idx, zone_id in enumerate(self.zone_ids):
                allocated_val = res_values[z_idx]
                if is_int:
                    allocation[zone_id][res_type] = float(max(0, int(round(allocated_val))))
                else:
                    allocation[zone_id][res_type] = float(max(0.0, allocated_val))
                    
        return allocation

    def optimize(self, zone_severities: Dict[str, float]) -> Tuple[Dict[str, Dict[str, float]], dict]:
        """
        Runs Particle Swarm Optimization to find the optimal resource configuration.
        """
        # 1. Initialize Swarm
        # Positions: uniform distribution inside capacity shares
        positions = np.zeros((self.swarm_size, self.num_zones, self.num_resources))
        velocities = np.zeros((self.swarm_size, self.num_zones, self.num_resources))
        
        for r_idx, res_type in enumerate(self.res_types):
            total_limit = TOTAL_RESOURCES[res_type]
            positions[:, :, r_idx] = np.random.uniform(0.0, total_limit / self.num_zones * 1.5, (self.swarm_size, self.num_zones))
            velocities[:, :, r_idx] = np.random.uniform(-total_limit / self.num_zones * 0.2, total_limit / self.num_zones * 0.2, (self.swarm_size, self.num_zones))

        # Personal Bests
        pbest_positions = positions.copy()
        pbest_costs = np.full(self.swarm_size, float('inf'))
        pbest_allocations = [None] * self.swarm_size
        pbest_breakdowns = [None] * self.swarm_size
        
        # Global Best
        gbest_position = np.zeros((self.num_zones, self.num_resources))
        gbest_cost = float('inf')
        gbest_allocation = None
        gbest_breakdown = {}
        
        history = []
        
        # Evaluate initial population
        for i in range(self.swarm_size):
            alloc = self._matrix_to_allocation(positions[i])
            cost, bdown = evaluate_allocation(alloc, zone_severities)
            
            pbest_costs[i] = cost
            pbest_allocations[i] = alloc
            pbest_breakdowns[i] = bdown
            
            if cost < gbest_cost:
                gbest_cost = cost
                gbest_position = positions[i].copy()
                gbest_allocation = alloc
                gbest_breakdown = bdown

        # 2. Main PSO Optimization Loop
        for iteration in range(self.max_iter):
            # Inertia weight damping (improves convergence)
            current_w = self.w * (0.9 - 0.4 * (iteration / self.max_iter))
            
            for i in range(self.swarm_size):
                # Sample random vectors
                r1 = np.random.rand(self.num_zones, self.num_resources)
                r2 = np.random.rand(self.num_zones, self.num_resources)
                
                # Update Velocity
                cognitive = self.c1 * r1 * (pbest_positions[i] - positions[i])
                social = self.c2 * r2 * (gbest_position - positions[i])
                velocities[i] = current_w * velocities[i] + cognitive + social
                
                # Update Position
                positions[i] = positions[i] + velocities[i]
                
                # Boundary enforcement (prevent negative resources)
                positions[i] = np.clip(positions[i], 0.0, None)
                
                # Re-evaluate
                alloc = self._matrix_to_allocation(positions[i])
                cost, bdown = evaluate_allocation(alloc, zone_severities)
                
                # Check Personal Best
                if cost < pbest_costs[i]:
                    pbest_costs[i] = cost
                    pbest_positions[i] = positions[i].copy()
                    pbest_allocations[i] = alloc
                    pbest_breakdowns[i] = bdown
                    
                # Check Global Best
                if cost < gbest_cost:
                    gbest_cost = cost
                    gbest_position = positions[i].copy()
                    gbest_allocation = alloc
                    gbest_breakdown = bdown
                    
            history.append(float(gbest_cost))
            
        result = {
            "algorithm": "Particle Swarm Optimization",
            "allocation": gbest_allocation,
            "cost_breakdown": gbest_breakdown,
            "fitness": float(gbest_cost),
            "convergence_history": history
        }
        
        return gbest_allocation, result
