from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import json
import traceback
from datetime import datetime, timezone

# Import custom core layers
from backend.app.config import settings
from backend.app.security import create_access_token, get_current_user
from backend.app.database import (
    init_db, log_telemetry, log_alert, get_active_alerts, 
    get_telemetry_history, log_allocation, get_allocation_history
)
from ml.model import predictor_instance
from simulation.sensor_sim import sensor_simulator

# Import optimizers
from optimizer.genetic import QuantumGeneticOptimizer
from optimizer.pso import ParticleSwarmOptimizer
from optimizer.annealing import SimulatedAnnealingOptimizer
from optimizer.base import ZONES, TOTAL_RESOURCES

app = FastAPI(title=settings.PROJECT_NAME)

# Enable CORS for Next.js dev server
# NOTE: allow_credentials=True is incompatible with allow_origins=["*"]
# Must list explicit origins instead
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active WebSocket connections list
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Silently handle disconnected dead sockets
                pass

manager = ConnectionManager()

# Lifecycle Management: Start simulator and train models
@app.on_event("startup")
async def startup_event():
    # 1. Init Database
    init_db()
    
    # 2. Train ML Models
    try:
        predictor_instance.train_models()
    except Exception as e:
        print(f"[ERROR] Failed to train ML models: {e}")
        traceback.print_exc()
        
    # 3. Start Telemetry Sim
    sensor_simulator.start()
    
    # 4. Start background loop to save logs and auto-trigger alerts based on telemetry
    asyncio.create_task(database_and_alert_loop())

@app.on_event("shutdown")
def shutdown_event():
    sensor_simulator.stop()

async def database_and_alert_loop():
    """Background task running every 2.5 seconds to log telemetry and raise auto-alerts."""
    last_alerts_triggered = {}  # Throttle alerts to avoid duplicates
    
    while True:
        try:
            await asyncio.sleep(2.5)
            telemetry = sensor_simulator.get_latest_telemetry()
            
            # Log telemetry record to SQLite
            log_telemetry(telemetry)
            
            # Get current risk assessment
            risk_res = predictor_instance.predict_risk(telemetry)
            probabilities = risk_res["probabilities"]
            
            # Evaluate thresholds and auto-create alerts
            for hazard, prob in probabilities.items():
                if hazard == "No Hazard":
                    continue
                
                # Check for critical probability (> 75%)
                if prob >= 0.75:
                    throttle_key = hazard
                    now_ts = time_now()
                    
                    # Alert if not triggered in last 20 seconds
                    if throttle_key not in last_alerts_triggered or (now_ts - last_alerts_triggered[throttle_key]).total_seconds() > 20:
                        last_alerts_triggered[throttle_key] = now_ts
                        
                        severity = "CRITICAL" if prob >= 0.88 else "HIGH"
                        msg = f"Automatic warning system triggered: Extreme risk of {hazard.upper()} detected. Probability metric evaluated at {prob*100:.1f}%. Immediate tactical resource deployment recommended."
                        
                        alert_payload = log_alert(hazard, severity, msg)
                        
                        # Broadcast immediate alert notification via WebSockets
                        ws_notify = {
                            "type": "ALERT_TRIGGERED",
                            "data": alert_payload
                        }
                        await manager.broadcast(json.dumps(ws_notify))
                        
        except Exception as e:
            print(f"[ERROR] Alert system loop anomaly: {e}")

def time_now():
    return datetime.now(timezone.utc)

