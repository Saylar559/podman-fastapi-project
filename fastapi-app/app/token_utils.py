import logging
from datetime import datetime, timedelta
from typing import Any, Optional
from jose import jwt, JWTError, ExpiredSignatureError
from app.core.config import SECRET_KEY, ALGORITHM

def create_access_token(data: dict, expires_minutes: int = 15) -> str:
    now = datetime.utcnow()
    expire = now + timedelta(minutes=expires_minutes)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "iat": now, "nbf": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_days: int = 7) -> str:
    now = datetime.utcnow()
    expire = now + timedelta(days=expires_days)
    to_encode = data.copy()
    to_encode.update({"exp": expire, "iat": now, "nbf": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        logging.info("⏰ Токен истёк")
        return None
    except JWTError as e:
        logging.warning(f"❌ Ошибка JWT: {e}")
        return None
