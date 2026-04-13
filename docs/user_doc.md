# Warehouse API

## Описание приложения

Warehouse API — серверная часть системы управления складом. Предназначена для автоматизации учёта товаров, управления заказами, контроля остатков и взаимодействия с поставщиками и клиентами.

Система предоставляет REST API, который может использоваться веб‑ или мобильным фронтендом.

---

## Основные функции

- Управление ассортиментом товаров
- Учёт остатков на складе
- Обработка заказов клиентов
- Формирование заказов поставщикам
- Управление акциями и скидками
- Оформление возвратов
- Ролевая модель пользователей (admin, manager и т.д.)
- JWT-аутентификация

---

## Установка и требования

### Требования

- Go 1.21+
- PostgreSQL 14+
- NodesJS 18+
- Docker (опционально)

### Запуск базы данных

```bash
docker run -d \
  --name warehouse-db \
  -e POSTGRES_USER=warehouse \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_DB=warehouse_db \
  -p 5432:5432 \
  postgres:16
```

Применение схемы:

```bash
docker exec -i warehouse-db psql -U warehouse -d warehouse_db < schema.sql
```

### Конфигурация

Создать `.env`:

```
DB_URL=postgres://warehouse:secretpassword@localhost:5432/warehouse_db
JWT_SECRET=your-secret-key
PORT=8080
```

### Запуск сервера

```bash
go mod download
go run main.go
```

---

## Работа сервера

После запуска сервер доступен по адресу:

```
http://localhost:8080
```

Проверка:

```bash
curl http://localhost:8080/api/health
```

Ответ:

```json
{ "status": "ok" }
```

Сервер обрабатывает HTTP-запросы и возвращает JSON-ответы. Все защищённые эндпоинты требуют JWT-токен.

---

## Обзор интерфейса (логика API)

Система построена по REST-принципу. Основные группы эндпоинтов:

- `/api/auth` — аутентификация
- `/api/assortment` — товары
- `/api/stock` — остатки
- `/api/clients` — клиенты
- `/api/suppliers` — поставщики
- `/api/client-orders` — заказы клиентов
- `/api/supplier-orders` — заказы поставщикам
- `/api/promotions` — акции
- `/api/returns` — возвраты

---

## Аутентификация

Используется JWT.

Заголовок:

```
Authorization: Bearer <token>
```

---

## Пример эндпоинтов

### Ассортимент

| Метод | URL |
|------|-----|
| GET | /api/assortment |
| POST | /api/assortment |
| PUT | /api/assortment/:id |
| DELETE | /api/assortment/:id |

### Остатки

| Метод | URL |
|------|-----|
| GET | /api/stock |
| POST | /api/stock |
| PUT | /api/stock/:id |

### Заказы клиентов

| Метод | URL |
|------|-----|
| GET | /api/client-orders |
| POST | /api/client-orders |
| PUT | /api/client-orders/:id |
| DELETE | /api/client-orders/:id |

---

## Коды ошибок

Все ошибки возвращаются в формате:

```json
{ "error": "описание" }
```

| Код | Значение |
|-----|---------|
| 400 | Неверный запрос |
| 401 | Нет авторизации |
| 403 | Нет доступа |
| 404 | Не найдено |
| 500 | Ошибка сервера |

---

## Примечание

Все эндпоинты, кроме `/api/auth/*` и `/api/health`, требуют JWT.
