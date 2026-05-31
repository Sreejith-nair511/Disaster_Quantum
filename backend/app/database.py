import sqlite3
import os
import json
from datetime import datetime, timezone

# Database stored relative to project root (works on any machine)
DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "database")
DB_PATH = os.path.join(DB_DIR, "sqlite.db")

def init_db():
    """Initializes the database tables on startup and seeds demo data."""
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
        severity TEXT NOT NULL,
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

    # Seed realistic India demo alerts if the table is empty
    cursor.execute("SELECT COUNT(*) FROM alert_logs WHERE resolved = 0")
    active_count = cursor.fetchone()[0]

    if active_count == 0:
        seed_demo_alerts(cursor)
        conn.commit()
        print("[DATABASE] Demo India incident data seeded successfully.")

    conn.close()
    print(f"[DATABASE] SQLite database initialized at: {DB_PATH}")


def seed_demo_alerts(cursor):
    """Seeds realistic India disaster incidents for demo purposes."""
    from datetime import timedelta
    now = datetime.now(timezone.utc)

    demo_incidents = [
        (
            (now - timedelta(minutes=47)).isoformat(),
            "Flood", "CRITICAL",
            "NDRF ALERT — Brahmaputra river level at 11.2m, exceeding danger mark of 9.5m at Guwahati gauge station. "
            "Flood waters breaching embankments in Morigaon and Nagaon districts, Assam. "
            "Probability metric: 91.4%. Immediate evacuation of 3 riverside villages recommended. "
            "NDRF Battalion 12 deployment authorized.",
            0
        ),
        (
            (now - timedelta(minutes=31)).isoformat(),
            "Cyclone", "CRITICAL",
            "IMD CYCLONE WARNING — Deep depression in Bay of Bengal intensifying to Severe Cyclonic Storm. "
            "Predicted landfall near Puri, Odisha within 18 hours. Wind speeds 145–165 km/h. "
            "Storm surge of 3–4m expected along Odisha-Andhra coast. "
            "Probability metric: 88.7%. Coastal evacuation of Zone Epsilon sectors initiated.",
            0
        ),
        (
            (now - timedelta(minutes=19)).isoformat(),
            "Landslide", "HIGH",
            "GSI LANDSLIDE ALERT — Continuous rainfall (312mm in 24hrs) triggering debris flows on NH-58 "
            "near Chamoli, Uttarakhand. Multiple slope failures reported between Joshimath and Badrinath. "
            "Road connectivity severed. Probability metric: 79.2%. "
            "SDRF teams deployed. Pilgrims stranded at 3 locations.",
            0
        ),
        (
            (now - timedelta(minutes=12)).isoformat(),
            "Earthquake", "HIGH",
            "NCS SEISMIC ALERT — Magnitude 5.1 earthquake recorded at 28.4°N 79.2°E, depth 15km, "
            "Pithoragarh district, Uttarakhand (Himalayan Seismic Zone V). "
            "Aftershock sequence ongoing. Structural damage reported in 4 villages. "
            "Probability metric: 76.8%. NDRF search & rescue teams on standby.",
            0
        ),
        (
            (now - timedelta(minutes=6)).isoformat(),
            "Heatwave", "HIGH",
            "IMD HEATWAVE WARNING — Severe heatwave conditions persisting over Rajasthan and Madhya Pradesh. "
            "Maximum temperature 47.3°C recorded at Churu, Rajasthan — 6.8°C above normal. "
            "Heat index exceeding 52°C in Barmer and Jaisalmer districts. "
            "Probability metric: 82.1%. Health advisory issued. Cooling centres activated in 12 districts.",
            0
        ),
        (
            (now - timedelta(minutes=2)).isoformat(),
            "Cloudburst", "CRITICAL",
            "AUTOMATIC WARNING — Extreme cloudburst event detected over Himachal Pradesh. "
            "Rainfall intensity: 187mm/hour at Dharamshala AWS station — highest in 15 years. "
            "Flash flood risk in Beas and Ravi river catchments. "
            "Probability metric: 93.6%. NDRF pre-positioning at Mandi and Kullu districts.",
            0
        ),
    ]

    cursor.executemany("""
    INSERT INTO alert_logs (timestamp, hazard_type, severity, message, resolved)
    VALUES (?, ?, ?, ?, ?)
    """, demo_incidents)

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
