import enum
from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.db import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    buh_user = "buh_user"
    viewer = "viewer"   # 🔹 вместо generic "user"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)  # 🔹 новое поле
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, name="userrole"),   # 🔹 имя enum в БД
        nullable=False,
        default=UserRole.viewer,
        server_default=UserRole.viewer.value,
        index=True,
    )

    def __repr__(self):
        return f"<User(username='{self.username}', email='{self.email}', role='{self.role}')>"
