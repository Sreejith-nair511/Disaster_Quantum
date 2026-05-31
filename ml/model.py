import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from ml.dataset import generate_disaster_dataset
import os
import pickle

class DisasterRiskPredictor:
    def __init__(self):
        self.rf_model = None
        self.lr_model = None
        self.rf_accuracy = 0.0
        self.lr_accuracy = 0.0
        self.is_trained = False
        
        # Disaster class mapping: must match dataset generator
        self.class_map = {
            0: "No Hazard",
            1: "Flood",
            2: "Earthquake",
            3: "Wildfire",
            4: "Cyclone",
            5: "Landslide"
        }
        self.feature_names = ['rainfall', 'temperature', 'humidity', 'river_level', 'wind_speed', 'seismic_activity', 'land_slope']

    def train_models(self):
        """Generates synthetic dataset and trains the classifiers."""
        print("[ML] Generating training data and training models...")
        df = generate_disaster_dataset(5000)
        
        X = df[self.feature_names]
        y = df['label']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_seed=42 if hasattr(self, 'random_seed') else None)
        
        # Train Random Forest Classifier
        self.rf_model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
        self.rf_model.fit(X_train, y_train)
        y_pred_rf = self.rf_model.predict(X_test)
        self.rf_accuracy = float(accuracy_score(y_test, y_pred_rf))
        
        # Train Logistic Regression (for visual/accuracy comparisons in dashboard)
        self.lr_model = LogisticRegression(max_iter=1000, random_state=42)
        self.lr_model.fit(X_train, y_train)
        y_pred_lr = self.lr_model.predict(X_test)
        self.lr_accuracy = float(accuracy_score(y_test, y_pred_lr))
        
        self.is_trained = True
        print(f"[ML] Random Forest Trained. Validation Accuracy: {self.rf_accuracy * 100:.2f}%")
        print(f"[ML] Logistic Regression Trained. Validation Accuracy: {self.lr_accuracy * 100:.2f}%")

    def predict_risk(self, sensor_data: dict) -> dict:
        """
        Predicts disaster probabilities based on live sensor metrics.
        sensor_data must contain keys: rainfall, temperature, humidity, river_level, wind_speed, seismic_activity, land_slope.
        """
        if not self.is_trained:
            self.train_models()
            
        # Format input vector
        features = [[
            sensor_data.get('rainfall', 0.0),
            sensor_data.get('temperature', 20.0),
            sensor_data.get('humidity', 50.0),
            sensor_data.get('river_level', 1.5),
            sensor_data.get('wind_speed', 10.0),
            sensor_data.get('seismic_activity', 0.0),
            sensor_data.get('land_slope', 15.0)
        ]]
        
        # Random Forest Prediction
        probabilities = self.rf_model.predict_proba(features)[0]
        
        # Build probability results
        prob_dict = {}
        for idx, prob in enumerate(probabilities):
            disaster_name = self.class_map[idx]
            prob_dict[disaster_name] = float(prob)
            
        # Calculate maximum risk and determine active category
        highest_prob_class_idx = int(np.argmax(probabilities))
        highest_prob = float(probabilities[highest_prob_class_idx])
        predicted_hazard = self.class_map[highest_prob_class_idx]
        
        # Overall risk score calculation
        # No Hazard counts towards low risk, others sum up or take maximum
        if predicted_hazard == "No Hazard":
            risk_score = (1.0 - highest_prob) * 100.0  # Residual non-zero probabilities
            if risk_score < 5.0:
                risk_score = 5.0  # Base level
        else:
            risk_score = highest_prob * 100.0
            
        # Compile response payload
        results = {
            "prediction": predicted_hazard,
            "confidence": highest_prob,
            "risk_score": float(risk_score),
            "probabilities": prob_dict,
            "model_stats": {
                "algorithm": "Random Forest Classifier",
                "accuracy": self.rf_accuracy,
                "alternative_algorithm": "Logistic Regression",
                "alternative_accuracy": self.lr_accuracy
            }
        }
        
        return results

# Global singleton instance for backend imports
predictor_instance = DisasterRiskPredictor()
