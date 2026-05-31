import sqlite3
import os
import json
from datetime import datetime, timezone

# Database stored relative to project root (works on any machine)
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database")
DB_PATH = os.path.join(DB_DIR, "sqlite.db")

def init_db():
    """Initializes the database tables on startup."""
    os.makedirs(DB_DIR, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Telemetry Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        rainfall REAL,
        temperature REAL,
        humidity REAL,
        river_level REAL,
        wind_speed REAL,
        seismic_activity REAL
    )
    """)
    
    # 2. Alert Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alert_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        hazard_type TEXT NOT NULL,
        severity TEXT NOT NULL, -- "LOW", "MEDIUM", "HIGH", "CRITICAL"
        message TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
    )
    """)
    
    # 3. Allocation Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS allocation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        fitness REAL,
        details TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()
    print(f"[DATABASE] SQLite database initialized successfully at: {DB_PATH}")

def log_telemetry(data: dict):
    """Saves a snapshot of sensor variables."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO telemetry_logs (timestamp, rainfall, temperature, humidity, river_level, wind_speed, seismic_activity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        data.get("rainfall"),
        data.get("temperature"),
        data.get("humidity"),
        data.get("river_level"),
        data.get("wind_speed"),
        data.get("seismic_activity")
    ))
    conn.commit()
    conn.close()

def log_alert(hazard_type: str, severity: str, message: str) -> dict:
    """Logs a new emergency alert."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO alert_logs (timestamp, hazard_type, severity, message, resolved)
    VALUES (?, ?, ?, ?, 0)
    """, (timestamp, hazard_type, severity, message))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "id": alert_id,
        "timestamp": timestamp,
        "hazard_type": hazard_type,
        "severity": severity,
        "message": message,
        "resolved": 0
    }

def get_active_alerts() -> list:
    """Retrieves all unresolved alerts."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM alert_logs WHERE resolved = 0 ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def get_telemetry_history(limit: int = 50) -> list:
    """Gets recent telemetry logs for charts."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM telemetry_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    # Return chronologically
    return list(reversed([dict(row) for row in rows]))

def log_allocation(algorithm: str, fitness: float, details: dict):
    """Logs resource allocation runs."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO allocation_logs (timestamp, algorithm, fitness, details)
    VALUES (?, ?, ?, ?)
    """, (
        datetime.now(timezone.utc).isoformat(),
        algorithm,
        fitness,
        json.dumps(details)
    ))
    conn.commit()
    conn.close()

def get_allocation_history(limit: int = 10) -> list:
    """Retrieves allocation history logs."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM allocation_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        d["details"] = json.loads(d["details"])
        results.append(d)
    return results
