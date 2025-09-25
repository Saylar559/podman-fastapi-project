from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from collections.abc import Generator
from app.core.config import DATABASE_URL

# Движок с проверкой соединения
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # проверка соединения перед использованием
    echo=False           # True для отладки SQL
)

# Фабрика сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс моделей
Base = declarative_base()

# Зависимость для получения сессии
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