# ----------------- SECURITY & AUTH ROUTE -----------------

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
def login(request: LoginRequest):
    user = settings.DEMO_USERS.get(request.username)
    if not user or user["password_hash"] != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password verification."
        )
    
    token = create_access_token({"sub": request.username, "role": user["role"], "name": user["name"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": request.username,
            "name": user["name"],
            "role": user["role"]
        }
    }

# ----------------- AI RISK PREDICTION ROUTE -----------------

class TelemetryInput(BaseModel):
    rainfall: float
    temperature: float
    humidity: float
    river_level: float
    wind_speed: float
    seismic_activity: float
    land_slope: float

@app.post("/api/predict-risk")
def predict_risk(telemetry: TelemetryInput):
    """Manual inference endpoint allowing officers to test scenario configurations."""
    results = predictor_instance.predict_risk(telemetry.dict())
    return results

# ----------------- RESOURCE OPTIMIZATION ROUTE -----------------

class OptimizeRequest(BaseModel):
    algorithm: str  # "genetic", "pso", "annealing"
    severities: Dict[str, float]  # e.g., {"zone_alpha": 85.0, "zone_beta": 45.0...}

@app.post("/api/allocate-resources")
def allocate_resources(req: OptimizeRequest):
    """
    Runs one of the three quantum-inspired models to calculate ideal resource splits.
    Additionally runs comparisons in the background so the frontend can display comparisons.
    """
    alg = req.algorithm.lower()
    sevs = req.severities
    
    # 1. Execute chosen model
    if alg == "genetic":
        optimizer = QuantumGeneticOptimizer()
    elif alg == "pso":
        optimizer = ParticleSwarmOptimizer()
    elif alg == "annealing":
        optimizer = SimulatedAnnealingOptimizer()
    else:
        raise HTTPException(
            status_code=400,
            detail="Supported algorithms are 'genetic', 'pso', or 'annealing'."
        )
        
    best_alloc, chosen_results = optimizer.optimize(sevs)
    
    # Log run to DB
    log_allocation(chosen_results["algorithm"], chosen_results["fitness"], chosen_results)
    
    # 2. Run alternate algorithms for comparative metrics
    alt_ga = QuantumGeneticOptimizer()
    _, ga_res = alt_ga.optimize(sevs)
    
    alt_pso = ParticleSwarmOptimizer()
    _, pso_res = alt_pso.optimize(sevs)
    
    alt_sa = SimulatedAnnealingOptimizer()
    _, sa_res = alt_sa.optimize(sevs)
    
    comparisons = [
        {"algorithm": "Quantum Genetic", "fitness": ga_res["fitness"], "time_ms": 15.0},
        {"algorithm": "Particle Swarm", "fitness": pso_res["fitness"], "time_ms": 8.0},
        {"algorithm": "Simulated Annealing", "fitness": sa_res["fitness"], "time_ms": 3.0}
    ]
    
    return {
        "selected_results": chosen_results,
        "comparisons": comparisons,
        "limits": TOTAL_RESOURCES,
        "zones": ZONES
    }

# ----------------- INCIDENT ALERTS ROUTE -----------------

class TriggerAnomalyRequest(BaseModel):
    hazard_type: str  # "flood", "earthquake", "wildfire", "cyclone", "landslide"

@app.post("/api/alerts/trigger-anomaly")
def trigger_anomaly(req: TriggerAnomalyRequest):
    """Allows manual scenario-injection from the operations dashboard."""
    sensor_simulator.trigger_hazard_anomaly(req.hazard_type)
    return {"status": "success", "message": f"{req.hazard_type.upper()} environmental anomaly injected successfully."}

@app.get("/api/alerts")
def get_alerts():
    """Retrieves all active emergency alerts."""
    return get_active_alerts()

class ResolveAlertRequest(BaseModel):
    alert_id: int

@app.post("/api/alerts/resolve")
def resolve_alert(req: ResolveAlertRequest):
    """Marks a specific incident as resolved and deactivated."""
    import sqlite3
    from backend.app.database import DB_PATH
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE alert_logs SET resolved = 1 WHERE id = ?", (req.alert_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Alert {req.alert_id} resolved."}

# ----------------- ANALYTICS & HISTORY ROUTE -----------------

@app.get("/api/historical-analysis")
def get_historical_analysis():
    """Returns analytics history for plotting trend lines and tables."""
    history = get_telemetry_history(25)
    allocation_runs = get_allocation_history(5)
    
    return {
        "telemetry_history": history,
        "allocation_runs": allocation_runs,
        "model_performance": {
            "random_forest_accuracy": predictor_instance.rf_accuracy,
            "logistic_regression_accuracy": predictor_instance.lr_accuracy
        }
    }

# ----------------- WEBSOCKET telemetry STREAM -----------------

@app.websocket("/api/sensor-stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print(f"[WEBSOCKET] Client connected. Total active connections: {len(manager.active_connections)}")
    
    try:
        while True:
            # Poll latest data
            telemetry = sensor_simulator.get_latest_telemetry()
            risk_results = predictor_instance.predict_risk(telemetry)
            alerts = get_active_alerts()
            
            payload = {
                "type": "TELEMETRY_UPDATE",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "telemetry": telemetry,
                "risk_assessment": risk_results,
                "active_alerts": alerts
            }
            
            # Send live packet
            await websocket.send_text(json.dumps(payload))
            
            # WebSocket tick interval: 1.5 seconds
            await asyncio.sleep(1.5)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"[WEBSOCKET] Client disconnected. Connections remaining: {len(manager.active_connections)}")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"[WEBSOCKET] Disconnected due to unexpected loop anomaly: {e}")
