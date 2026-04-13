# Warehouse API

Go + Gin + PostgreSQL + JWT + React

## Зависимости

| Инструмент | Версия | Установка |
|---|---|---|
| Go | 1.21+ | https://go.dev/dl/ |
| Node.js | 18+ | https://nodejs.org/ |
| Docker | любая | https://docs.docker.com/get-docker/ |

Go-зависимости (устанавливаются автоматически через `go mod download`):
- `github.com/gin-gonic/gin` — HTTP-фреймворк
- `github.com/jackc/pgx/v5` — драйвер PostgreSQL
- `github.com/golang-jwt/jwt/v5` — JWT
- `github.com/joho/godotenv` — загрузка .env
- `golang.org/x/crypto` — bcrypt

## Как запустить

### 1. Запустить базу данных (Docker)
```bash
docker run -d \
  --name warehouse-db \
  -e POSTGRES_USER=warehouse \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_DB=warehouse_db \
  -p 5432:5432 \
  postgres:16
```

Применить схему:
```bash
docker exec -i warehouse-db psql -U warehouse -d warehouse_db < schema.sql
```

### 2. Настроить окружение
```bash
cp .env.example .env
```

Содержимое `.env`:
```
DB_URL=postgres://warehouse:secretpassword@localhost:5432/warehouse_db
JWT_SECRET=my-secret-key
PORT=8080
```

### 3. Запустить бэкенд
```bash
go mod download
go run main.go
# Сервер запустится на http://localhost:8080
```

### 4. Запустить фронтенд
```bash
cd frontend
npm install
npm run dev
# Открыть http://localhost:5173
```

### 5. Проверить
```bash
curl http://localhost:8080/api/health
# {"status":"ok"}
```

## Тестовые аккаунты

| Email | Пароль | Роль |
|---|---|---|
| admin@warehouse.local | admin123 | admin |
| procurement@warehouse.local | test123 | Специалист по закупкам |
| manager@warehouse.local | test123 | Менеджер по работе с клиентами |
| warehouse@warehouse.local | test123 | Кладовщик |

## API

### Аутентификация
```
POST /api/auth/register
POST /api/auth/login
```

### Дашборды
```
GET /api/dashboard/procurement  — Специалист по закупкам
GET /api/dashboard/manager      — Менеджер по работе с клиентами
GET /api/dashboard/warehouse    — Кладовщик
```

### Ресурсы
```
GET/POST       /api/suppliers
GET/PUT/DELETE /api/suppliers/:id

GET/POST       /api/clients
GET/PUT/DELETE /api/clients/:id

GET/POST       /api/assortment          ?filter=expiring|low_stock|expired  &category=
GET            /api/assortment/:id/sales-chart
PUT/DELETE     /api/assortment/:id

GET/POST       /api/stock               ?filter=expiring|expired  &category=
GET            /api/stock/forecast
PUT            /api/stock/:id

GET/POST       /api/client-orders       ?status=new|confirmed|processing|completed|cancelled
GET/PUT/DELETE /api/client-orders/:id
POST           /api/client-orders/:id/confirm
POST           /api/client-orders/:id/reject

GET/POST       /api/supplier-orders     ?status=  &supplier_id=
GET/PUT/DELETE /api/supplier-orders/:id

GET/POST       /api/promotions          ?status=active|inactive|expired
GET            /api/promotions/suggestions
GET/PUT/DELETE /api/promotions/:id
GET            /api/promotions/:id/stats

GET/POST       /api/returns
PUT/DELETE     /api/returns/:id
```

## Документация

### Документация разработчика (godoc)

```bash
go install golang.org/x/tools/cmd/godoc@latest
godoc -http=:6060
```

Открыть в браузере: http://localhost:6060/pkg/warehouse-api/

### Документация пользователя

Открыть файл `docs/user.html` в браузере.

