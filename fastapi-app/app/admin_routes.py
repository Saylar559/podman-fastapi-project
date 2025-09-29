from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import models, schemas
from app.db import get_db
from app.auth import get_password_hash, get_current_admin
from app.models import UserRole

router = APIRouter(prefix="/admin", tags=["admin"])


# 🔹 Универсальная функция выборки пользователей
def get_users_query(
    db: Session,
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    limit: int = 20,
    offset: int = 0
) -> dict:
    """Возвращает список пользователей с фильтрацией и пагинацией."""
    query = db.query(models.User)

    # Поиск по username/email
    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.User.username.ilike(like_pattern),
                models.User.email.ilike(like_pattern),
            )
        )

    # Фильтр по роли (⚠️ защита от FieldInfo)
    if isinstance(role, UserRole):
        query = query.filter(models.User.role == role)

    total = query.count()
    users = (
        query.order_by(models.User.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {"users": users, "total": total}


# 🔹 Получение списка пользователей
@router.get("/users", response_model=schemas.UserListOut)
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
    search: Optional[str] = Query(None, description="Поиск по username или email"),
    role: Optional[UserRole] = Query(None, description="Фильтр по роли"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    return get_users_query(db, search, role, limit, offset)


# 🔹 Создание пользователя
@router.post("/users", response_model=schemas.UserListOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # ⚠️ Явно передаём role=None, чтобы не утек FieldInfo
    return get_users_query(db, search=None, role=None)


# 🔹 Обновление пользователя
@router.put("/users/{username}", response_model=schemas.UserListOut, status_code=status.HTTP_200_OK)
def update_user(
    username: str,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Обновляем только переданные поля
    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data:
        db_user.hashed_password = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return get_users_query(db, search=None, role=None)


# 🔹 Удаление пользователя
@router.delete("/users/{username}", response_model=schemas.UserListOut, status_code=status.HTTP_200_OK)
def delete_user(
    username: str,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    db.delete(user)
    db.commit()

    return get_users_query(db, search=None, role=None)
