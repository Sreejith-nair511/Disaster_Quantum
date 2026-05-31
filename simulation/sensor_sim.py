import numpy as np
import threading
import time
from typing import Dict

class SensorStreamSimulator:
    """
    Simulates real-time environmental sensor telemetry calibrated for India.
    Baseline values reflect typical monsoon-season conditions across the subcontinent.
    """
    def __init__(self):
        # India baseline nominal values (monsoon season, moderate conditions)
        self.state = {
            "rainfall": 35.0,            # mm — moderate monsoon baseline
            "temperature": 32.0,         # °C — typical Indian summer/monsoon
            "humidity": 72.0,            # % — high humidity during monsoon
            "river_level": 2.5,          # meters — moderate river level
            "wind_speed": 18.0,          # km/h — light to moderate wind
            "seismic_activity": 0.05,    # Richter — background microseismic
            "land_slope": 28.0           # degrees — representative of hilly terrain
        }

        self.lock = threading.Lock()
        self.is_running = False
        self.thread = None

        # Track active event duration (resets to nominal after a few ticks)
        self.hazard_countdown = 0
        self.active_hazard = None

    def start(self):
        with self.lock:
            if not self.is_running:
                self.is_running = True
                self.thread = threading.Thread(target=self._run, daemon=True)
                self.thread.start()
                print("[SIMULATOR] India sensor stream generator started.")

    def stop(self):
        with self.lock:
            self.is_running = False
            print("[SIMULATOR] India sensor stream generator stopped.")

    def trigger_hazard_anomaly(self, hazard_type: str):
        """Forces immediate environmental spikes to simulate India-specific disaster scenarios."""
        with self.lock:
            self.active_hazard = hazard_type.lower()
            self.hazard_countdown = 8  # Hazard lasts 8 ticks then decays

            if self.active_hazard == "flood":
                # Brahmaputra / Ganga basin flood scenario
                self.state["rainfall"] = 380.0
                self.state["river_level"] = 11.5
                self.state["humidity"] = 97.0
            elif self.active_hazard == "earthquake":
                # Himalayan seismic zone IV/V event
                self.state["seismic_activity"] = 6.8
                self.state["river_level"] = 3.2
            elif self.active_hazard == "wildfire":
                # Uttarakhand / Odisha forest fire scenario
                self.state["temperature"] = 46.0
                self.state["humidity"] = 9.0
                self.state["wind_speed"] = 55.0
            elif self.active_hazard == "cyclone":
                # Bay of Bengal super cyclone (like Amphan / Fani)
                self.state["wind_speed"] = 210.0
                self.state["humidity"] = 96.0
                self.state["rainfall"] = 250.0
            elif self.active_hazard == "landslide":
                # Western Ghats / Northeast India landslide scenario
                self.state["rainfall"] = 420.0
                self.state["land_slope"] = 42.0

            print(f"[SIMULATOR] India Scenario Triggered: {hazard_type.upper()} anomaly injected.")

    def get_latest_telemetry(self) -> Dict[str, float]:
        with self.lock:
            return self.state.copy()

    def _run(self):
        while self.is_running:
            with self.lock:
                if self.hazard_countdown > 0:
                    self.hazard_countdown -= 1
                    # Keep values elevated with minor jitter during hazard
                    if self.active_hazard == "flood":
                        self.state["rainfall"] += np.random.uniform(-8.0, 8.0)
                        self.state["river_level"] += np.random.uniform(-0.2, 0.2)
                    elif self.active_hazard == "earthquake":
                        self.state["seismic_activity"] = max(0.5, self.state["seismic_activity"] + np.random.uniform(-0.6, 0.3))
                    elif self.active_hazard == "wildfire":
                        self.state["temperature"] += np.random.uniform(-1.5, 1.5)
                        self.state["humidity"] = np.clip(self.state["humidity"] + np.random.uniform(-0.5, 0.5), 6.0, 14.0)
                    elif self.active_hazard == "cyclone":
                        self.state["wind_speed"] += np.random.uniform(-12.0, 12.0)
                        self.state["rainfall"] += np.random.uniform(-10.0, 10.0)
                    elif self.active_hazard == "landslide":
                        self.state["rainfall"] += np.random.uniform(-8.0, 8.0)

                    if self.hazard_countdown == 0:
                        print("[SIMULATOR] Hazard simulation complete. Decaying to India baseline values...")
                        self.active_hazard = None
                else:
                    # Random walk for standard Indian monsoon atmospheric telemetry
                    self.state["rainfall"] = max(0.0, self.state["rainfall"] + np.random.uniform(-4.0, 5.0))
                    self.state["temperature"] = np.clip(self.state["temperature"] + np.random.uniform(-0.5, 0.5), 18.0, 42.0)
                    self.state["humidity"] = np.clip(self.state["humidity"] + np.random.uniform(-2.0, 2.0), 40.0, 95.0)
                    self.state["river_level"] = np.clip(self.state["river_level"] + np.random.uniform(-0.08, 0.1), 1.0, 5.0)
                    self.state["wind_speed"] = np.clip(self.state["wind_speed"] + np.random.uniform(-1.5, 1.8), 5.0, 60.0)

                    # Seismic: mostly quiet, occasional Himalayan tremors
                    if np.random.rand() < 0.95:
                        self.state["seismic_activity"] = max(0.01, np.random.uniform(0.01, 0.20))
                    else:
                        # Minor tremor (Himalayan microseismic)
                        self.state["seismic_activity"] = np.random.uniform(1.0, 2.5)

                    # Terrain slope — stable
                    self.state["land_slope"] = np.clip(self.state["land_slope"] + np.random.uniform(-0.05, 0.05), 25.0, 31.0)

            time.sleep(1.5)

# Global simulator singleton
sensor_simulator = SensorStreamSimulator()
