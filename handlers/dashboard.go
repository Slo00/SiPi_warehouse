package handlers

import (
	"context"
	"net/http"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetProcurementDashboard handles GET /api/dashboard/procurement.
// Returns data for the procurement specialist dashboard:
// expiring products, critically low stock, and recommended orders.
func GetProcurementDashboard(c *gin.Context) {
	dashboard := models.ProcurementDashboard{}

	// Товары с истекающим сроком (в течение 3 дней)
	rows, _ := db.Pool.Query(context.Background(), `
		SELECT a.id, a.name, a.price, a.category, a.article,
		       a.expiry_date::text, a.description, a.min_stock_level,
		       s.total_quantity, s.last_updated
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		WHERE a.expiry_date IS NOT NULL
		  AND a.expiry_date <= CURRENT_DATE + INTERVAL '3 days'
		  AND a.expiry_date >= CURRENT_DATE
		ORDER BY a.expiry_date ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var item models.AssortmentWithStock
			rows.Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
				&item.ExpiryDate, &item.Description, &item.MinStockLevel,
				&item.TotalQuantity, &item.LastUpdated)
			dashboard.ExpiringProducts = append(dashboard.ExpiringProducts, item)
		}
		rows.Close()
	}

	// Критически низкие остатки
	rows, _ = db.Pool.Query(context.Background(), `
		SELECT a.id, a.name, a.price, a.category, a.article,
		       a.expiry_date::text, a.description, a.min_stock_level,
		       s.total_quantity, s.last_updated
		FROM assortment a
		JOIN stock s ON s.assortment_id = a.id
		WHERE s.total_quantity <= a.min_stock_level
		ORDER BY s.total_quantity ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var item models.AssortmentWithStock
			rows.Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
				&item.ExpiryDate, &item.Description, &item.MinStockLevel,
				&item.TotalQuantity, &item.LastUpdated)
			dashboard.LowStockProducts = append(dashboard.LowStockProducts, item)
		}
		rows.Close()
	}

	// Рекомендуемые закупки
	rows, _ = db.Pool.Query(context.Background(), `
		WITH avg_sales AS (
			SELECT assortment_id, AVG(quantity) AS avg_qty
			FROM sales
			WHERE sale_date >= CURRENT_DATE - INTERVAL '3 months'
			GROUP BY assortment_id
		)
		SELECT a.id, a.name, COALESCE(s.total_quantity, 0), COALESCE(av.avg_qty, 0)
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		LEFT JOIN avg_sales av ON av.assortment_id = a.id
		WHERE COALESCE(s.total_quantity, 0) < COALESCE(av.avg_qty, 0) * 2
		ORDER BY (COALESCE(av.avg_qty, 0) * 2 - COALESCE(s.total_quantity, 0)) DESC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var r models.RecommendedOrder
			rows.Scan(&r.AssortmentID, &r.ProductName, &r.CurrentStock, &r.AvgMonthlySale)
			r.Recommended = int(r.AvgMonthlySale*2) - r.CurrentStock
			if r.Recommended < 0 {
				r.Recommended = 0
			}
			dashboard.RecommendedOrders = append(dashboard.RecommendedOrders, r)
		}
		rows.Close()
	}

	c.JSON(http.StatusOK, dashboard)
}

// GetManagerDashboard handles GET /api/dashboard/manager.
// Returns data for the client manager dashboard:
// orders awaiting confirmation and expiring promo items.
func GetManagerDashboard(c *gin.Context) {
	dashboard := models.ManagerDashboard{}

	// Заказы, ожидающие подтверждения
	rows, _ := db.Pool.Query(context.Background(), `
		SELECT co.id, co.order_number, co.order_date, co.status,
		       co.total_amount, co.items_list, co.source,
		       co.client_id, cl.name, co.delivery_method
		FROM client_orders co
		LEFT JOIN clients cl ON cl.id = co.client_id
		WHERE co.status = 'new'
		ORDER BY co.order_date ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var o models.ClientOrder
			rows.Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status,
				&o.TotalAmount, &o.ItemsList, &o.Source,
				&o.ClientID, &o.ClientName, &o.DeliveryMethod)
			dashboard.PendingOrders = append(dashboard.PendingOrders, o)
		}
		rows.Close()
	}

	// Товары для акций с истекающим сроком
	rows, _ = db.Pool.Query(context.Background(), `
		SELECT a.id, a.name, a.price, a.category, a.article,
		       a.expiry_date::text, a.description, a.min_stock_level,
		       s.total_quantity, s.last_updated
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		WHERE a.expiry_date IS NOT NULL
		  AND a.expiry_date <= CURRENT_DATE + INTERVAL '14 days'
		  AND a.expiry_date >= CURRENT_DATE
		ORDER BY a.expiry_date ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var item models.AssortmentWithStock
			rows.Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
				&item.ExpiryDate, &item.Description, &item.MinStockLevel,
				&item.TotalQuantity, &item.LastUpdated)
			dashboard.ExpiringPromoItems = append(dashboard.ExpiringPromoItems, item)
		}
		rows.Close()
	}

	c.JSON(http.StatusOK, dashboard)
}

// GetWarehouseDashboard handles GET /api/dashboard/warehouse.
// Returns data for the warehouse keeper dashboard:
// expected deliveries, orders ready to pick, and expired products.
func GetWarehouseDashboard(c *gin.Context) {
	dashboard := models.WarehouseDashboard{}

	// Ожидаемые поступления от поставщиков
	rows, _ := db.Pool.Query(context.Background(), `
		SELECT so.id, so.order_number, so.order_date, so.status, so.items_list,
		       so.supplier_id, s.name, so.expected_delivery_date::text, so.delivery_conditions
		FROM supplier_orders so
		LEFT JOIN suppliers s ON s.id = so.supplier_id
		WHERE so.status NOT IN ('completed', 'cancelled')
		  AND so.expected_delivery_date IS NOT NULL
		ORDER BY so.expected_delivery_date ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var o models.SupplierOrder
			rows.Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status, &o.ItemsList,
				&o.SupplierID, &o.SupplierName, &o.ExpectedDeliveryDate, &o.DeliveryConditions)
			dashboard.ExpectedDeliveries = append(dashboard.ExpectedDeliveries, o)
		}
		rows.Close()
	}

	// Заказы, готовые к сборке (confirmed)
	rows, _ = db.Pool.Query(context.Background(), `
		SELECT co.id, co.order_number, co.order_date, co.status,
		       co.total_amount, co.items_list, co.source,
		       co.client_id, cl.name, co.delivery_method
		FROM client_orders co
		LEFT JOIN clients cl ON cl.id = co.client_id
		WHERE co.status = 'confirmed'
		ORDER BY co.order_date ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var o models.ClientOrder
			rows.Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status,
				&o.TotalAmount, &o.ItemsList, &o.Source,
				&o.ClientID, &o.ClientName, &o.DeliveryMethod)
			dashboard.OrdersReadyToPick = append(dashboard.OrdersReadyToPick, o)
		}
		rows.Close()
	}

	// Просроченные товары
	rows, _ = db.Pool.Query(context.Background(), `
		SELECT a.id, a.name, a.price, a.category, a.article,
		       a.expiry_date::text, a.description, a.min_stock_level,
		       s.total_quantity, s.last_updated
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		WHERE a.expiry_date IS NOT NULL AND a.expiry_date < CURRENT_DATE
		ORDER BY a.expiry_date ASC
		LIMIT 10`)
	if rows != nil {
		for rows.Next() {
			var item models.AssortmentWithStock
			rows.Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
				&item.ExpiryDate, &item.Description, &item.MinStockLevel,
				&item.TotalQuantity, &item.LastUpdated)
			dashboard.ExpiredProducts = append(dashboard.ExpiredProducts, item)
		}
		rows.Close()
	}

	c.JSON(http.StatusOK, dashboard)
}
