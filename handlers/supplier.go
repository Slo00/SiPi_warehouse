package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetSupplierOrders обрабатывает GET /api/supplier-orders.
// Поддерживает фильтры ?status= и ?supplier_id=.
func GetSupplierOrders(c *gin.Context) {
	status := c.Query("status")
	supplierID := c.Query("supplier_id")

	query := `
		SELECT so.id, so.order_number, so.order_date, so.status, so.items_list,
		       so.supplier_id, s.name, so.expected_delivery_date::text, so.delivery_conditions
		FROM supplier_orders so
		LEFT JOIN suppliers s ON s.id = so.supplier_id
		WHERE 1=1`

	args := []interface{}{}
	argIdx := 0

	if status != "" {
		argIdx++
		query += ` AND so.status = $` + strconv.Itoa(argIdx)
		args = append(args, status)
	}
	if supplierID != "" {
		argIdx++
		query += ` AND so.supplier_id = $` + strconv.Itoa(argIdx)
		args = append(args, supplierID)
	}
	query += ` ORDER BY so.order_date DESC`

	rows, err := db.Pool.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var orders []models.SupplierOrder
	for rows.Next() {
		var o models.SupplierOrder
		rows.Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status, &o.ItemsList,
			&o.SupplierID, &o.SupplierName, &o.ExpectedDeliveryDate, &o.DeliveryConditions)
		orders = append(orders, o)
	}
	c.JSON(http.StatusOK, orders)
}

// GetSupplierOrderByID обрабатывает GET /api/supplier-orders/:id.
func GetSupplierOrderByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var o models.SupplierOrder
	err := db.Pool.QueryRow(context.Background(), `
		SELECT so.id, so.order_number, so.order_date, so.status, so.items_list,
		       so.supplier_id, s.name, so.expected_delivery_date::text, so.delivery_conditions
		FROM supplier_orders so
		LEFT JOIN suppliers s ON s.id = so.supplier_id
		WHERE so.id = $1`, id,
	).Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status, &o.ItemsList,
		&o.SupplierID, &o.SupplierName, &o.ExpectedDeliveryDate, &o.DeliveryConditions)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Заказ не найден"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// CreateSupplierOrder обрабатывает POST /api/supplier-orders.
func CreateSupplierOrder(c *gin.Context) {
	var input models.SupplierOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var o models.SupplierOrder
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO supplier_orders (order_number, status, items_list, supplier_id, expected_delivery_date, delivery_conditions)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, order_number, order_date, status, items_list, supplier_id, expected_delivery_date::text, delivery_conditions`,
		input.OrderNumber, input.Status, input.ItemsList,
		input.SupplierID, input.ExpectedDeliveryDate, input.DeliveryConditions,
	).Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status, &o.ItemsList,
		&o.SupplierID, &o.ExpectedDeliveryDate, &o.DeliveryConditions)
	c.JSON(http.StatusCreated, o)
}

// UpdateSupplierOrder обрабатывает PUT /api/supplier-orders/:id.
func UpdateSupplierOrder(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.SupplierOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var o models.SupplierOrder
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE supplier_orders
		 SET order_number=$1, status=$2, items_list=$3, supplier_id=$4,
		     expected_delivery_date=$5, delivery_conditions=$6
		 WHERE id=$7
		 RETURNING id, order_number, order_date, status, items_list, supplier_id, expected_delivery_date::text, delivery_conditions`,
		input.OrderNumber, input.Status, input.ItemsList,
		input.SupplierID, input.ExpectedDeliveryDate, input.DeliveryConditions, id,
	).Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status, &o.ItemsList,
		&o.SupplierID, &o.ExpectedDeliveryDate, &o.DeliveryConditions)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Заказ не найден"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// DeleteSupplierOrder обрабатывает DELETE /api/supplier-orders/:id.
func DeleteSupplierOrder(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM supplier_orders WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}

// GetSupplierOrderItems обрабатывает GET /api/supplier-order-items?order_id=N.
func GetSupplierOrderItems(c *gin.Context) {
	orderID := c.Query("order_id")
	rows, err := db.Pool.Query(context.Background(),
		`SELECT soi.id, soi.quantity, soi.price, soi.status, soi.assortment_id, soi.supplier_order_id, a.name
		 FROM supplier_order_items soi
		 JOIN assortment a ON a.id = soi.assortment_id
		 WHERE soi.supplier_order_id = $1`, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type ItemWithName struct {
		models.SupplierOrderItem
		ProductName string `json:"product_name"`
	}
	var items []ItemWithName
	for rows.Next() {
		var i ItemWithName
		rows.Scan(&i.ID, &i.Quantity, &i.Price, &i.Status,
			&i.AssortmentID, &i.SupplierOrderID, &i.ProductName)
		items = append(items, i)
	}
	c.JSON(http.StatusOK, items)
}

// CreateSupplierOrderItem обрабатывает POST /api/supplier-order-items.
func CreateSupplierOrderItem(c *gin.Context) {
	var input models.SupplierOrderItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var i models.SupplierOrderItem
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO supplier_order_items (quantity, price, assortment_id, supplier_order_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, quantity, price, status, assortment_id, supplier_order_id`,
		input.Quantity, input.Price, input.AssortmentID, input.SupplierOrderID,
	).Scan(&i.ID, &i.Quantity, &i.Price, &i.Status, &i.AssortmentID, &i.SupplierOrderID)
	c.JSON(http.StatusCreated, i)
}

// GetReceivedGoods обрабатывает GET /api/received-goods.
func GetReceivedGoods(c *gin.Context) {
	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, invoice_number, received_date, items_list, order_number, supplier_order_id
		 FROM received_goods ORDER BY received_date DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var goods []models.ReceivedGoods
	for rows.Next() {
		var g models.ReceivedGoods
		rows.Scan(&g.ID, &g.InvoiceNumber, &g.ReceivedDate, &g.ItemsList, &g.OrderNumber, &g.SupplierOrderID)
		goods = append(goods, g)
	}
	c.JSON(http.StatusOK, goods)
}

// CreateReceivedGoods обрабатывает POST /api/received-goods.
func CreateReceivedGoods(c *gin.Context) {
	var input models.ReceivedGoodsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var g models.ReceivedGoods
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO received_goods (invoice_number, items_list, order_number, supplier_order_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, invoice_number, received_date, items_list, order_number, supplier_order_id`,
		input.InvoiceNumber, input.ItemsList, input.OrderNumber, input.SupplierOrderID,
	).Scan(&g.ID, &g.InvoiceNumber, &g.ReceivedDate, &g.ItemsList, &g.OrderNumber, &g.SupplierOrderID)
	c.JSON(http.StatusCreated, g)
}
