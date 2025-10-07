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
) -> schemas.UserListOut:
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

    # Фильтр по роли
    if isinstance(role, UserRole):
        query = query.filter(models.User.role == role)

    total = query.count()
    users = (
        query.order_by(models.User.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return schemas.UserListOut(users=users, total=total)


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
@router.post("/users", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
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
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# 🔹 Обновление пользователя
@router.put("/users/{user_id}", response_model=schemas.UserOut, status_code=status.HTTP_200_OK)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    update_data = user_in.dict(exclude_unset=True)
    if "password" in update_data:
        db_user.hashed_password = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)

    return db_user


# 🔹 Удаление пользователя
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    db.delete(user)
    db.commit()
    return  # 204 No Content


# 🔹 Обновление статуса пользователя (активен/неактивен)
@router.patch("/users/{user_id}/status", response_model=schemas.UserOut)
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


# 🔹 Получение списка доступных ролей
@router.get("/roles", response_model=list[str])
def list_roles(
    _: models.User = Depends(get_current_admin)
):
    return [role.value for role in UserRole]
