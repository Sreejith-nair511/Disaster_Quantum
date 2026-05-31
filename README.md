# AEGIS — India Disaster Intelligence Operations Platform

> **Real-time AI-powered disaster prediction, quantum-inspired resource optimization, and live GIS command mapping for India's 5 highest-risk disaster zones.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat&logo=next.js)](https://nextjs.org/)
[![scikit-learn](https://img.shields.io/badge/ML-scikit--learn-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet.js-199900?style=flat&logo=leaflet)](https://leafletjs.com/)

---

## India Coverage

AEGIS monitors **5 real high-risk disaster zones** across India:

| Zone | Location | Primary Hazards |
|------|----------|----------------|
| Zone Alpha | Mumbai Coast, Maharashtra | Flood, Cyclone |
| Zone Beta | Brahmaputra Valley, Assam | Flood, Earthquake |
| Zone Gamma | Western Ghats, Kerala | Landslide, Flood |
| Zone Delta | Himalayan Foothills, Uttarakhand | Earthquake, Landslide |
| Zone Epsilon | Odisha Cyclone Coast | Cyclone, Flood |

**Command Hub:** NDRF National HQ — New Delhi (28.6°N, 77.2°E)

---

## Features

### AI Risk Prediction
- **Random Forest Classifier** trained on 5,000 India-calibrated disaster scenarios
- Classifies: Flood, Earthquake, Wildfire, Cyclone, Landslide, No Hazard
- Real-time probability vectors streamed via WebSocket
- Manual scenario sandbox with parameter sliders

### Live GIS Tactical Map
- Interactive Leaflet.js map centered on India
- Real coordinates for all 5 disaster zones
- Dynamic threat radius circles (scale with AI risk score)
- NDRF deployment route lines from New Delhi HQ
- Clickable zone popups with live resource allocation data

### Quantum-Inspired Resource Optimizer
Three optimization algorithms for NDRF resource dispatch:
- **Quantum Genetic Algorithm** — chromosome-based evolution with quantum rotation gates
- **Particle Swarm Optimization** — swarm intelligence with inertia damping
- **Simulated Annealing** — thermodynamic probabilistic acceptance

Resources optimized: Ambulances (40), NDRF Teams (30), Medical Supplies (250t), Relief Camps (120)

### Real-Time Telemetry
- WebSocket stream at 1.5s intervals
- India-calibrated sensor simulation (monsoon baseline)
- 5 injectable disaster scenarios (Brahmaputra flood, Himalayan quake, Bay of Bengal cyclone, etc.)
- Auto-alert system with 75%+ probability threshold

### Intelligence Analytics
- Historical telemetry charts (SQLite-backed)
- ML model accuracy metrics
- Optimization run history

---

## Architecture

```
AEGIS/
 backend/ # FastAPI + WebSocket server
 app/
 main.py # API routes + WebSocket endpoint
 config.py # Settings + demo users
 database.py # SQLite persistence
 security.py # JWT auth
 ml/ # Machine learning layer
 model.py # Random Forest + Logistic Regression
 dataset.py # India-calibrated synthetic dataset
 optimizer/ # Quantum-inspired optimization
 base.py # India zones + NDRF resources
 genetic.py # Quantum Genetic Algorithm
 pso.py # Particle Swarm Optimization
 annealing.py # Simulated Annealing
 simulation/ # Sensor telemetry simulation
 sensor_sim.py # India monsoon-calibrated simulator
 frontend/ # Next.js 16 dashboard
 src/
 app/ # Layout + main page
 components/ # Map + 5 view components
 store/ # Zustand state management
```

---

## Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend
```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access
- **Dashboard:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs

### Demo Credentials
| Role | Username | Password |
|------|----------|----------|
| Command Officer | `admin` | `admin123` |
| Field Agent | `field_agent` | `field123` |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | JWT authentication |
| POST | `/api/predict-risk` | Manual AI risk inference |
| POST | `/api/allocate-resources` | Run optimization algorithm |
| POST | `/api/alerts/trigger-anomaly` | Inject disaster scenario |
| GET | `/api/alerts` | Get active alerts |
| POST | `/api/alerts/resolve` | Resolve an alert |
| GET | `/api/historical-analysis` | Analytics + ML metrics |
| WS | `/api/sensor-stream` | Live telemetry WebSocket |

---

## India Disaster Context

India is one of the world's most disaster-prone nations:
- **Floods** affect 40M+ people annually (Brahmaputra, Ganga, Godavari basins)
- **Cyclones** from Bay of Bengal hit Odisha/Andhra coast regularly (Fani 2019, Amphan 2020)
- **Earthquakes** threaten the Himalayan seismic zone IV/V (30M+ at risk)
- **Landslides** kill hundreds yearly in Western Ghats and Northeast India
- **Wildfires** are increasing in Uttarakhand and Odisha forests

AEGIS is designed to give NDRF commanders real-time intelligence to save lives.

---

*Built for hackathon — AEGIS India Disaster Intelligence Platform*
