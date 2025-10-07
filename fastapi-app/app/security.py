from passlib.context import CryptContext
from passlib.exc import UnknownHashError, MalformedHashError
import logging

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def safe_verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except (ValueError, UnknownHashError, MalformedHashError) as e:
        logging.warning(f"Ошибка проверки пароля: {e}")
        return False
