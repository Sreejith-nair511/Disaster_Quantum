import os

class Settings:
    PROJECT_NAME: str = "Aegis Disaster Intelligence Operations Platform (ADIOP)"
    SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 1 day
    
    # Demo Mock Users (for dashboard login demonstration)
    DEMO_USERS = {
        "admin": {
            "password_hash": "admin123", # simple comparison for demonstration/hackathon
            "role": "Command Officer",
            "name": "Director Sarah Jenkins"
        },
        "field_agent": {
            "password_hash": "field123",
            "role": "Field Agent",
            "name": "Agent Marcus Vance"
        }
    }
    
    API_KEY: str = "AEGIS-SECURE-INTELLIGENCE-KEY-2026"

settings = Settings()
