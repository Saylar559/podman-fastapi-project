from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    role: str


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=150, description="Имя пользователя")
    role: str = Field(..., description="Роль пользователя")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128, description="Пароль пользователя")


class UserOut(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class UserListOut(BaseModel):
    users: list[UserOut]
    total: int
