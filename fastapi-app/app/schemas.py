from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from app.models import UserRole


# --- Токен ---
class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    role: UserRole
    username: str


# --- Базовые схемы пользователя ---
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=150, description="Имя пользователя")
    email: EmailStr = Field(..., description="Email пользователя")
    role: UserRole = Field(..., description="Роль пользователя")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128, description="Пароль пользователя")


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(None, description="Новый email")
    role: Optional[UserRole] = Field(None, description="Новая роль")
    password: Optional[str] = Field(None, min_length=6, max_length=128, description="Новый пароль")
    is_active: Optional[bool] = Field(None, description="Активен ли пользователь")

    model_config = ConfigDict(from_attributes=True)


# --- Ответ пользователю ---
class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    last_login: Optional[datetime] = None
    last_activity: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Список пользователей (для админки) ---
class UserListOut(BaseModel):
    users: list[UserOut]
    total: int

    model_config = ConfigDict(from_attributes=True)
