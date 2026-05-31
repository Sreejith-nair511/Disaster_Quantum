import numpy as np
import threading
import time
from typing import Dict

class SensorStreamSimulator:
    def __init__(self):
        # Initial nominal values
        self.state = {
            "rainfall": 25.0,            # mm
            "temperature": 24.5,         # °C
            "humidity": 55.0,            # %
            "river_level": 1.8,          # meters
            "wind_speed": 12.0,          # km/h
            "seismic_activity": 0.05,     # Richter
            "land_slope": 25.0           # degrees (fixed base terrain feature)
        }
        
        self.lock = threading.Lock()
        self.is_running = False
        self.thread = None
        
        # Track active event duration (resets to nominal after a few seconds)
        self.hazard_countdown = 0
        self.active_hazard = None

    def start(self):
        with self.lock:
            if not self.is_running:
                self.is_running = True
                self.thread = threading.Thread(target=self._run, daemon=True)
                self.thread.start()
                print("[SIMULATOR] Sensor stream generator started.")

    def stop(self):
        with self.lock:
            self.is_running = False
            print("[SIMULATOR] Sensor stream generator stopped.")

    def trigger_hazard_anomaly(self, hazard_type: str):
        """Forces immediate environmental spikes to trigger specific alerts."""
        with self.lock:
            self.active_hazard = hazard_type.lower()
            self.hazard_countdown = 8  # Hazard lasts for 8 updates, then decays
            
            if self.active_hazard == "flood":
                self.state["rainfall"] = 280.0
                self.state["river_level"] = 8.5
                self.state["humidity"] = 95.0
            elif self.active_hazard == "earthquake":
                self.state["seismic_activity"] = 7.1
                self.state["river_level"] = 2.4
            elif self.active_hazard == "wildfire":
                self.state["temperature"] = 43.5
                self.state["humidity"] = 11.0
                self.state["wind_speed"] = 42.0
            elif self.active_hazard == "cyclone":
                self.state["wind_speed"] = 175.0
                self.state["humidity"] = 92.0
                self.state["rainfall"] = 180.0
            elif self.active_hazard == "landslide":
                self.state["rainfall"] = 310.0
                self.state["land_slope"] = 38.0  # simulate structural soil shifts
                
            print(f"[SIMULATOR] Action Triggered: {hazard_type.upper()} anomaly injected.")

    def get_latest_telemetry(self) -> Dict[str, float]:
        with self.lock:
            return self.state.copy()

    def _run(self):
        while self.is_running:
            with self.lock:
                # If a hazard is active, handle decay
                if self.hazard_countdown > 0:
                    self.hazard_countdown -= 1
                    # Keep values high but add minor jitter
                    if self.active_hazard == "flood":
                        self.state["rainfall"] += np.random.uniform(-5.0, 5.0)
                        self.state["river_level"] += np.random.uniform(-0.1, 0.1)
                    elif self.active_hazard == "earthquake":
                        self.state["seismic_activity"] = max(0.5, self.state["seismic_activity"] + np.random.uniform(-0.5, 0.2))
                    elif self.active_hazard == "wildfire":
                        self.state["temperature"] += np.random.uniform(-1.0, 1.0)
                        self.state["humidity"] = np.clip(self.state["humidity"] + np.random.uniform(-0.5, 0.5), 8.0, 15.0)
                    elif self.active_hazard == "cyclone":
                        self.state["wind_speed"] += np.random.uniform(-8.0, 8.0)
                        self.state["rainfall"] += np.random.uniform(-5.0, 5.0)
                    elif self.active_hazard == "landslide":
                        self.state["rainfall"] += np.random.uniform(-5.0, 5.0)
                    
                    if self.hazard_countdown == 0:
                        print("[SIMULATOR] Hazard simulation complete. Decaying to nominal values...")
                        self.active_hazard = None
                else:
                    # Random walk for standard atmospheric telemetry
                    self.state["rainfall"] = max(0.0, self.state["rainfall"] + np.random.uniform(-2.5, 3.0))
                    self.state["temperature"] = np.clip(self.state["temperature"] + np.random.uniform(-0.4, 0.4), 10.0, 35.0)
                    self.state["humidity"] = np.clip(self.state["humidity"] + np.random.uniform(-1.5, 1.5), 35.0, 85.0)
                    self.state["river_level"] = np.clip(self.state["river_level"] + np.random.uniform(-0.05, 0.05), 0.8, 3.5)
                    self.state["wind_speed"] = np.clip(self.state["wind_speed"] + np.random.uniform(-1.0, 1.2), 5.0, 45.0)
                    
                    # Seismic activity is naturally very low unless triggered
                    if np.random.rand() < 0.96:
                        self.state["seismic_activity"] = max(0.01, np.random.uniform(0.01, 0.15))
                    else:
                        # Minor tremor (anomaly preview)
                        self.state["seismic_activity"] = np.random.uniform(0.8, 1.5)
                        
                    # Slow minor terrain slope settling
                    self.state["land_slope"] = np.clip(self.state["land_slope"] + np.random.uniform(-0.05, 0.05), 23.0, 27.0)
            
            # Sleep 1.5 seconds between ticks
            time.sleep(1.5)

# Global simulator singleton
sensor_simulator = SensorStreamSimulator()
