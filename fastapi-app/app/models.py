import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, func, Boolean
from app.db import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    buh_user = "buh_user"
    viewer = "viewer"   # 🔹 вместо generic "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    role = Column(
        SQLEnum(UserRole, name="userrole"),
        nullable=False,
        default=UserRole.viewer,
        server_default=UserRole.viewer.value,
        index=True,
    )

    # 🔹 Новые поля активности
    last_login = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 🔹 Флаг активности (для блокировки/разблокировки)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    def __repr__(self):
        return (
            f"<User(username='{self.username}', "
            f"email='{self.email}', "
            f"role='{self.role}', "
            f"is_active='{self.is_active}', "
            f"last_login='{self.last_login}', "
            f"last_activity='{self.last_activity}')>"
        )
