import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Enum as SQLEnum,
    func,
    Boolean,
    Index,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.db import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    developer = "developer"
    buh_user = "buh_user"
    viewer = "viewer"  # вместо generic "user"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_username_email", "username", "email", unique=True),
        Index("ix_users_role_active", "role", "is_active"),
    )

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

    # Активность
    last_login = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Флаг активности
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    # Связь с дашбордами
    dashboards = relationship(
        "Dashboard",
        back_populates="owner",
        cascade="all, delete-orphan",
    )

    def mark_login(self):
        now = datetime.utcnow()
        self.last_login = now
        self.last_activity = now

    def touch_activity(self):
        self.last_activity = datetime.utcnow()

    def deactivate(self):
        self.is_active = False

    def activate(self):
        self.is_active = True

    def __repr__(self):
        return (
            f"<User(username='{self.username}', "
            f"email='{self.email}', "
            f"role='{self.role}', "
            f"is_active='{self.is_active}', "
            f"last_login='{self.last_login}', "
            f"last_activity='{self.last_activity}')>"
        )


class Dashboard(Base):
    __tablename__ = "dashboards"
    __table_args__ = (
        Index("ix_dashboards_owner", "owner_id"),
        Index("ix_dashboards_public", "is_public"),
    )

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    config = Column(JSONB, nullable=False)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)

    owner = relationship("User", back_populates="dashboards")

    def __repr__(self):
        return (
            f"<Dashboard(id={self.id}, title='{self.title}', "
            f"owner_id={self.owner_id}, public={self.is_public})>"
        )
