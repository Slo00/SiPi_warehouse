-- ============================================================
-- PostgreSQL Schema — Складская система
-- Чистый PostgreSQL + своя аутентификация (bcrypt)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ПОЛЬЗОВАТЕЛИ И АУТЕНТИФИКАЦИЯ
-- ============================================================
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'warehouse_keeper', -- procurement_specialist | client_manager | warehouse_keeper | admin
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- ПОСТАВЩИКИ
-- ============================================================
CREATE TABLE suppliers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    contact_info TEXT,
    phone TEXT,
    email TEXT
);

-- ============================================================
-- КЛИЕНТЫ
-- ============================================================
CREATE TABLE clients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    company TEXT
);

-- ============================================================
-- 1. АССОРТИМЕНТ В НАЛИЧИИ
-- ============================================================
CREATE TABLE assortment (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    category TEXT,
    article TEXT UNIQUE,
    expiry_date DATE,
    description TEXT,
    min_stock_level INT NOT NULL DEFAULT 0
);

-- ============================================================
-- 2. ОСТАТКИ НА СКЛАДЕ
-- ============================================================
CREATE TABLE stock (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    total_quantity INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    assortment_id BIGINT NOT NULL REFERENCES assortment(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. АКЦИИ
-- ============================================================
CREATE TABLE promotions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    conditions TEXT,
    discount_percent NUMERIC(5, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' -- active | inactive | expired
);

-- ============================================================
-- 4. ТОВАРЫ В АКЦИИ
-- ============================================================
CREATE TABLE promotion_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    special_price NUMERIC(10, 2),
    notes TEXT,
    assortment_id BIGINT NOT NULL REFERENCES assortment(id) ON DELETE CASCADE,
    promotion_id BIGINT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE
);

-- ============================================================
-- 5. ЗАКАЗЫ У ПОСТАВЩИКА
-- ============================================================
CREATE TABLE supplier_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'new',
    items_list TEXT,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    expected_delivery_date DATE,
    delivery_conditions TEXT
);

-- ============================================================
-- 6. ПОЗИЦИИ ЗАКАЗА У ПОСТАВЩИКА
-- ============================================================
CREATE TABLE supplier_order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    assortment_id BIGINT NOT NULL REFERENCES assortment(id) ON DELETE CASCADE,
    supplier_order_id BIGINT NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE
);

-- ============================================================
-- 7. ПОСТУПИВШИЕ ТОВАРЫ
-- ============================================================
CREATE TABLE received_goods (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    items_list TEXT,
    order_number TEXT,
    supplier_order_id BIGINT REFERENCES supplier_orders(id) ON DELETE SET NULL
);

-- ============================================================
-- 8. ЗАКАЗЫ КЛИЕНТА
-- ============================================================
CREATE TABLE client_orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'new', -- new | confirmed | processing | completed | cancelled
    total_amount NUMERIC(12, 2) DEFAULT 0,
    items_list TEXT,
    source TEXT,
    client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
    delivery_method TEXT
);

-- ============================================================
-- 9. ПОЗИЦИИ ЗАКАЗА У КЛИЕНТА
-- ============================================================
CREATE TABLE client_order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    quantity INT NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    assortment_id BIGINT NOT NULL REFERENCES assortment(id) ON DELETE CASCADE,
    client_order_id BIGINT NOT NULL REFERENCES client_orders(id) ON DELETE CASCADE
);

-- ============================================================
-- 10. ВОЗВРАТЫ
-- ============================================================
CREATE TABLE returns (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    return_number TEXT NOT NULL UNIQUE,
    return_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_number TEXT,
    items_list TEXT,
    reason TEXT,
    client_order_id BIGINT REFERENCES client_orders(id) ON DELETE SET NULL
);

-- ============================================================
-- 11. ПРОДАЖИ (для прогнозирования спроса)
-- ============================================================
CREATE TABLE sales (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assortment_id BIGINT NOT NULL REFERENCES assortment(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    client_order_id BIGINT REFERENCES client_orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_sales_assortment ON sales(assortment_id);
CREATE INDEX idx_sales_date ON sales(sale_date);

-- ============================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- ============================================================

INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
    'admin@warehouse.local',
    crypt('admin123', gen_salt('bf')),
    'Администратор',
    'Системы',
    'admin'
);

INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
    'procurement@warehouse.local',
    crypt('test123', gen_salt('bf')),
    'Иван',
    'Петров',
    'procurement_specialist'
),
(
    'manager@warehouse.local',
    crypt('test123', gen_salt('bf')),
    'Анна',
    'Сидорова',
    'client_manager'
),
(
    'warehouse@warehouse.local',
    crypt('test123', gen_salt('bf')),
    'Сергей',
    'Козлов',
    'warehouse_keeper'
);

INSERT INTO suppliers (name, contact_info, phone, email) VALUES
    ('ООО ТехСнаб', 'Москва, ул. Промышленная 1', '+7 495 100-00-01', 'techsnab@example.com'),
    ('ИП Комплект', 'СПб, пр. Заводской 5', '+7 812 200-00-02', 'komplekt@example.com');

INSERT INTO clients (name, phone, email, company) VALUES
    ('Алексей Смирнов', '+7 916 300-00-01', 'smirnov@example.com', 'ООО Ромашка'),
    ('Мария Иванова', '+7 926 300-00-02', 'ivanova@example.com', 'ИП Иванова');

INSERT INTO assortment (name, price, category, article, expiry_date, description, min_stock_level) VALUES
    ('Ноутбук Lenovo ThinkPad', 75000.00, 'Электроника', 'LEN-TP-001', NULL, 'Ноутбук для корпоративного использования', 5),
    ('Мышь Logitech MX Master', 7500.00, 'Периферия', 'LOG-MX-001', NULL, 'Беспроводная мышь премиум-класса', 10),
    ('Клавиатура Keychron K2', 9000.00, 'Периферия', 'KEY-K2-001', NULL, 'Механическая клавиатура', 8),
    ('Антисептик 500мл', 350.00, 'Расходники', 'ANT-500-001', '2025-06-01', 'Антисептик для рук', 20),
    ('Бумага А4 500л', 600.00, 'Канцелярия', 'PAP-A4-001', '2026-01-01', 'Офисная бумага', 15);

INSERT INTO stock (total_quantity, assortment_id) VALUES
    (15, 1), (42, 2), (28, 3), (3, 4), (50, 5);

INSERT INTO sales (assortment_id, quantity, sale_date) VALUES
    (1, 2, CURRENT_DATE - 170), (1, 1, CURRENT_DATE - 140), (1, 3, CURRENT_DATE - 110),
    (1, 2, CURRENT_DATE - 80),  (1, 1, CURRENT_DATE - 50),  (1, 4, CURRENT_DATE - 20),
    (2, 5, CURRENT_DATE - 160), (2, 3, CURRENT_DATE - 120), (2, 7, CURRENT_DATE - 90),
    (2, 4, CURRENT_DATE - 60),  (2, 6, CURRENT_DATE - 30),  (2, 5, CURRENT_DATE - 5),
    (3, 1, CURRENT_DATE - 150), (3, 2, CURRENT_DATE - 100), (3, 3, CURRENT_DATE - 60),
    (3, 1, CURRENT_DATE - 30),  (3, 2, CURRENT_DATE - 10);
