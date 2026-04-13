// Пакет models определяет структуры данных всех доменных сущностей
// складского API.
package models

import "time"

// ==================== Пользователи ====================

// User представляет пользователя системы с учётными данными и ролью.
type User struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Role      string    `json:"role"` // procurement_specialist | client_manager | warehouse_keeper | admin
	Phone     string    `json:"phone"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`

	PasswordHash string `json:"-"`
}

// RegisterInput — тело запроса для POST /api/auth/register.
type RegisterInput struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Phone     string `json:"phone"`
	Role      string `json:"role"` // procurement_specialist | client_manager | warehouse_keeper
}

// LoginInput — тело запроса для POST /api/auth/login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ==================== Поставщики ====================

// Supplier представляет поставщика товаров.
type Supplier struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	ContactInfo string `json:"contact_info"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
}

// SupplierInput — тело запроса для создания или обновления поставщика.
type SupplierInput struct {
	Name        string `json:"name" binding:"required"`
	ContactInfo string `json:"contact_info"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
}

// ==================== Клиенты ====================

// Client представляет клиента, оформляющего заказы.
type Client struct {
	ID      int64  `json:"id"`
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Company string `json:"company"`
}

// ClientInput — тело запроса для создания или обновления клиента.
type ClientInput struct {
	Name    string `json:"name" binding:"required"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Company string `json:"company"`
}

// ==================== Ассортимент ====================

// Assortment представляет единицу товарного ассортимента склада.
type Assortment struct {
	ID            int64   `json:"id"`
	Name          string  `json:"name"`
	Price         float64 `json:"price"`
	Category      string  `json:"category"`
	Article       string  `json:"article"`
	ExpiryDate    *string `json:"expiry_date"`    // срок годности в формате YYYY-MM-DD
	Description   string  `json:"description"`
	MinStockLevel int     `json:"min_stock_level"` // минимальный допустимый остаток
}

// AssortmentWithStock расширяет Assortment данными об остатках на складе.
type AssortmentWithStock struct {
	Assortment
	TotalQuantity *int       `json:"total_quantity"`
	LastUpdated   *time.Time `json:"last_updated"`
}

// AssortmentInput — тело запроса для создания или обновления товара.
type AssortmentInput struct {
	Name          string  `json:"name" binding:"required"`
	Price         float64 `json:"price" binding:"required"`
	Category      string  `json:"category"`
	Article       string  `json:"article"`
	ExpiryDate    *string `json:"expiry_date"`
	Description   string  `json:"description"`
	MinStockLevel int     `json:"min_stock_level"`
}

// SalePoint — одна точка данных на графике продаж (месяц и количество).
type SalePoint struct {
	Month    string `json:"month"`
	Quantity int    `json:"quantity"`
}

// ==================== Остатки на складе ====================

// Stock представляет запись об остатке конкретного товара на складе.
type Stock struct {
	ID            int64     `json:"id"`
	TotalQuantity int       `json:"total_quantity"`
	LastUpdated   time.Time `json:"last_updated"`
	AssortmentID  int64     `json:"assortment_id"`
}

// StockInput — тело запроса для создания или обновления остатка.
type StockInput struct {
	TotalQuantity int   `json:"total_quantity" binding:"required"`
	AssortmentID  int64 `json:"assortment_id" binding:"required"`
}

// ForecastPoint — точка прогноза спроса: месяц, фактические и прогнозные продажи.
type ForecastPoint struct {
	Month    string  `json:"month"`
	Actual   *int    `json:"actual"`
	Forecast float64 `json:"forecast"`
}

// ==================== Акции ====================

// Promotion представляет скидочную акцию на товары.
type Promotion struct {
	ID              int64   `json:"id"`
	Name            string  `json:"name"`
	StartDate       string  `json:"start_date"`
	EndDate         string  `json:"end_date"`
	Conditions      string  `json:"conditions"`
	DiscountPercent float64 `json:"discount_percent"`
	Status          string  `json:"status"` // active | inactive | expired
}

// PromotionInput — тело запроса для создания или обновления акции.
type PromotionInput struct {
	Name            string  `json:"name" binding:"required"`
	StartDate       string  `json:"start_date" binding:"required"`
	EndDate         string  `json:"end_date" binding:"required"`
	Conditions      string  `json:"conditions"`
	DiscountPercent float64 `json:"discount_percent"`
	Status          string  `json:"status"`
}

// PromotionStats содержит статистику использования акции.
type PromotionStats struct {
	PromotionID  int64       `json:"promotion_id"`
	TotalOrders  int         `json:"total_orders"`
	TotalRevenue float64     `json:"total_revenue"`
	UsageByMonth []SalePoint `json:"usage_by_month"`
}

// ==================== Товары в акции ====================

// PromotionItem связывает товар с акцией и хранит специальную цену.
type PromotionItem struct {
	ID           int64   `json:"id"`
	SpecialPrice float64 `json:"special_price"`
	Notes        string  `json:"notes"`
	AssortmentID int64   `json:"assortment_id"`
	PromotionID  int64   `json:"promotion_id"`
}

// PromotionItemInput — тело запроса для добавления товара в акцию.
type PromotionItemInput struct {
	SpecialPrice float64 `json:"special_price"`
	Notes        string  `json:"notes"`
	AssortmentID int64   `json:"assortment_id" binding:"required"`
	PromotionID  int64   `json:"promotion_id" binding:"required"`
}

// ==================== Заказы клиента ====================

// ClientOrder представляет заказ, оформленный клиентом.
type ClientOrder struct {
	ID             int64   `json:"id"`
	OrderNumber    string  `json:"order_number"`
	OrderDate      string  `json:"order_date"`
	Status         string  `json:"status"` // new | confirmed | processing | completed | cancelled
	TotalAmount    float64 `json:"total_amount"`
	ItemsList      string  `json:"items_list"`
	Source         string  `json:"source"`
	ClientID       *int64  `json:"client_id"`
	ClientName     *string `json:"client_name"`
	DeliveryMethod string  `json:"delivery_method"`
}

// ClientOrderInput — тело запроса для создания или обновления заказа клиента.
type ClientOrderInput struct {
	OrderNumber    string  `json:"order_number" binding:"required"`
	Status         string  `json:"status"`
	TotalAmount    float64 `json:"total_amount"`
	ItemsList      string  `json:"items_list"`
	Source         string  `json:"source"`
	ClientID       *int64  `json:"client_id"`
	DeliveryMethod string  `json:"delivery_method"`
}

// ==================== Позиции заказа клиента ====================

// ClientOrderItem представляет одну позицию в заказе клиента.
type ClientOrderItem struct {
	ID            int64   `json:"id"`
	Quantity      int     `json:"quantity"`
	Price         float64 `json:"price"`
	Status        string  `json:"status"`
	AssortmentID  int64   `json:"assortment_id"`
	ClientOrderID int64   `json:"client_order_id"`
}

// ClientOrderItemInput — тело запроса для добавления позиции в заказ клиента.
type ClientOrderItemInput struct {
	Quantity      int     `json:"quantity" binding:"required"`
	Price         float64 `json:"price" binding:"required"`
	AssortmentID  int64   `json:"assortment_id" binding:"required"`
	ClientOrderID int64   `json:"client_order_id" binding:"required"`
}

// ==================== Заказы у поставщика ====================

// SupplierOrder представляет заказ товаров у поставщика.
type SupplierOrder struct {
	ID                   int64   `json:"id"`
	OrderNumber          string  `json:"order_number"`
	OrderDate            string  `json:"order_date"`
	Status               string  `json:"status"`
	ItemsList            string  `json:"items_list"`
	SupplierID           *int64  `json:"supplier_id"`
	SupplierName         *string `json:"supplier_name"`
	ExpectedDeliveryDate *string `json:"expected_delivery_date"`
	DeliveryConditions   string  `json:"delivery_conditions"`
}

// SupplierOrderInput — тело запроса для создания или обновления заказа поставщику.
type SupplierOrderInput struct {
	OrderNumber          string  `json:"order_number" binding:"required"`
	Status               string  `json:"status"`
	ItemsList            string  `json:"items_list"`
	SupplierID           *int64  `json:"supplier_id"`
	ExpectedDeliveryDate *string `json:"expected_delivery_date"`
	DeliveryConditions   string  `json:"delivery_conditions"`
}

// ==================== Позиции заказа у поставщика ====================

// SupplierOrderItem представляет одну позицию в заказе поставщику.
type SupplierOrderItem struct {
	ID              int64   `json:"id"`
	Quantity        int     `json:"quantity"`
	Price           float64 `json:"price"`
	Status          string  `json:"status"`
	AssortmentID    int64   `json:"assortment_id"`
	SupplierOrderID int64   `json:"supplier_order_id"`
}

// SupplierOrderItemInput — тело запроса для добавления позиции в заказ поставщику.
type SupplierOrderItemInput struct {
	Quantity        int     `json:"quantity" binding:"required"`
	Price           float64 `json:"price" binding:"required"`
	AssortmentID    int64   `json:"assortment_id" binding:"required"`
	SupplierOrderID int64   `json:"supplier_order_id" binding:"required"`
}

// ==================== Поступившие товары ====================

// ReceivedGoods фиксирует факт приёмки товара на склад.
type ReceivedGoods struct {
	ID              int64  `json:"id"`
	InvoiceNumber   string `json:"invoice_number"`
	ReceivedDate    string `json:"received_date"`
	ItemsList       string `json:"items_list"`
	OrderNumber     string `json:"order_number"`
	SupplierOrderID *int64 `json:"supplier_order_id"`
}

// ReceivedGoodsInput — тело запроса для регистрации поступления товаров.
type ReceivedGoodsInput struct {
	InvoiceNumber   string `json:"invoice_number" binding:"required"`
	ItemsList       string `json:"items_list"`
	OrderNumber     string `json:"order_number"`
	SupplierOrderID *int64 `json:"supplier_order_id"`
}

// ==================== Возвраты ====================

// Return представляет возврат товара от клиента.
type Return struct {
	ID            int64  `json:"id"`
	ReturnNumber  string `json:"return_number"`
	ReturnDate    string `json:"return_date"`
	OrderNumber   string `json:"order_number"`
	ItemsList     string `json:"items_list"`
	Reason        string `json:"reason"`
	ClientOrderID *int64 `json:"client_order_id"`
}

// ReturnInput — тело запроса для создания или обновления возврата.
type ReturnInput struct {
	ReturnNumber  string `json:"return_number" binding:"required"`
	OrderNumber   string `json:"order_number"`
	ItemsList     string `json:"items_list"`
	Reason        string `json:"reason"`
	ClientOrderID *int64 `json:"client_order_id"`
}

// ==================== Дашборды ====================

// ProcurementDashboard — данные дашборда специалиста по закупкам.
type ProcurementDashboard struct {
	ExpiringProducts  []AssortmentWithStock `json:"expiring_products"`
	LowStockProducts  []AssortmentWithStock `json:"low_stock_products"`
	RecommendedOrders []RecommendedOrder    `json:"recommended_orders"`
}

// ManagerDashboard — данные дашборда менеджера по работе с клиентами.
type ManagerDashboard struct {
	PendingOrders      []ClientOrder         `json:"pending_orders"`
	ExpiringPromoItems []AssortmentWithStock  `json:"expiring_promo_items"`
}

// WarehouseDashboard — данные дашборда кладовщика.
type WarehouseDashboard struct {
	ExpectedDeliveries []SupplierOrder      `json:"expected_deliveries"`
	OrdersReadyToPick  []ClientOrder        `json:"orders_ready_to_pick"`
	ExpiredProducts    []AssortmentWithStock `json:"expired_products"`
}

// RecommendedOrder — рекомендация к закупке, рассчитанная на основе истории продаж.
type RecommendedOrder struct {
	AssortmentID   int64   `json:"assortment_id"`
	ProductName    string  `json:"product_name"`
	CurrentStock   int     `json:"current_stock"`
	AvgMonthlySale float64 `json:"avg_monthly_sale"`
	Recommended    int     `json:"recommended_quantity"`
}
