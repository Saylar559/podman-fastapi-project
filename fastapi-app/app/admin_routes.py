from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import models, schemas
from app.db import get_db
from app.auth import get_password_hash, get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=schemas.UserListOut)
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
    search: str | None = Query(None, description="Поиск по username, email или full_name"),
    role: str | None = Query(None, description="Фильтр по роли"),
    limit: int = Query(20, ge=1, le=100, description="Максимум записей за запрос"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации")
):
    query = db.query(models.User)

    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.User.username.ilike(like_pattern),
                models.User.email.ilike(like_pattern),
                models.User.full_name.ilike(like_pattern)
            )
        )

    if role:
        query = query.filter(models.User.role == role)

    total = query.count()
    users = query.order_by(models.User.id.desc()).offset(offset).limit(limit).all()

    return {"users": users, "total": total}


@router.post("/users", response_model=schemas.UserListOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin)
):
    if not user_in.username or not user_in.password:
        raise HTTPException(status_code=400, detail="Имя пользователя и пароль обязательны")

    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    user = models.User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return list_users(db=db)


@router.delete("/users/{user_id}", response_model=schemas.UserListOut, status_code=status.HTTP_200_OK)
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

    return list_users(db=db)
