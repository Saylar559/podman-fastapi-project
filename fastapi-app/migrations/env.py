import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Добавляем корень fastapi-app в sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))  # fastapi-app/
if APP_ROOT not in sys.path:
    sys.path.append(APP_ROOT)

# Теперь можем импортировать пакет app
from app.db import Base
from app import models  # noqa: F401 — важно для автогенерации

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Подхватываем URL БД из окружения
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("ALEMBIC_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL/ALEMBIC_DATABASE_URL is not set for Alembic")

# Пробрасываем в конфиг Alembic
config.set_main_option("sqlalchemy.url", DATABASE_URL)

target_metadata = Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
