import numpy as np
from typing import Dict, Dict, List, Tuple
from optimizer.base import ZONES, TOTAL_RESOURCES, evaluate_allocation

class QuantumGeneticOptimizer:
    def __init__(self, population_size: int = 30, max_generations: int = 50, learning_rate: float = 0.05):
        self.pop_size = population_size
        self.max_generations = max_generations
        self.learning_rate = learning_rate  # Quantum rotation gate angle step
        
        # Dimensions
        self.num_zones = len(ZONES)
        self.zone_ids = [z['id'] for z in ZONES]
        self.res_types = list(TOTAL_RESOURCES.keys())
        self.num_resources = len(self.res_types)

    def initialize_q_population(self) -> np.ndarray:
        """
        Initializes the population of quantum chromosomes.
        Each chromosome is represented as a matrix of phase angles (theta) in [0, pi/2].
        Probability of allocating to a zone is sin(theta)^2.
        Shape: (pop_size, num_zones, num_resources)
        """
        # Start in a state of uniform superposition (theta = pi/4, so sin(pi/4)^2 = 0.5)
        return np.full((self.pop_size, self.num_zones, self.num_resources), np.pi / 4.0)

    def collapse_quantum_state(self, q_chromosome: np.ndarray) -> Dict[str, Dict[str, float]]:
        """
        Measures (collapses) a quantum chromosome into a concrete resource allocation.
        """
        allocation = {z_id: {} for z_id in self.zone_ids}
        
        # Calculate probabilities from phase angles
        probabilities = np.sin(q_chromosome) ** 2  # Shape: (num_zones, num_resources)
        
        for r_idx, res_type in enumerate(self.res_types):
            total_limit = TOTAL_RESOURCES[res_type]
            res_probs = probabilities[:, r_idx]
            
            # Normalize probabilities across zones so we don't massively exceed limit immediately
            sum_prob = np.sum(res_probs)
            if sum_prob > 0:
                normalized_probs = res_probs / sum_prob
            else:
                normalized_probs = np.full(self.num_zones, 1.0 / self.num_zones)
            
            # Collapse to concrete values
            is_int = isinstance(total_limit, int)
            
            for z_idx, zone_id in enumerate(self.zone_ids):
                # Distribute resource proportional to normalized quantum probability
                allocated_val = normalized_probs[z_idx] * total_limit
                
                if is_int:
                    # Integer allocation (round to nearest whole, maxing at demand to keep it sensible)
                    allocation[zone_id][res_type] = float(max(0, int(round(allocated_val))))
                else:
                    # Continuous allocation
                    allocation[zone_id][res_type] = float(max(0.0, allocated_val))
                    
        return allocation

    def apply_quantum_rotation_gate(self, q_pop: np.ndarray, collapsed_pop: List[dict], 
                                     fitness_scores: List[float], best_collapsed: dict, 
                                     best_fitness: float) -> np.ndarray:
        """
        Applies a quantum rotation gate (U-gate) to update phase angles.
        Rotates theta towards the global best collapsed state to increase its occurrence probability.
        """
        updated_pop = q_pop.copy()
        
        # Determine the target collapsed configuration as a matrix
        target_matrix = np.zeros((self.num_zones, self.num_resources))
        for z_idx, zone_id in enumerate(self.zone_ids):
            for r_idx, res_type in enumerate(self.res_types):
                total_limit = TOTAL_RESOURCES[res_type]
                best_val = best_collapsed.get(zone_id, {}).get(res_type, 0.0)
                # Convert back to a rough normalized fraction
                target_matrix[z_idx, r_idx] = best_val / total_limit if total_limit > 0 else 0.0

        for i in range(self.pop_size):
            # Calculate current collapsed representation
            curr_collapsed = collapsed_pop[i]
            curr_matrix = np.zeros((self.num_zones, self.num_resources))
            for z_idx, zone_id in enumerate(self.zone_ids):
                for r_idx, res_type in enumerate(self.res_types):
                    total_limit = TOTAL_RESOURCES[res_type]
                    curr_val = curr_collapsed.get(zone_id, {}).get(res_type, 0.0)
                    curr_matrix[z_idx, r_idx] = curr_val / total_limit if total_limit > 0 else 0.0
            
            # Compare current fitness with best fitness to determine rotation direction
            # If current is worse than best, rotate phase angles toward best
            fit_i = fitness_scores[i]
            
            for z in range(self.num_zones):
                for r in range(self.num_resources):
                    theta = q_pop[i, z, r]
                    best_bit = target_matrix[z, r]
                    curr_bit = curr_matrix[z, r]
                    
                    # Compute delta theta rotation
                    # Standard Quantum rotation gate lookup table approach simplified:
                    # If current bit is different from the best bit, rotate to align
                    if fit_i > best_fitness:  # Current is worse
                        if curr_bit < best_bit:
                            # Rotate positive to increase probability of 1/high
                            d_theta = self.learning_rate
                        elif curr_bit > best_bit:
                            # Rotate negative to decrease probability
                            d_theta = -self.learning_rate
                        else:
                            d_theta = 0.0
                    else:
                        d_theta = 0.0
                        
                    # Apply rotation and clamp within [0, pi/2]
                    updated_pop[i, z, r] = np.clip(theta + d_theta, 0.01, np.pi/2 - 0.01)
                    
        return updated_pop

    def optimize(self, zone_severities: Dict[str, float]) -> Tuple[Dict[str, Dict[str, float]], dict]:
        """
        Runs the Quantum-Inspired Genetic Algorithm.
        """
        # 1. Initialize
        q_pop = self.initialize_q_population()
        
        best_allocation = None
        best_fitness = float('inf')
        best_breakdown = {}
        
        history = []
        
        # 2. Evolution Loop
        for gen in range(self.max_generations):
            collapsed_pop = []
            fitness_scores = []
            breakdowns = []
            
            # Collapse and evaluate each quantum chromosome
            for i in range(self.pop_size):
                alloc = self.collapse_quantum_state(q_pop[i])
                cost, bdown = evaluate_allocation(alloc, zone_severities)
                
                collapsed_pop.append(alloc)
                fitness_scores.append(cost)
                breakdowns.append(bdown)
                
                # Keep track of global best
                if cost < best_fitness:
                    best_fitness = cost
                    best_allocation = alloc
                    best_breakdown = bdown
            
            # Apply quantum rotation gate to update the population
            q_pop = self.apply_quantum_rotation_gate(
                q_pop, collapsed_pop, fitness_scores, best_allocation, best_fitness
            )
            
            history.append(float(best_fitness))
            
        result = {
            "algorithm": "Quantum Genetic Algorithm",
            "allocation": best_allocation,
            "cost_breakdown": best_breakdown,
            "fitness": float(best_fitness),
            "convergence_history": history
        }
        
        return best_allocation, result
