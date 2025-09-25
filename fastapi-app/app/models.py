import enum
from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.db import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"
    buh_user = "buh_user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.user,
        server_default=UserRole.user.value,
        index=True
    )

    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"
