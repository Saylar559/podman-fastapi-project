from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import auth, admin_routes, models
from app.db import engine, SessionLocal
from app.auth import get_password_hash  # та же функция, что в auth.py

app = FastAPI()

# Разрешённые источники для CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://frontend:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Создаём таблицы при старте
models.Base.metadata.create_all(bind=engine)

# Инициализация администратора
def init_admin():
    db: Session = SessionLocal()
    admin = db.query(models.User).filter_by(username="admin").first()
    if not admin:
        db.add(models.User(
            username="admin",
            hashed_password=get_password_hash("lomavius"),
            role="admin"
        ))
        db.commit()
        print("✅ Админ создан: admin / lomavius")
    db.close()

init_admin()

# Подключаем роутеры (префиксы уже заданы внутри файлов)
app.include_router(auth.router)
app.include_router(admin_routes.router)

# Временно: вывести все зарегистрированные пути для проверки
for r in app.router.routes:
    print(f"{r.methods} {r.path}")
