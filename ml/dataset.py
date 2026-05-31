import numpy as np
import pandas as pd

def generate_disaster_dataset(num_samples=10000, random_seed=42):
    """
    Generates a realistic synthetic dataset calibrated for India's disaster profile.
    Uses physically meaningful thresholds derived from historical Indian disaster data.

    India disaster classes (7 total):
    - Flood (Brahmaputra, Ganga, Godavari basins)
    - Earthquake (Himalayan seismic zone IV/V)
    - Wildfire (Uttarakhand, Odisha forests)
    - Cyclone (Bay of Bengal, Arabian Sea)
    - Landslide (Western Ghats, Northeast hills)
    - Heatwave (Rajasthan, Central India)
    - Cloudburst (Delhi, Himachal Pradesh, Uttarakhand)
    """
    np.random.seed(random_seed)

    # India-calibrated environmental parameter ranges
    rainfall = np.random.uniform(0.0, 600.0, num_samples)              # mm — monsoon can exceed 500mm/day
    temperature = np.random.uniform(5.0, 50.0, num_samples)            # °C
    humidity = np.random.uniform(5.0, 100.0, num_samples)              # %
    river_level = np.random.uniform(0.5, 15.0, num_samples)            # meters
    wind_speed = np.random.uniform(0.0, 250.0, num_samples)            # km/h
    seismic_activity = np.random.uniform(0.0, 9.0, num_samples)        # Richter
    land_slope = np.random.uniform(0.0, 55.0, num_samples)             # degrees

    data = pd.DataFrame({
        'rainfall_mm': rainfall,
        'temperature_c': temperature,
        'humidity_percent': humidity,
        'river_level_m': river_level,
        'wind_speed_kmh': wind_speed,
        'seismic_activity_richter': seismic_activity,
        'land_slope': land_slope
    })

    # India-specific disaster classification rules (priority order matters)
    # Classes: Flood, Earthquake, Wildfire, Cyclone, Landslide, Heatwave, Cloudburst, No Hazard
    labels = []
    for i in range(num_samples):
        row = data.iloc[i]

        # 1. Earthquake: Himalayan seismic zone IV/V — triggers at 4.0R+
        if row['seismic_activity_richter'] >= 4.0:
            labels.append('Earthquake')
        # 2. Cyclone: Bay of Bengal / Arabian Sea — high wind + high humidity
        elif row['wind_speed_kmh'] >= 100.0 and row['humidity_percent'] >= 70.0:
            labels.append('Cyclone')
        # 3. Cloudburst: Sudden extreme rainfall (>400mm) with high humidity
        elif row['rainfall_mm'] >= 400.0 and row['humidity_percent'] >= 85.0:
            labels.append('Cloudburst')
        # 4. Landslide: Heavy monsoon rain on steep slopes (Western Ghats / NE India)
        elif row['rainfall_mm'] >= 200.0 and row['land_slope'] >= 25.0:
            labels.append('Landslide')
        # 5. Flood: Intense monsoon + high river levels (Brahmaputra / Ganga)
        elif row['rainfall_mm'] >= 150.0 and row['river_level_m'] >= 6.0:
            labels.append('Flood')
        # 6. Heatwave: Extreme heat + very low humidity + dry wind (Rajasthan / Central India)
        elif row['temperature_c'] >= 42.0 and row['humidity_percent'] <= 20.0:
            labels.append('Heatwave')
        # 7. Wildfire: High temp + low humidity + wind (Uttarakhand / Odisha forests)
        elif row['temperature_c'] >= 38.0 and row['humidity_percent'] <= 25.0 and row['wind_speed_kmh'] >= 20.0:
            labels.append('Wildfire')
        # 8. Default: Nominal conditions
        else:
            labels.append('No Hazard')

    data['disaster_type'] = labels
    return data


if __name__ == "__main__":
    df = generate_disaster_dataset(1000)
    print("India disaster dataset sample counts:")
    print(df['disaster_type'].value_counts())
