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

---

## Changelog

### Изменения относительно начального бэка

#### Пользователи и аутентификация
- `full_name` разбито на `first_name` + `last_name`
- `phone` теперь принимается при регистрации
- Роль (`role`) выбирается при регистрации
- Новые роли: `procurement_specialist`, `client_manager`, `warehouse_keeper` (вместо `employee`, `manager`, `admin`)

#### База данных — новые таблицы
- `suppliers` — поставщики (name, contact_info, phone, email)
- `clients` — клиенты (name, phone, email, company)
- `sales` — история продаж для прогнозирования спроса

#### База данных — новые поля в существующих таблицах
- `assortment`: добавлены `expiry_date`, `description`, `min_stock_level`
- `supplier_orders`: добавлены `supplier_id`, `expected_delivery_date`, `delivery_conditions`
- `client_orders`: добавлены `client_id`, `delivery_method`; расширены статусы (`confirmed`, `processing`, `completed`, `cancelled`)
- `promotions`: добавлено поле `status` (`active`, `inactive`, `expired`)

#### Новые endpoint'ы
- `GET /api/dashboard/*` — три дашборда по ролям
- `GET /api/assortment?filter=expiring|low_stock|expired` — фильтрация товаров
- `GET /api/assortment/:id/sales-chart` — график продаж за 6 месяцев
- `GET /api/stock/forecast` — прогноз спроса и рекомендации по закупкам
- `GET /api/stock?filter=expiring|expired` — фильтрация остатков по сроку
- `POST /api/client-orders/:id/confirm` — подтверждение заказа
- `POST /api/client-orders/:id/reject` — отклонение заказа
- `GET /api/client-orders/:id` — детали заказа клиента
- `GET /api/supplier-orders/:id` — детали заказа поставщику
- `GET /api/promotions/suggestions` — автоматические предложения акций (по истекающим товарам)
- `GET /api/promotions/:id/stats` — статистика акции
- `GET /api/promotions/:id` — детали акции
- CRUD для `/api/suppliers` и `/api/clients`

#### Прочее
- CORS-заголовки для React-фронтенда
- Фронтенд на React (Vite) в папке `frontend/`
- Обновлена документация пользователя (`docs/user.html`) и разработчика (`docs/developer.html`)
