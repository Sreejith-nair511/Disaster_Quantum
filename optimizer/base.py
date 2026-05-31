import numpy as np
from typing import Dict, List, Tuple

# Resources available in the central emergency operations hub
TOTAL_RESOURCES = {
    "ambulances": 25,          # Units (Integer)
    "rescue_teams": 18,        # Units (Integer)
    "medical_supplies": 150.0, # Tons (Continuous)
    "shelters": 60             # Capacity units (Integer)
}

# 5 Disaster sectors with coordinates and baseline demands
ZONES = [
    {"id": "zone_alpha", "name": "Zone Alpha (Coastline)", "x": 12.0, "y": 8.0, "demand": {"ambulances": 8, "rescue_teams": 6, "medical_supplies": 45.0, "shelters": 20}},
    {"id": "zone_beta", "name": "Zone Beta (Urban Core)", "x": 22.0, "y": 35.0, "demand": {"ambulances": 12, "rescue_teams": 5, "medical_supplies": 50.0, "shelters": 15}},
    {"id": "zone_gamma", "name": "Zone Gamma (Hills/Valleys)", "x": 5.0, "y": 45.0, "demand": {"ambulances": 5, "rescue_teams": 8, "medical_supplies": 40.0, "shelters": 25}},
    {"id": "zone_delta", "name": "Zone Delta (Industrial Zone)", "x": 45.0, "y": 18.0, "demand": {"ambulances": 6, "rescue_teams": 4, "medical_supplies": 30.0, "shelters": 10}},
    {"id": "zone_epsilon", "name": "Zone Epsilon (Rural North)", "x": 30.0, "y": 55.0, "demand": {"ambulances": 4, "rescue_teams": 3, "medical_supplies": 20.0, "shelters": 12}}
]

CENTRAL_HUB = {"x": 25.0, "y": 30.0}

def calculate_distance(p1: dict, p2: dict) -> float:
    """Euclidean distance representing transit cost."""
    return float(np.sqrt((p1['x'] - p2['x'])**2 + (p1['y'] - p2['y'])**2))

def evaluate_allocation(allocations: Dict[str, Dict[str, float]], zone_severities: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
    """
    Computes the total cost (fitness) of a specific resource allocation strategy.
    Lower score is better (objective: minimize cost/penalty).
    """
    mismatch_penalty = 0.0
    transit_cost = 0.0
    constraint_violation_penalty = 0.0
    
    resource_sums = {r: 0.0 for r in TOTAL_RESOURCES.keys()}
    
    # Analyze zone allocation cost
    for zone in ZONES:
        zone_id = zone['id']
        severity = zone_severities.get(zone_id, 10.0)  # Severity on a scale of 0 to 100
        
        # Calculate transit distance
        dist = calculate_distance(CENTRAL_HUB, zone)
        
        for res_type in TOTAL_RESOURCES.keys():
            allocated = allocations.get(zone_id, {}).get(res_type, 0.0)
            demand = zone['demand'][res_type]
            
            # Sum up total resources used
            resource_sums[res_type] += allocated
            
            # Compute mismatch (unmet demand)
            unmet = max(0.0, demand - allocated)
            # Quadratic mismatch penalty, scaled by severity weight
            mismatch_penalty += (severity / 10.0) * (unmet ** 2) * 5.0
            
            # Compute travel/distribution cost (higher amount dispatched = higher logistical cost)
            transit_cost += allocated * dist * 0.1
            
            # Prevent negative allocations
            if allocated < 0:
                constraint_violation_penalty += 5000.0

    # Constraint Check: Total resource limits
    for res_type, limit in TOTAL_RESOURCES.items():
        total_used = resource_sums[res_type]
        if total_used > limit:
            excess = total_used - limit
            # Heavily penalize capacity violations
            constraint_violation_penalty += (excess ** 2) * 200.0

    total_cost = mismatch_penalty + transit_cost + constraint_violation_penalty
    
    breakdown = {
        "total_cost": total_cost,
        "mismatch_penalty": mismatch_penalty,
        "transit_cost": transit_cost,
        "constraint_violation_penalty": constraint_violation_penalty
    }
    
    return total_cost, breakdown
