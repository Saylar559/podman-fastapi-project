import logging
import os
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import auth, admin_routes, buh_routes, models
from app.db import engine, SessionLocal, get_db
from app.auth import get_password_hash, get_current_user
from app.models import UserRole
from app.core import config
from app.api import excel  # Excel-роутер

# 1. Логирование
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# 2. FastAPI
app = FastAPI(title="Podman FastAPI Project", version="1.0.0")

# 3. CORS
origins = getattr(config, "CORS_ORIGINS", [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://frontend:3000",
])
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Служебные маршруты
@app.get("/api/health", include_in_schema=False)
@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "ok"}

@app.get("/api/ping")
async def ping():
    return {"ok": True}

@app.get("/api/me")
async def get_me(current_user=Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "role": current_user.role}

# favicon
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
    path = os.path.join(frontend_dir, "favicon.ico")
    if os.path.exists(path):
        return FileResponse(path)
    return JSONResponse(status_code=404, content={"detail": "favicon not found"})

# 5. Middleware логирования
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"➡️ {request.method} {request.url.path}")
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(f"❌ Ошибка при обработке {request.method} {request.url.path}: {e}")
        return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
    logger.info(f"⬅️ {request.method} {request.url.path} -> {response.status_code}")
    return response

# 6. Глобальные обработчики ошибок
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# 7. Инициализация БД и пользователей
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("✅ Таблицы проверены/созданы")
except Exception as e:
    logger.error(f"❌ Ошибка при создании таблиц: {e}")

def init_user(username: str, password: str, role: str):
    with SessionLocal() as db:
        user = db.query(models.User).filter_by(username=username).first()
        try:
            role_enum = UserRole(role)
        except ValueError:
            logger.error(f"❌ Недопустимая роль {role} для пользователя {username}")
            return
        if not user:
            db.add(models.User(
                username=username,
                hashed_password=get_password_hash(password),
                role=role_enum
            ))
            db.commit()
            logger.info(f"✅ Пользователь создан: {username} / {role}")
        else:
            updated = False
            if not user.hashed_password or not user.hashed_password.startswith("$2b$") or len(user.hashed_password) != 60:
                user.hashed_password = get_password_hash(password)
                updated = True
                logger.info(f"♻ Пароль пересоздан для {username}")
            if user.role != role_enum:
                user.role = role_enum
                updated = True
                logger.info(f"♻ Роль обновлена для {username} -> {role}")
            if updated:
                db.commit()
            logger.info(f"ℹ Пользователь {username} проверен")

def fix_all_hashes():
    logger.info("🔍 Проверка хэшей всех пользователей...")
    with SessionLocal() as db:
        users = db.query(models.User).all()
        for user in users:
            if not user.hashed_password or not user.hashed_password.startswith("$2b$") or len(user.hashed_password) != 60:
                logger.warning(f"♻ Битый хэш у {user.username} — пересоздаём")
                default_passwords = {"admin": "lomavius", "buhgalter": "balance1"}
                new_password = default_passwords.get(user.username, "changeme123")
                user.hashed_password = get_password_hash(new_password)
                db.commit()
                logger.info(f"✅ Хэш обновлён для {user.username}")
    logger.info("✅ Проверка хэшей завершена")

@app.on_event("startup")
def startup_event():
    logger.info(f"📡 DATABASE_URL: {getattr(config, 'DATABASE_URL', 'не задан')}")
    init_user("admin", "lomavius", "admin")
    init_user("buhgalter", "balance1", "buh_user")
    fix_all_hashes()

# 8. Подключение маршрутов
app.include_router(auth.router, prefix="/api")
app.include_router(admin_routes.router, prefix="/api")
app.include_router(buh_routes.router, prefix="/api")
app.include_router(excel.router, prefix="/api")

# 9. Раздача фронта (если собран React)
frontend_build = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
if os.path.exists(frontend_build):
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_build, "static")), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        index_path = os.path.join(frontend_build, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

# 10. Логирование маршрутов при старте
for route in app.router.routes:
    methods = ",".join(route.methods) if route.methods else ""
    tags = getattr(route, "tags", [])
    logger.info(f"[{methods}] {route.path} (tags={tags})")
