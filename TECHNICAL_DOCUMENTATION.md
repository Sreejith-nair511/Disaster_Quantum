# Aegis Disaster Intelligence Operations Platform
# Technical Implementation Documentation

This document provides the complete mathematical specifications, algorithm pseudocode, data schemas, API contracts, and implementation details for the Aegis platform. It is intended for engineers and researchers who need to understand, extend, or validate the system internals.

---

## Table of Contents

1. [Machine Learning Engine — Full Specification](#1-machine-learning-engine--full-specification)
2. [Optimization Algorithms — Mathematical Formulations](#2-optimization-algorithms--mathematical-formulations)
3. [Sensor Simulation — Random Walk Model](#3-sensor-simulation--random-walk-model)
4. [Database Schema — Complete DDL](#4-database-schema--complete-ddl)
5. [Backend API — Full Contract Reference](#5-backend-api--full-contract-reference)
6. [WebSocket Protocol — Message Catalogue](#6-websocket-protocol--message-catalogue)
7. [Frontend Architecture — Component Hierarchy](#7-frontend-architecture--component-hierarchy)
8. [Security Implementation — JWT Flow](#8-security-implementation--jwt-flow)
9. [Application Startup Sequence](#9-application-startup-sequence)
10. [Configuration Reference](#10-configuration-reference)

---

## 1. Machine Learning Engine — Full Specification

### 1.1 Dataset Generation (`ml/dataset.py`)

The generator produces N = 5,000 samples. Each sample is a 7-dimensional continuous feature vector drawn from independent uniform distributions.

**Feature Distributions:**

```
x1 (rainfall)          ~ Uniform(0.0, 450.0)   [mm]
x2 (temperature)       ~ Uniform(-10.0, 48.0)  [degrees Celsius]
x3 (humidity)          ~ Uniform(10.0, 100.0)  [percent]
x4 (river_level)       ~ Uniform(0.5, 12.0)    [meters]
x5 (wind_speed)        ~ Uniform(0.0, 220.0)   [km/h]
x6 (seismic_activity)  ~ Uniform(0.0, 8.5)     [Richter scale]
x7 (land_slope)        ~ Uniform(0.0, 50.0)    [degrees]
```

**Class Labelling Function:**

The labelling function L(x) applies the following priority-ordered conditional rules:

```
L(x) = 2  if x6 >= 4.2                                          [Earthquake]
L(x) = 4  if x5 >= 110.0 AND x3 >= 65.0                        [Cyclone]
L(x) = 5  if x1 >= 180.0 AND x7 >= 28.0                        [Landslide]
L(x) = 1  if x1 >= 140.0 AND x4 >= 5.5                         [Flood]
L(x) = 3  if x2 >= 36.0  AND x3 <= 30.0 AND x5 >= 15.0        [Wildfire]
L(x) = 0  otherwise                                              [No Hazard]
```

Priority is enforced sequentially. The first matching condition determines the class, so Earthquake takes precedence over all other conditions.

**Expected Class Distribution (approximate):**

The seismic threshold x6 >= 4.2 catches roughly 50.6% of the uniform [0, 8.5] range for that variable independently, but joint distributions and ordering reduce actual proportions. Empirically the dataset produces classes in roughly proportional frequencies, with No Hazard and Earthquake being the most common.

### 1.2 Model Training (`ml/model.py`)

**Train-Test Split:**

```
train_size = 0.80 * N = 4,000 samples
test_size  = 0.20 * N = 1,000 samples
Split strategy: random stratified (random_state=42)
```

**Random Forest Classifier:**

```
n_estimators = 100
max_depth    = 12
criterion    = "gini"
random_state = 42
bootstrap    = True (default)
```

Each tree is trained on a bootstrap sample of the training set. At each split, sqrt(n_features) = sqrt(7) ≈ 2 features are considered. The final class is determined by majority vote across all 100 trees.

**Logistic Regression:**

```
penalty      = "l2"
solver       = "lbfgs"
max_iter     = 1,000
random_state = 42
multi_class  = "auto" (defaults to multinomial for multi-class)
```

**Validation Metrics:**

Both models are evaluated using simple accuracy on the held-out test set:

```
accuracy = (number of correct predictions) / (total test samples)
```

Typical achieved values:
- Random Forest: 0.97 - 0.99
- Logistic Regression: 0.82 - 0.86

The difference reflects the non-linear, piece-wise constant decision boundaries required to separate the labelling function's threshold-based classes. Logistic regression with linear decision boundaries cannot represent these boundaries exactly.

### 1.3 Inference Pipeline

Given an input feature vector x_input (7-dimensional):

**Step 1: Feature formatting**
```python
features = [[
    sensor_data['rainfall'],
    sensor_data['temperature'],
    sensor_data['humidity'],
    sensor_data['river_level'],
    sensor_data['wind_speed'],
    sensor_data['seismic_activity'],
    sensor_data['land_slope']
]]
```

**Step 2: Probability prediction**
```python
probabilities = rf_model.predict_proba(features)[0]
# Returns array of shape (6,) summing to 1.0
```

**Step 3: Class selection**
```python
predicted_class_index = argmax(probabilities)
predicted_class_name  = class_map[predicted_class_index]
confidence            = probabilities[predicted_class_index]
```

**Step 4: Risk score computation**
```
if predicted_class == "No Hazard":
    risk_score = (1.0 - probabilities[0]) * 100.0
    risk_score = max(5.0, risk_score)
else:
    risk_score = confidence * 100.0
```

**Step 5: Response construction**
```json
{
  "prediction": "string",
  "confidence": "float in [0.0, 1.0]",
  "risk_score": "float in [5.0, 100.0]",
  "probabilities": {
    "No Hazard": "float",
    "Flood": "float",
    "Earthquake": "float",
    "Wildfire": "float",
    "Cyclone": "float",
    "Landslide": "float"
  },
  "model_stats": {
    "algorithm": "Random Forest Classifier",
    "accuracy": "float",
    "alternative_algorithm": "Logistic Regression",
    "alternative_accuracy": "float"
  }
}
```

---

## 2. Optimization Algorithms — Mathematical Formulations

### 2.1 Problem Definition

**Decision variables:**

Let A be a matrix of shape (Z, R) where Z = 5 zones and R = 4 resource types.

```
A[z][r] = quantity of resource r allocated to zone z

Resources:
  r=0: ambulances        (integer, 0 <= sum <= 25)
  r=1: rescue_teams      (integer, 0 <= sum <= 18)
  r=2: medical_supplies  (float,   0 <= sum <= 150.0)
  r=3: shelters          (integer, 0 <= sum <= 60)

Zones:
  z=0: zone_alpha   (Waikiki Beach)
  z=1: zone_beta    (Nuuanu Valley)
  z=2: zone_gamma   (Pearl Harbor)
  z=3: zone_delta   (Kaneohe Bay)
  z=4: zone_epsilon (Diamond Head)
```

**Demand function:**

Zone demand D[z][r] is a function of the zone's severity weight S[z]:

```
D[z][ambulances]       = round(S[z] / 100 * 8)
D[z][rescue_teams]     = round(S[z] / 100 * 6)
D[z][medical_supplies] = S[z] / 100 * 40.0
D[z][shelters]         = round(S[z] / 100 * 15)
```

**Distance function:**

The Honolulu Hub is located at coordinates (21.3069, -157.8583).

```
d[z] = sqrt((hub_lat - zone_lat)^2 + (hub_lon - zone_lon)^2)
```

Note: This uses Euclidean distance in degree-space as a proxy. For production use, the Haversine formula should be applied.

### 2.2 Objective (Cost) Function

```
F(A) = F_mismatch(A) + F_transit(A) + F_penalty(A)
```

**Mismatch term:**

```
F_mismatch = sum over z in Z, r in R of:
             (S[z] / 10.0) * (max(0, D[z][r] - A[z][r]))^2 * 5.0
```

This penalises under-allocation quadratically, scaled by zone severity. Over-allocation is not penalised because surplus resources do not cause harm.

**Transit cost term:**

```
F_transit = sum over z in Z, r in R of:
            A[z][r] * d[z] * 0.1
```

This applies a linear distance-proportional cost to all allocations, incentivising the algorithm to prefer closer zones when demand is equal across zones.

**Constraint violation penalty:**

```
For each resource r:
    excess = max(0, sum over z of A[z][r] - capacity_limit[r])
    F_penalty += excess^2 * 200.0

For each zone z, resource r:
    if A[z][r] < 0:
        F_penalty += 5000.0
```

The 200x quadratic multiplier on capacity violations creates a steep cliff in the fitness landscape that strongly discourages infeasible solutions. The 5000 unit fixed penalty for negative allocations makes those regions of the search space effectively unreachable.

### 2.3 Quantum-Inspired Genetic Algorithm

**Chromosome representation:**

A chromosome C is a real-valued matrix of shape (Z, R):

```
C[z][r] = theta, where theta in [0, pi/2]

The probability amplitude for zone z receiving resource r is:
alpha[z][r] = sin(theta[z][r])
beta[z][r]  = cos(theta[z][r])

The probability of the |1> state (allocating) is:
P(1) = sin^2(theta[z][r])
```

**Measurement (collapse) operator:**

To convert a quantum chromosome to a concrete allocation:

```
For each resource r:
    raw_probs[z] = sin^2(C[z][r]) for all z
    norm_probs[z] = raw_probs[z] / sum(raw_probs)   [softmax-like normalisation]
    A[z][r] = norm_probs[z] * capacity_limit[r]

For integer resources: A[z][r] = round(A[z][r])
For float resources:   A[z][r] = A[z][r] (no rounding)
```

After rounding, a re-normalisation step clips each allocation to valid bounds and adjusts one zone to absorb any rounding surplus or deficit.

**Quantum Rotation Gate update:**

After evaluating all chromosomes in the population, the best (lowest cost) individual is identified as the global best G.

For each chromosome C in the population where fitness(C) > fitness(G):
```
For each (z, r):
    delta = learning_rate * rotation_step   [default: 0.05 radians]

    if collapse(C)[z][r] < collapse(G)[z][r]:
        C[z][r] += delta    [rotate toward higher probability]
    elif collapse(C)[z][r] > collapse(G)[z][r]:
        C[z][r] -= delta    [rotate toward lower probability]

    C[z][r] = clip(C[z][r], 0, pi/2)   [enforce valid range]
```

**Algorithm parameters:**

```
population_size  = 30
max_generations  = 50
learning_rate    = 1.0
rotation_step    = 0.05
```

**Pseudocode:**

```
initialise population: C[i][z][r] ~ Uniform(0, pi/2) for all i, z, r

for generation in range(max_generations):
    for each chromosome i:
        allocation_i = collapse(C[i])
        fitness_i    = evaluate_cost(allocation_i)

    global_best = chromosome with minimum fitness
    global_best_allocation = collapse(global_best)

    for each chromosome i where fitness_i > fitness(global_best):
        apply quantum rotation gate toward global_best

    record best_fitness for this generation

return global_best_allocation, convergence_history
```

### 2.4 Particle Swarm Optimization

**State representation:**

Each particle i has:
- position X[i]: matrix (Z, R), continuous real values representing allocations
- velocity V[i]: matrix (Z, R), change in position per iteration
- personal best P_best[i]: best position visited by particle i
- global best G_best: best position visited by any particle

**Initialisation:**

```
X[i][z][r] ~ Uniform(0, capacity_limit[r])
V[i]       = zeros(Z, R)
P_best[i]  = X[i]
G_best     = X[argmin over i of evaluate_cost(X[i])]
```

**Update equations:**

```
At iteration t:

inertia_weight w(t) = w_max - (w_max - w_min) * t / max_iterations
                    = 0.9   - (0.9   - 0.4)   * t / 50

r1, r2 ~ Uniform(0, 1)^(Z, R)  [independent random matrices]

V[i](t+1) = w(t) * V[i](t)
           + c1 * r1 * (P_best[i] - X[i](t))
           + c2 * r2 * (G_best    - X[i](t))

X[i](t+1) = X[i](t) + V[i](t+1)
X[i](t+1) = clip(X[i](t+1), 0, capacity_limit[r])
```

**Parameters:**

```
swarm_size     = 30
max_iterations = 50
w_max          = 0.9
w_min          = 0.4
c1             = 1.5   [cognitive coefficient]
c2             = 1.5   [social coefficient]
```

**Update after each iteration:**

```
for each particle i:
    if evaluate_cost(X[i](t+1)) < evaluate_cost(P_best[i]):
        P_best[i] = X[i](t+1)

    if evaluate_cost(P_best[i]) < evaluate_cost(G_best):
        G_best = P_best[i]
```

### 2.5 Simulated Annealing

**State representation:**

A single allocation matrix S of shape (Z, R) representing the current solution.

**Initialisation:**

```
S[z][r] = capacity_limit[r] / Z   [uniform distribution as starting point]
```

**Neighbour generation:**

```
Select two distinct zones z1, z2 at random
Select one resource r at random
Select transfer amount delta ~ Uniform(0, S[z1][r])

S_new = copy(S)
S_new[z1][r] -= delta
S_new[z2][r] += delta
S_new[z2][r]  = clip(S_new[z2][r], 0, capacity_limit[r])
```

**Acceptance criterion (Metropolis):**

```
E_current = evaluate_cost(S)
E_new     = evaluate_cost(S_new)

delta_E = E_new - E_current

if delta_E < 0:
    accept (S = S_new unconditionally)
else:
    P_accept = exp(-delta_E / T)
    accept with probability P_accept
```

**Cooling schedule:**

```
T(t+1) = T(t) * alpha

where alpha = 0.94 (geometric cooling)
```

**Parameters:**

```
initial_temperature = 1000.0
cooling_rate        = 0.94
max_iterations      = 500
```

---

## 3. Sensor Simulation — Random Walk Model

### 3.1 State Variables and Bounds

```
Variable          | Min     | Max      | Initial | Step Sigma
------------------|---------|----------|---------|------------
rainfall          | 0.0     | 450.0    | 25.0    | 4.0
temperature       | -5.0    | 48.0     | 24.0    | 0.3
humidity          | 10.0    | 100.0    | 55.0    | 1.5
river_level       | 0.2     | 12.0     | 1.8     | 0.05
wind_speed        | 0.0     | 220.0    | 12.0    | 1.5
seismic_activity  | 0.0     | 8.5      | 0.05    | 0.05
land_slope        | 0.0     | 50.0     | 25.0    | 0.2
```

### 3.2 Update Rule

Every update_interval seconds (default 1.5):

```
For each variable v:
    noise = Normal(0, sigma_v)
    state[v] = clip(state[v] + noise, min_v, max_v)
```

### 3.3 Hazard Anomaly Injection

When `trigger_hazard_anomaly(hazard_type)` is called, the simulator immediately sets variables to values that will cause the ML model to predict the specified hazard with high probability:

**Flood:**
```
rainfall    = 300.0
river_level = 8.0
humidity    = 92.0
```

**Earthquake:**
```
seismic_activity = 5.5
```

**Wildfire:**
```
temperature = 42.0
humidity    = 18.0
wind_speed  = 30.0
```

**Cyclone:**
```
wind_speed = 150.0
humidity   = 80.0
rainfall   = 100.0
```

**Landslide:**
```
rainfall    = 250.0
land_slope  = 35.0
river_level = 6.0
```

After injection, the random walk continues from these elevated values, meaning the anomaly decays naturally over subsequent update cycles unless re-triggered.

---

## 4. Database Schema — Complete DDL

```sql
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp         TEXT NOT NULL,
    rainfall          REAL,
    temperature       REAL,
    humidity          REAL,
    river_level       REAL,
    wind_speed        REAL,
    seismic_activity  REAL
);

CREATE TABLE IF NOT EXISTS alert_logs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp    TEXT NOT NULL,
    hazard_type  TEXT NOT NULL,
    severity     TEXT NOT NULL,
    message      TEXT,
    resolved     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS allocation_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp  TEXT NOT NULL,
    algorithm  TEXT NOT NULL,
    fitness    REAL,
    details    TEXT
);
```

**Severity levels used in alert_logs.severity:**

| Probability Threshold | Severity Level |
|---|---|
| >= 0.88 | CRITICAL |
| >= 0.75 and < 0.88 | HIGH |
| Manual trigger, lower thresholds | MEDIUM or LOW |

---

## 5. Backend API — Full Contract Reference

### Base URL

```
http://localhost:8000
```

### 5.1 POST /api/auth/login

Authenticates a user and returns a JWT access token.

**Request headers:**
```
Content-Type: application/json
```

**Request body schema:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success response (200):**
```json
{
  "access_token": "string (JWT)",
  "token_type": "bearer",
  "user": {
    "username": "string",
    "name": "string",
    "role": "string"
  }
}
```

**Error response (401):**
```json
{
  "detail": "Incorrect username or password verification."
}
```

### 5.2 POST /api/predict-risk

Runs the ML prediction pipeline on a provided sensor vector.

**Request body schema:**
```json
{
  "rainfall":          "float",
  "temperature":       "float",
  "humidity":          "float",
  "river_level":       "float",
  "wind_speed":        "float",
  "seismic_activity":  "float",
  "land_slope":        "float"
}
```

**Success response (200):**
```json
{
  "prediction":  "string (class name)",
  "confidence":  "float [0.0, 1.0]",
  "risk_score":  "float [5.0, 100.0]",
  "probabilities": {
    "No Hazard":  "float",
    "Flood":      "float",
    "Earthquake": "float",
    "Wildfire":   "float",
    "Cyclone":    "float",
    "Landslide":  "float"
  },
  "model_stats": {
    "algorithm":              "string",
    "accuracy":               "float",
    "alternative_algorithm":  "string",
    "alternative_accuracy":   "float"
  }
}
```

### 5.3 POST /api/allocate-resources

Runs the selected optimization algorithm and returns resource dispatch plans.

**Request body schema:**
```json
{
  "algorithm":  "string ('genetic' | 'pso' | 'annealing')",
  "severities": {
    "zone_alpha":   "float [0.0, 100.0]",
    "zone_beta":    "float [0.0, 100.0]",
    "zone_gamma":   "float [0.0, 100.0]",
    "zone_delta":   "float [0.0, 100.0]",
    "zone_epsilon": "float [0.0, 100.0]"
  }
}
```

**Success response (200):**
```json
{
  "selected_results": {
    "algorithm": "string",
    "allocation": {
      "zone_alpha": {
        "ambulances":       "int",
        "rescue_teams":     "int",
        "medical_supplies": "float",
        "shelters":         "int"
      }
    },
    "cost_breakdown": {
      "total_cost":                    "float",
      "mismatch_penalty":              "float",
      "transit_cost":                  "float",
      "constraint_violation_penalty":  "float"
    },
    "fitness":              "float",
    "convergence_history":  "array of float"
  },
  "comparisons": [
    {
      "algorithm": "string",
      "fitness":   "float",
      "time_ms":   "float"
    }
  ],
  "limits": {
    "ambulances":       "int",
    "rescue_teams":     "int",
    "medical_supplies": "float",
    "shelters":         "int"
  },
  "zones": "array of zone definition objects"
}
```

**Error response (400):**
```json
{
  "detail": "Supported algorithms are 'genetic', 'pso', or 'annealing'."
}
```

### 5.4 POST /api/alerts/trigger-anomaly

Injects a hazard anomaly into the sensor simulator.

**Request body schema:**
```json
{
  "hazard_type": "string ('flood' | 'earthquake' | 'wildfire' | 'cyclone' | 'landslide')"
}
```

**Success response (200):**
```json
{
  "status": "success",
  "message": "string"
}
```

### 5.5 GET /api/alerts

Returns all active (unresolved) alerts.

**Response (200):**
```json
[
  {
    "id":          "int",
    "timestamp":   "string (ISO-8601)",
    "hazard_type": "string",
    "severity":    "string",
    "message":     "string",
    "resolved":    "int (0 or 1)"
  }
]
```

### 5.6 POST /api/alerts/resolve

Marks an alert as resolved.

**Request body schema:**
```json
{
  "alert_id": "int"
}
```

**Success response (200):**
```json
{
  "status":  "success",
  "message": "string"
}
```

### 5.7 GET /api/historical-analysis

Returns historical telemetry data and model performance metrics.

**Response (200):**
```json
{
  "telemetry_history": [
    {
      "id":                "int",
      "timestamp":         "string",
      "rainfall":          "float",
      "temperature":       "float",
      "humidity":          "float",
      "river_level":       "float",
      "wind_speed":        "float",
      "seismic_activity":  "float"
    }
  ],
  "allocation_runs": [
    {
      "id":        "int",
      "timestamp": "string",
      "algorithm": "string",
      "fitness":   "float",
      "details":   "string (JSON blob)"
    }
  ],
  "model_performance": {
    "random_forest_accuracy":       "float",
    "logistic_regression_accuracy": "float"
  }
}
```

---

## 6. WebSocket Protocol — Message Catalogue

### Endpoint

```
WS ws://localhost:8000/api/sensor-stream
```

### Client Connection

No handshake payload is required. The server begins broadcasting immediately upon WebSocket upgrade acceptance.

### Message Type: TELEMETRY_UPDATE

Sent every 1.5 seconds.

```json
{
  "type": "TELEMETRY_UPDATE",
  "timestamp": "string (ISO-8601 UTC)",
  "telemetry": {
    "rainfall":          "float",
    "temperature":       "float",
    "humidity":          "float",
    "river_level":       "float",
    "wind_speed":        "float",
    "seismic_activity":  "float",
    "land_slope":        "float"
  },
  "risk_assessment": {
    "prediction":   "string",
    "confidence":   "float",
    "risk_score":   "float",
    "probabilities": {
      "No Hazard":  "float",
      "Flood":      "float",
      "Earthquake": "float",
      "Wildfire":   "float",
      "Cyclone":    "float",
      "Landslide":  "float"
    },
    "model_stats": {
      "algorithm":             "string",
      "accuracy":              "float",
      "alternative_algorithm": "string",
      "alternative_accuracy":  "float"
    }
  },
  "active_alerts": [
    {
      "id":          "int",
      "timestamp":   "string",
      "hazard_type": "string",
      "severity":    "string",
      "message":     "string",
      "resolved":    "int"
    }
  ]
}
```

### Message Type: ALERT_TRIGGERED

Sent immediately when the background alert loop detects a probability threshold crossing.

```json
{
  "type": "ALERT_TRIGGERED",
  "data": {
    "id":          "int",
    "timestamp":   "string",
    "hazard_type": "string",
    "severity":    "string",
    "message":     "string",
    "resolved":    "int"
  }
}
```

---

## 7. Frontend Architecture — Component Hierarchy

```
layout.tsx (Root)
└── page.tsx (Authentication + Navigation Shell)
    ├── Login Form (conditional render pre-auth)
    └── Main Dashboard (conditional render post-auth)
        ├── Sidebar Navigation
        │   ├── ADIOP Logo and branding
        │   ├── Navigation items (Overview, Prediction, Optimizer, Analytics)
        │   ├── Connection status indicator
        │   └── Active alert badge counter
        └── View Container
            ├── OverviewView.tsx
            │   ├── Risk Score Gauge
            │   ├── Prediction Badge (current class + confidence)
            │   ├── Telemetry Gauge Grid (7 gauges)
            │   ├── Active Alerts Panel
            │   └── Anomaly Trigger Buttons (5 hazard types)
            │
            ├── PredictionView.tsx
            │   ├── Live Probability Bar Chart (Recharts)
            │   ├── Current Assessment Summary Cards
            │   └── Manual Scenario Sandbox
            │       ├── Parameter Sliders (7 inputs)
            │       └── Submit to API Button
            │
            ├── OptimizerView.tsx
            │   ├── Algorithm Selector (3 radio options)
            │   ├── Zone Severity Sliders (5 inputs)
            │   ├── Dispatch Button
            │   ├── Allocation Results Grid (5 zones x 4 resources)
            │   └── Algorithm Comparison Bar Chart (Recharts)
            │
            └── AnalyticsView.tsx
                ├── Telemetry History Line Charts (Recharts)
                ├── Model Accuracy Comparison Display
                └── Allocation Audit History Table

CommandMap.tsx (dynamic import wrapper)
└── MapComponent.tsx
    ├── MapContainer (react-leaflet)
    ├── TileLayer (OpenStreetMap)
    └── Circle overlays per zone
        └── Popup with zone name and severity
```

### Zustand Store Structure (`src/store/useStore.ts`)

```typescript
interface AppState {
  // Authentication
  token: string | null
  user: { username: string; name: string; role: string } | null
  isAuthenticated: boolean

  // WebSocket
  wsConnected: boolean
  websocket: WebSocket | null

  // Live telemetry
  telemetry: TelemetryData | null
  riskAssessment: RiskAssessment | null
  activeAlerts: Alert[]

  // Actions
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
}
```

---

## 8. Security Implementation — JWT Flow

### Token Generation (`backend/app/security.py`)

```
Algorithm:    HS256
Secret key:   settings.SECRET_KEY (defined in config.py)
Expiry:       settings.ACCESS_TOKEN_EXPIRE_MINUTES (default: 60 minutes)

Payload structure:
{
  "sub":  "username string",
  "role": "role string",
  "name": "display name string",
  "exp":  "Unix timestamp (UTC, now + expiry_minutes)"
}
```

### Token Validation

The `get_current_user` dependency is used on protected routes. It extracts the Bearer token from the `Authorization` header and decodes it using `jwt.decode` from PyJWT.

If the token is expired, malformed, or the signature does not match the server's secret key, an HTTP 401 response is returned.

### Password Verification

The current implementation compares the submitted password string directly against the value stored in `settings.DEMO_USERS`. This is a plaintext comparison and is only appropriate for demonstration systems. Any production deployment must:

1. Store passwords as bcrypt or Argon2 hashes
2. Use `bcrypt.checkpw(submitted_password.encode(), stored_hash)` or equivalent
3. Implement account lockout after repeated failed attempts
4. Use a persistent database table for user accounts, not a hardcoded dictionary

---

## 9. Application Startup Sequence

On `uvicorn` startup, the FastAPI `startup` lifecycle event executes the following steps in order:

**Step 1: Database Initialisation**
```python
init_db()
```
Creates the `database/` directory if it does not exist. Connects to `database/sqlite.db` and executes `CREATE TABLE IF NOT EXISTS` DDL for all three tables.

**Step 2: ML Model Training**
```python
predictor_instance.train_models()
```
Calls `generate_disaster_dataset(5000)` to produce training data. Trains both classifiers. Logs accuracy metrics to stdout. Sets `predictor_instance.is_trained = True`.

**Step 3: Sensor Simulator Start**
```python
sensor_simulator.start()
```
Starts the background daemon thread that updates the sensor state every 1.5 seconds.

**Step 4: Alert Background Loop**
```python
asyncio.create_task(database_and_alert_loop())
```
Schedules the asynchronous coroutine that runs every 2.5 seconds to log telemetry and evaluate alert thresholds.

**Step 5: Server Ready**
The ASGI server begins accepting HTTP and WebSocket connections.

---

## 10. Configuration Reference

All application configuration is defined in `backend/app/config.py` as a `Settings` object.

| Parameter | Default Value | Description |
|---|---|---|
| `PROJECT_NAME` | "Aegis DIOP" | FastAPI app title |
| `SECRET_KEY` | "aegis-secret-key-2026" | JWT signing secret |
| `ALGORITHM` | "HS256" | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 60 | JWT expiry window |
| `DEMO_USERS` | dict | Hardcoded user registry |
| `DATABASE_URL` | "database/sqlite.db" | SQLite file path |

**Demo Users Dictionary:**

```python
DEMO_USERS = {
    "admin": {
        "password_hash": "admin123",
        "name": "Director Sarah Jenkins",
        "role": "Command Officer"
    },
    "analyst": {
        "password_hash": "analyst123",
        "name": "Field Analyst Marcus Reid",
        "role": "Field Analyst"
    }
}
```

**Frontend environment:**

The Next.js frontend currently hardcodes the API base URL as `http://localhost:8000` within the Zustand store and component fetch calls. For production deployment, this should be moved to a `NEXT_PUBLIC_API_URL` environment variable in a `.env.local` file.
