.PHONY: up down restart logs purge ensure-env wait-for-backend wait-for-frontend open-browser show-summary kill-port restart-frontend

# Автоопределение сервисов из podman-compose.yml
BACKEND_SERVICE := $(shell grep -E '^[[:space:]]*[A-Za-z0-9_-]+:' podman-compose.yml 2>/dev/null \
    | grep -iE 'api|backend|fastapi' | head -n1 | sed 's/://;s/^[[:space:]]*//')
FRONTEND_SERVICE := $(shell grep -E '^[[:space:]]*[A-Za-z0-9_-]+:' podman-compose.yml 2>/dev/null \
    | grep -iE 'front|react|ui|web'  | head -n1 | sed 's/://;s/^[[:space:]]*//')

# URL для healthcheck и интерфейсов
BACKEND_HEALTHCHECK_URL := http://localhost:8000/health
FRONTEND_URL            := http://localhost:3000
SWAGGER_URL             := http://localhost:8000/docs

# Чтение DEBUG из .env (по умолчанию False)
DEBUG_MODE := $(shell grep -E '^DEBUG=' fastapi-app/.env 2>/dev/null | cut -d'=' -f2 || echo False)

# Создать шаблон .env, если его нет
ensure-env:
	@if [ ! -f fastapi-app/.env ]; then \
		echo "📝 Создаю fastapi-app/.env..."; \
		mkdir -p fastapi-app; \
		cat > fastapi-app/.env << 'EOF' \
POSTGRES_USER=postgres \
POSTGRES_PASSWORD=postgres \
POSTGRES_DB=app_db \
POSTGRES_HOST=db \
POSTGRES_PORT=5432 \
 \
SECRET_KEY=supersecretkey123 \
ALGORITHM=HS256 \
ACCESS_TOKEN_EXPIRE_MINUTES=30 \
DEBUG=True \
EOF; \
		echo "✅ fastapi-app/.env создан"; \
	fi

# Освобождение портов 8000 и 3000
kill-port:
	@for PORT in 8000 3000; do \
		PID=$$(lsof -ti:$$PORT 2>/dev/null || echo ""); \
		if [ -n "$$PID" ]; then \
			echo "🛑 Освобождаю порт $$PORT (PID $$PID)..."; \
			kill -9 $$PID 2>/dev/null || true; \
		else \
			echo "✅ Порт $$PORT свободен"; \
		fi; \
	done

# Ожидание готовности бэкенда
wait-for-backend:
	@echo "⏳ Ожидание бэкенда ($(BACKEND_HEALTHCHECK_URL))..."; \
	for i in $$(seq 1 60); do \
		RES=$$(curl -s -m 1 "$(BACKEND_HEALTHCHECK_URL)" 2>/dev/null || echo ""); \
		if echo "$$RES" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then \
			echo "✅ Бэкенд готов: $$RES"; exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "❌ Бэкенд не ответил"; \
	echo "📜 Логи бэкенда:"; \
	podman-compose logs --tail=80 $(BACKEND_SERVICE) 2>/dev/null || true; \
	exit 1

# Ожидание готовности фронтенда
wait-for-frontend:
	@if [ -n "$(FRONTEND_SERVICE)" ]; then \
		echo "⏳ Ожидание фронтенда ($(FRONTEND_URL))..."; \
		for i in $$(seq 1 90); do \
			CODE=$$(curl -s -o /dev/null -w "%{http_code}" "$(FRONTEND_URL)" 2>/dev/null || echo 000); \
			if [ "$$CODE" = "200" ] || [ "$$CODE" = "301" ] || [ "$$CODE" = "302" ]; then \
				echo "✅ Фронтенд отвечает (HTTP $$CODE)"; break; \
			fi; \
			sleep 1; \
		done; \
		if [ "$$i" = "90" ]; then \
			echo "❌ Фронтенд не ответил"; \
			podman-compose logs --tail=120 $(FRONTEND_SERVICE) 2>/dev/null || true; \
			exit 1; \
		fi; \
	else \
		echo "ℹ️ Фронтенд не найден — пропускаем"; \
	fi

# Открытие браузера (Frontend + Swagger при DEBUG=True)
open-browser:
	@echo "🌐 Открываю браузер..."; \
	python3 << 'EOF' \
import webbrowser \
frontend = "$(FRONTEND_URL)" \
swagger = "$(SWAGGER_URL)" \
debug_mode = "$(DEBUG_MODE)".strip().lower() == "true" \
urls = [frontend] \
if debug_mode: \
    urls.append(swagger) \
for url in urls: \
    webbrowser.open_new_tab(url) \
print("✅ Открыто в браузере:", ", ".join(urls)) \
EOF

# Сводка по запущенным сервисам
show-summary:
	@echo ""; \
	echo "📊 Сводка сервисов:"; \
	echo "──────────────────────────"; \
	podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | \
		grep -E "$(BACKEND_SERVICE)|$(FRONTEND_SERVICE)" 2>/dev/null || echo "Нет запущенных сервисов"; \
	echo "──────────────────────────"; \
	echo "🌐 API:   $(BACKEND_HEALTHCHECK_URL)"; \
	if [ "$(DEBUG_MODE)" = "True" ]; then echo "📜 Swagger: $(SWAGGER_URL)"; fi; \
	echo "🌐 Front: $(FRONTEND_URL)"; \
	echo ""

# Полный запуск проекта
up: ensure-env kill-port
	@if [ -z "$(BACKEND_SERVICE)" ]; then \
		echo "❌ Сервис бэкенда не найден"; exit 1; \
	fi; \
	echo "🚀 Запуск контейнеров..."; \
	podman-compose up --build -d; \
	$(MAKE) wait-for-backend; \
	if [ -n "$(FRONTEND_SERVICE)" ]; then $(MAKE) wait-for-frontend; fi; \
	$(MAKE) open-browser; \
	$(MAKE) show-summary; \
	echo "✅ Проект запущен"

# Остановка контейнеров
down:
	@echo "🛑 Остановка..."; \
	podman-compose down -t 0 --remove-orphans

# Перезапуск
restart: down up

# Логи бэкенда
logs:
	@if [ -n "$(BACKEND_SERVICE)" ]; then \
		podman-compose logs -f $(BACKEND_SERVICE); \
	else \
		echo "❌ Сервис бэкенда не найден"; \
	fi

# Полная очистка Podman
purge:
	@echo "🔥 Полная очистка Podman..."; \
	podman rm -f $$(podman ps -aq) 2>/dev/null || true; \
	podman pod rm -f $$(podman pod ps -q) 2>/dev/null || true; \
	podman network prune -f 2>/dev/null || true; \
	podman image prune -af 2>/dev/null || true

# Перезапуск только фронтенда
restart-frontend:
	@if [ -n "$(FRONTEND_SERVICE)" ]; then \
		echo "🔄 Перезапуск фронтенда ($(FRONTEND_SERVICE))..."; \
		podman-compose restart $(FRONTEND_SERVICE); \
		$(MAKE) wait-for-frontend; \
		echo "✅ Фронтенд перезапущен"; \
	else \
		echo "❌ Сервис фронтенда не найден в podman-compose.yml"; \
		exit 1; \
	fi
logs-frontend:
	@if [ -n "$(FRONTEND_SERVICE)" ]; then \
		podman-compose logs -f $(FRONTEND_SERVICE); \
	else \
		echo "❌ Сервис фронтенда не найден в podman-compose.yml"; \
	fi
