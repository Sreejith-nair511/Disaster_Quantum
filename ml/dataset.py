import numpy as np
import pandas as pd

def generate_disaster_dataset(num_samples=5000, random_seed=42):
    """
    Generates a realistic synthetic dataset calibrated for India's disaster profile.
    India is one of the world's most disaster-prone countries — prone to:
    - Floods (Brahmaputra, Ganga, Godavari basins)
    - Cyclones (Bay of Bengal, Arabian Sea)
    - Earthquakes (Himalayan belt, Andaman)
    - Landslides (Western Ghats, Northeast hills)
    - Wildfires (Uttarakhand, Odisha forests)
    """
    np.random.seed(random_seed)

    # India-calibrated environmental parameter ranges
    rainfall = np.random.uniform(0.0, 600.0, num_samples)          # mm — monsoon can exceed 500mm/day
    temperature = np.random.uniform(5.0, 50.0, num_samples)        # °C — Rajasthan highs to Himalayan lows
    humidity = np.random.uniform(10.0, 100.0, num_samples)         # %
    river_level = np.random.uniform(0.5, 15.0, num_samples)        # meters — Brahmaputra can flood at 12m+
    wind_speed = np.random.uniform(0.0, 250.0, num_samples)        # km/h — super cyclones hit 220+ km/h
    seismic_activity = np.random.uniform(0.0, 8.5, num_samples)    # Richter — Himalayan seismic zone IV/V
    land_slope = np.random.uniform(0.0, 55.0, num_samples)         # degrees — Western Ghats, NE hills

    data = pd.DataFrame({
        'rainfall': rainfall,
        'temperature': temperature,
        'humidity': humidity,
        'river_level': river_level,
        'wind_speed': wind_speed,
        'seismic_activity': seismic_activity,
        'land_slope': land_slope
    })

    # India-specific disaster classification rules
    # Classes: 0: No Hazard, 1: Flood, 2: Earthquake, 3: Wildfire, 4: Cyclone, 5: Landslide
    labels = []
    for i in range(num_samples):
        row = data.iloc[i]

        # 1. Earthquake: Himalayan seismic zone — triggers at lower threshold than global average
        if row['seismic_activity'] >= 4.0:
            labels.append(2)
        # 2. Cyclone: Bay of Bengal / Arabian Sea — high wind + high humidity signature
        elif row['wind_speed'] >= 100.0 and row['humidity'] >= 70.0:
            labels.append(4)
        # 3. Landslide: Western Ghats / NE India — heavy monsoon rain on steep slopes
        elif row['rainfall'] >= 200.0 and row['land_slope'] >= 25.0:
            labels.append(5)
        # 4. Flood: Brahmaputra / Ganga / Godavari — intense monsoon + high river levels
        elif row['rainfall'] >= 150.0 and row['river_level'] >= 6.0:
            labels.append(1)
        # 5. Wildfire: Uttarakhand / Odisha — extreme heat, low humidity, dry wind
        elif row['temperature'] >= 38.0 and row['humidity'] <= 25.0 and row['wind_speed'] >= 20.0:
            labels.append(3)
        # 6. Default: Nominal conditions
        else:
            labels.append(0)

    data['label'] = labels
    return data


if __name__ == "__main__":
    df = generate_disaster_dataset(100)
    print("India disaster dataset sample counts:")
    print(df['label'].value_counts())
    print("\nLabel mapping: 0=No Hazard, 1=Flood, 2=Earthquake, 3=Wildfire, 4=Cyclone, 5=Landslide")
