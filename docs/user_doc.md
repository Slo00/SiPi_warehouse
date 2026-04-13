# Warehouse API

Серверная часть системы управления складом. Предоставляет REST API для работы с товарами, заказами, остатками, акциями и возвратами.

- Язык: Go  
- Фреймворк: Gin  
- База данных: PostgreSQL  
- Аутентификация: JWT  

Базовый URL:
http://localhost:8080

Все запросы и ответы — в формате JSON.

---

# Описание системы

Warehouse API позволяет:

- Вести ассортимент товаров
- Учитывать остатки на складе
- Обрабатывать заказы клиентов
- Управлять закупками у поставщиков
- Создавать акции
- Оформлять возвраты
- Работать с ролями пользователей

---

# Архитектура

Проект разделён на пакеты:

- config — конфигурация (.env)
- db — подключение к PostgreSQL
- middleware — JWT
- models — структуры данных
- handlers — HTTP-обработчики

---

# Установка

## Требования

- Go 1.21+
- PostgreSQL 14+
- Docker (опционально)

## 1. База данных

docker run -d \
  --name warehouse-db \
  -e POSTGRES_USER=warehouse \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_DB=warehouse_db \
  -p 5432:5432 \
  postgres:16

Применение схемы:

docker exec -i warehouse-db psql -U warehouse -d warehouse_db < schema.sql

## 2. Конфигурация

.env:

DB_URL=postgres://warehouse:secretpassword@localhost:5432/warehouse_db  
JWT_SECRET=your-secret-key  
PORT=8080  

## 3. Запуск

go mod download  
go run main.go  

## 4. Проверка

curl http://localhost:8080/api/health  

Ответ:

{ "status": "ok" }

---

# Аутентификация

Используется JWT.

## Регистрация

POST /api/auth/register

{
  "email": "user@example.com",
  "password": "secret123",
  "first_name": "Иван",
  "last_name": "Иванов",
  "role": "procurement_specialist"
}

## Логин

POST /api/auth/login

## Использование токена

Authorization: Bearer <token>

---

# Роли

| Роль | Описание |
|------|---------|
| procurement_specialist | Закупки |
| client_manager | Работа с клиентами |
| warehouse_keeper | Склад |
| admin | Полный доступ |

---

# Основные эндпоинты

## Аутентификация

| Метод | URL |
|------|-----|
| POST | /api/auth/register |
| POST | /api/auth/login |

## Ассортимент

| Метод | URL |
|------|-----|
| GET | /api/assortment |
| GET | /api/assortment/:id |
| POST | /api/assortment |
| PUT | /api/assortment/:id |
| DELETE | /api/assortment/:id |

## Остатки

| Метод | URL |
|------|-----|
| GET | /api/stock |
| POST | /api/stock |
| PUT | /api/stock/:id |

## Клиенты

| Метод | URL |
|------|-----|
| GET | /api/clients |
| POST | /api/clients |
| PUT | /api/clients/:id |
| DELETE | /api/clients/:id |

## Поставщики

| Метод | URL |
|------|-----|
| GET | /api/suppliers |
| POST | /api/suppliers |
| PUT | /api/suppliers/:id |
| DELETE | /api/suppliers/:id |

## Заказы клиентов

| Метод | URL |
|------|-----|
| GET | /api/client-orders |
| POST | /api/client-orders |
| PUT | /api/client-orders/:id |
| DELETE | /api/client-orders/:id |

## Заказы поставщикам

| Метод | URL |
|------|-----|
| GET | /api/supplier-orders |
| POST | /api/supplier-orders |
| PUT | /api/supplier-orders/:id |
| DELETE | /api/supplier-orders/:id |

## Акции

| Метод | URL |
|------|-----|
| GET | /api/promotions |
| POST | /api/promotions |
| PUT | /api/promotions/:id |
| DELETE | /api/promotions/:id |

## Возвраты

| Метод | URL |
|------|-----|
| GET | /api/returns |
| POST | /api/returns |
| PUT | /api/returns/:id |
| DELETE | /api/returns/:id |

---

# Коды ошибок

{ "error": "описание" }

| Код | Значение |
|-----|---------|
| 400 | Неверный запрос |
| 401 | Нет авторизации |
| 403 | Нет доступа |
| 404 | Не найдено |
| 500 | Ошибка сервера |

---

# Примечание

Все эндпоинты, кроме /api/auth/* и /api/health, требуют JWT.
