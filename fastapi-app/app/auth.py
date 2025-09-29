import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from passlib.exc import UnknownHashError, MalformedHashError

from app import models
from app.models import UserRole
from app.db import get_db
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.token_utils import create_access_token, create_refresh_token, decode_token

router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Константы для refresh‑cookie
REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 дней


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def safe_verify_password(plain: str, hashed: str) -> bool:
    """Проверка пароля с защитой от битых или неподдерживаемых хэшей."""
    try:
        return pwd_context.verify(plain, hashed)
    except (ValueError, UnknownHashError, MalformedHashError) as e:
        logging.warning(f"⚠ Ошибка проверки пароля: {e}")
        return False


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise credentials_exception

    user = db.get(models.User, int(user_id))
    if not user:
        raise credentials_exception
    return user


def get_current_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён: требуется роль admin"
        )
    return current_user


def get_current_buh(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != UserRole.buh_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещён: требуется роль buh_user"
        )
    return current_user


@router.post("/login")
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter_by(username=form_data.username).first()
    if not user:
        logging.info(f"❌ Попытка входа с несуществующим пользователем: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Автофикс битого хэша
    if not user.hashed_password or not user.hashed_password.startswith("$2b$") or len(user.hashed_password) != 60:
        logging.warning(f"♻ Битый или пустой хэш у {user.username} — пересоздаём")
        user.hashed_password = get_password_hash(form_data.password)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logging.error(f"❌ Ошибка при обновлении хэша для {user.username}: {e}")
            raise HTTPException(status_code=500, detail="Ошибка сервера при обновлении пароля")

    # Безопасная проверка пароля
    if not safe_verify_password(form_data.password, user.hashed_password):
        logging.info(f"❌ Неверный пароль для пользователя {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role = user.role.value  # ✅ всегда строка

    # 🔹 Обновляем время последнего входа
    user.last_login = datetime.utcnow()
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logging.error(f"❌ Ошибка при обновлении last_login для {user.username}: {e}")

    access_token = create_access_token(
        {"sub": str(user.id), "role": role},
        expires_minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    refresh_token = create_refresh_token({"sub": str(user.id), "role": role})

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=False,  # ⚠️ в продакшене лучше True
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE
    )

    logging.info(f"✅ Пользователь {user.username} вошёл в систему с ролью {role}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role
    }


@router.post("/refresh")
async def refresh_token_endpoint(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token отсутствует"
        )

    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный refresh token"
        )

    user_id: str | None = payload.get("sub")
    role: str | None = payload.get("role")
    if not user_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный refresh token"
        )

    user = db.get(models.User, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )

    # Генерация новых токенов
    new_access = create_access_token(
        {"sub": str(user.id), "role": role},
        expires_minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    new_refresh = create_refresh_token({"sub": str(user.id), "role": role})

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=new_refresh,
        httponly=True,
        secure=False,   # ⚠️ в продакшене лучше True
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE
    )

    logging.info(f"♻ Refresh токен обновлён для пользователя {user.username}")

    return {
        "access_token": new_access,
        "token_type": "bearer",
        "role": role,
        "username": user.username  # 👈 удобно для фронта
    }
