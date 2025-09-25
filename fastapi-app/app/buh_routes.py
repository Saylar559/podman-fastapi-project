import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth import get_current_buh
from app import models

router = APIRouter(prefix="/buh", tags=["buh"])

# Тестовый эндпоинт — доступен только бухгалтерам
@router.get("/test")
def test_buh(
    current_user: models.User = Depends(get_current_buh),
    db: Session = Depends(get_db)
):
    logging.info(f"👩‍💼 Бухгалтер {current_user.username} проверил доступ к /buh/test")
    return {"status": "buh ok", "user": current_user.username, "role": current_user.role.value}

# Health‑чек для бух‑модуля
@router.get("/health", include_in_schema=False)
def buh_health():
    return {"status": "buh module ok"}
