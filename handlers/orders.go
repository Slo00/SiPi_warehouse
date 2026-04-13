package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetClientOrders обрабатывает GET /api/client-orders.
// Поддерживает фильтр ?status=.
func GetClientOrders(c *gin.Context) {
	status := c.Query("status")

	query := `
		SELECT co.id, co.order_number, co.order_date, co.status,
		       co.total_amount, co.items_list, co.source,
		       co.client_id, cl.name, co.delivery_method
		FROM client_orders co
		LEFT JOIN clients cl ON cl.id = co.client_id
		WHERE 1=1`

	args := []interface{}{}
	if status != "" {
		query += ` AND co.status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY co.order_date DESC`

	rows, err := db.Pool.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var orders []models.ClientOrder
	for rows.Next() {
		var o models.ClientOrder
		rows.Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status,
			&o.TotalAmount, &o.ItemsList, &o.Source,
			&o.ClientID, &o.ClientName, &o.DeliveryMethod)
		orders = append(orders, o)
	}
	c.JSON(http.StatusOK, orders)
}

// GetClientOrderByID обрабатывает GET /api/client-orders/:id.
func GetClientOrderByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var o models.ClientOrder
	err := db.Pool.QueryRow(context.Background(), `
		SELECT co.id, co.order_number, co.order_date, co.status,
		       co.total_amount, co.items_list, co.source,
		       co.client_id, cl.name, co.delivery_method
		FROM client_orders co
		LEFT JOIN clients cl ON cl.id = co.client_id
		WHERE co.id = $1`, id,
	).Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status,
		&o.TotalAmount, &o.ItemsList, &o.Source,
		&o.ClientID, &o.ClientName, &o.DeliveryMethod)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Заказ не найден"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// CreateClientOrder обрабатывает POST /api/client-orders.
func CreateClientOrder(c *gin.Context) {
	var input models.ClientOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var o models.ClientOrder
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO client_orders (order_number, status, total_amount, items_list, source, client_id, delivery_method)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, order_number, order_date, status, total_amount, items_list, source, client_id, delivery_method`,
		input.OrderNumber, input.Status, input.TotalAmount, input.ItemsList,
		input.Source, input.ClientID, input.DeliveryMethod,
	).Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status,
		&o.TotalAmount, &o.ItemsList, &o.Source, &o.ClientID, &o.DeliveryMethod)
	c.JSON(http.StatusCreated, o)
}

// UpdateClientOrder обрабатывает PUT /api/client-orders/:id.
func UpdateClientOrder(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.ClientOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var o models.ClientOrder
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE client_orders
		 SET order_number=$1, status=$2, total_amount=$3, items_list=$4,
		     source=$5, client_id=$6, delivery_method=$7
		 WHERE id=$8
		 RETURNING id, order_number, order_date, status, total_amount, items_list, source, client_id, delivery_method`,
		input.OrderNumber, input.Status, input.TotalAmount, input.ItemsList,
		input.Source, input.ClientID, input.DeliveryMethod, id,
	).Scan(&o.ID, &o.OrderNumber, &o.OrderDate, &o.Status,
		&o.TotalAmount, &o.ItemsList, &o.Source, &o.ClientID, &o.DeliveryMethod)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Заказ не найден"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// ConfirmClientOrder обрабатывает POST /api/client-orders/:id/confirm.
// Переводит статус заказа в "confirmed".
func ConfirmClientOrder(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var o models.ClientOrder
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE client_orders SET status='confirmed'
		 WHERE id=$1 AND status='new'
		 RETURNING id, order_number, status`,
		id,
	).Scan(&o.ID, &o.OrderNumber, &o.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Заказ не найден или уже обработан"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// RejectClientOrder обрабатывает POST /api/client-orders/:id/reject.
// Переводит статус заказа в "cancelled".
func RejectClientOrder(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var o models.ClientOrder
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE client_orders SET status='cancelled'
		 WHERE id=$1 AND status IN ('new','confirmed')
		 RETURNING id, order_number, status`,
		id,
	).Scan(&o.ID, &o.OrderNumber, &o.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Заказ не найден или не может быть отменён"})
		return
	}
	c.JSON(http.StatusOK, o)
}

// DeleteClientOrder обрабатывает DELETE /api/client-orders/:id.
func DeleteClientOrder(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM client_orders WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}

// GetClientOrderItems обрабатывает GET /api/client-order-items?order_id=N.
func GetClientOrderItems(c *gin.Context) {
	orderID := c.Query("order_id")
	rows, err := db.Pool.Query(context.Background(),
		`SELECT coi.id, coi.quantity, coi.price, coi.status, coi.assortment_id, coi.client_order_id, a.name
		 FROM client_order_items coi
		 JOIN assortment a ON a.id = coi.assortment_id
		 WHERE coi.client_order_id = $1`, orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type ItemWithName struct {
		models.ClientOrderItem
		ProductName string `json:"product_name"`
	}
	var items []ItemWithName
	for rows.Next() {
		var i ItemWithName
		rows.Scan(&i.ID, &i.Quantity, &i.Price, &i.Status,
			&i.AssortmentID, &i.ClientOrderID, &i.ProductName)
		items = append(items, i)
	}
	c.JSON(http.StatusOK, items)
}

// CreateClientOrderItem обрабатывает POST /api/client-order-items.
func CreateClientOrderItem(c *gin.Context) {
	var input models.ClientOrderItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var i models.ClientOrderItem
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO client_order_items (quantity, price, assortment_id, client_order_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, quantity, price, status, assortment_id, client_order_id`,
		input.Quantity, input.Price, input.AssortmentID, input.ClientOrderID,
	).Scan(&i.ID, &i.Quantity, &i.Price, &i.Status, &i.AssortmentID, &i.ClientOrderID)
	c.JSON(http.StatusCreated, i)
}
