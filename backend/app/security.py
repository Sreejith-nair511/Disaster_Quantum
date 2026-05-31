import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from backend.app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

def create_access_token(data: dict) -> str:
    """Generates a secure JWT token for users."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid security token or session expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency that checks if the request is from a authenticated user session."""
    if not token:
        # Fallback to bypass for simple dev frontend requests if no session headers are passed
        # but enforces standard validation when credentials are supplied
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not found in request headers."
        )
    return verify_token(token)

def verify_api_key(api_key: str = Depends(api_key_header)) -> str:
    """Dependency that checks if a valid X-API-KEY is provided for programmatic requests."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing API Key (X-API-KEY)."
        )
    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API Key."
        )
    return api_key
