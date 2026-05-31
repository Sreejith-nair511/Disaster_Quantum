import numpy as np
from typing import Dict, List, Tuple

# Resources available at the National Disaster Response Force (NDRF) central hub — New Delhi
TOTAL_RESOURCES = {
    "ambulances": 40,          # Units (Integer) — scaled for India's population density
    "rescue_teams": 30,        # Units (Integer) — NDRF battalions
    "medical_supplies": 250.0, # Tons (Continuous)
    "shelters": 120            # Capacity units (Integer) — relief camps
}

# 5 India disaster zones — real high-risk regions mapped to grid coordinates
# Grid origin (0,0) = SW corner; x = longitude offset, y = latitude offset (degrees * 10)
# Hub = New Delhi (28.6°N, 77.2°E) → grid (77.2, 28.6)
ZONES = [
    {
        "id": "zone_alpha",
        "name": "Zone Alpha (Mumbai Coast — Maharashtra)",
        "x": 72.8, "y": 19.1,
        "demand": {"ambulances": 14, "rescue_teams": 10, "medical_supplies": 80.0, "shelters": 35}
    },
    {
        "id": "zone_beta",
        "name": "Zone Beta (Brahmaputra Valley — Assam)",
        "x": 91.7, "y": 26.1,
        "demand": {"ambulances": 12, "rescue_teams": 9, "medical_supplies": 70.0, "shelters": 30}
    },
    {
        "id": "zone_gamma",
        "name": "Zone Gamma (Western Ghats — Kerala)",
        "x": 76.3, "y": 10.5,
        "demand": {"ambulances": 8, "rescue_teams": 7, "medical_supplies": 50.0, "shelters": 25}
    },
    {
        "id": "zone_delta",
        "name": "Zone Delta (Himalayan Foothills — Uttarakhand)",
        "x": 79.1, "y": 30.3,
        "demand": {"ambulances": 7, "rescue_teams": 6, "medical_supplies": 35.0, "shelters": 20}
    },
    {
        "id": "zone_epsilon",
        "name": "Zone Epsilon (Odisha Cyclone Coast)",
        "x": 85.8, "y": 20.5,
        "demand": {"ambulances": 10, "rescue_teams": 8, "medical_supplies": 60.0, "shelters": 28}
    }
]

# NDRF National Command Hub — New Delhi
CENTRAL_HUB = {"x": 77.2, "y": 28.6}

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
