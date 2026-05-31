import numpy as np
import pandas as pd

def generate_disaster_dataset(num_samples=5000, random_seed=42):
    """
    Generates a realistic synthetic dataset for environmental parameters
    and maps them to disaster risk categories (Floods, Earthquakes, Wildfires,
    Cyclones, Landslides, or No Hazard).
    """
    np.random.seed(random_seed)
    
    # Generate realistic independent variables
    rainfall = np.random.uniform(0.0, 450.0, num_samples)          # mm
    temperature = np.random.uniform(-10.0, 48.0, num_samples)      # °C
    humidity = np.random.uniform(10.0, 100.0, num_samples)         # %
    river_level = np.random.uniform(0.5, 12.0, num_samples)        # meters
    wind_speed = np.random.uniform(0.0, 220.0, num_samples)        # km/h
    seismic_activity = np.random.uniform(0.0, 8.5, num_samples)    # Richter scale
    land_slope = np.random.uniform(0.0, 50.0, num_samples)         # degrees
    
    data = pd.DataFrame({
        'rainfall': rainfall,
        'temperature': temperature,
        'humidity': humidity,
        'river_level': river_level,
        'wind_speed': wind_speed,
        'seismic_activity': seismic_activity,
        'land_slope': land_slope
    })
    
    # Determine targets based on physically realistic threshold rules
    # Classes: 0: No Hazard, 1: Flood, 2: Earthquake, 3: Wildfire, 4: Cyclone, 5: Landslide
    labels = []
    for i in range(num_samples):
        row = data.iloc[i]
        
        # 1. Earthquake: Strong seismic activity is a direct trigger
        if row['seismic_activity'] >= 4.2:
            labels.append(2)
        # 2. Cyclone: Extreme wind speed with high moisture/humidity
        elif row['wind_speed'] >= 110.0 and row['humidity'] >= 65.0:
            labels.append(4)
        # 3. Landslide: High rainfall saturating steep slopes
        elif row['rainfall'] >= 180.0 and row['land_slope'] >= 28.0:
            labels.append(5)
        # 4. Flood: Intense rainfall coupled with high river levels
        elif row['rainfall'] >= 140.0 and row['river_level'] >= 5.5:
            labels.append(1)
        # 5. Wildfire: Scorchingly high temp, low moisture (humidity), and enough wind to spread
        elif row['temperature'] >= 36.0 and row['humidity'] <= 30.0 and row['wind_speed'] >= 15.0:
            labels.append(3)
        # 6. Default: Nominal green conditions
        else:
            labels.append(0)
            
    data['label'] = labels
    return data

if __name__ == "__main__":
    df = generate_disaster_dataset(100)
    print("Sample dataset counts:")
    print(df['label'].value_counts())
