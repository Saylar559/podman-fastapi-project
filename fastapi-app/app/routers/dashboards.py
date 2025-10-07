# app/routers/dashboards.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field
from app.db import get_db
from app import models
from app.models import UserRole
from app.auth import require_roles, get_current_user

router = APIRouter(prefix="/dashboards", tags=["dashboards"])

# Pydantic схемы
class DashboardCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    config: dict = Field(..., description="JSON конфиг дашборда")

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    is_public: Optional[bool] = None

class DashboardOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    config: dict
    owner_username: str
    is_public: bool

    class Config:
        from_attributes = True

def ensure_owner_or_admin(d: models.Dashboard, user: models.User):
    if user.role == UserRole.admin:
        return True
    if d.owner_id == user.id:
        return True
    raise HTTPException(status_code=403, detail="Недостаточно прав")

@router.get("/", response_model=list[DashboardOut])
def list_dashboards(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    # viewer видит только публичные; developer/admin видят свои + публичные
    q = db.query(models.Dashboard)
    if user.role in (UserRole.admin, UserRole.developer):
        return q.all()
    return q.filter_by(is_public=True).all()

@router.get("/{dash_id}", response_model=DashboardOut)
def get_dashboard(
    dash_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    d = db.get(models.Dashboard, dash_id)
    if not d:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    if d.is_public or user.role in (UserRole.admin, UserRole.developer) or d.owner_id == user.id:
        return d
    raise HTTPException(status_code=403, detail="Недостаточно прав")

@router.post("/", response_model=DashboardOut)
def create_dashboard(
    payload: DashboardCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles([UserRole.admin, UserRole.developer])),
):
    d = models.Dashboard(
        title=payload.title,
        description=payload.description,
        config=payload.config,
        owner_id=user.id,
        is_public=False,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.put("/{dash_id}", response_model=DashboardOut)
def update_dashboard(
    dash_id: int,
    payload: DashboardUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles([UserRole.admin, UserRole.developer])),
):
    d = db.get(models.Dashboard, dash_id)
    if not d:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    ensure_owner_or_admin(d, user)

    if payload.title is not None:
        d.title = payload.title
    if payload.description is not None:
        d.description = payload.description
    if payload.config is not None:
        d.config = payload.config
    if payload.is_public is not None:
        d.is_public = payload.is_public

    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.delete("/{dash_id}")
def delete_dashboard(
    dash_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_roles([UserRole.admin, UserRole.developer])),
):
    d = db.get(models.Dashboard, dash_id)
    if not d:
        raise HTTPException(status_code=404, detail="Дашборд не найден")
    ensure_owner_or_admin(d, user)
    db.delete(d)
    db.commit()
    return {"status": "success", "message": f"Дашборд {dash_id} удален"}
