package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetPromotions handles GET /api/promotions.
// Supports ?status= filter.
func GetPromotions(c *gin.Context) {
	status := c.Query("status")

	query := `SELECT id, name, start_date, end_date, conditions, discount_percent, status
	          FROM promotions WHERE 1=1`
	args := []interface{}{}
	if status != "" {
		query += ` AND status = $1`
		args = append(args, status)
	}
	query += ` ORDER BY start_date DESC`

	rows, err := db.Pool.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var promos []models.Promotion
	for rows.Next() {
		var p models.Promotion
		rows.Scan(&p.ID, &p.Name, &p.StartDate, &p.EndDate, &p.Conditions, &p.DiscountPercent, &p.Status)
		promos = append(promos, p)
	}
	c.JSON(http.StatusOK, promos)
}

// GetPromotionByID handles GET /api/promotions/:id.
func GetPromotionByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var p models.Promotion
	err := db.Pool.QueryRow(context.Background(),
		`SELECT id, name, start_date, end_date, conditions, discount_percent, status
		 FROM promotions WHERE id = $1`, id,
	).Scan(&p.ID, &p.Name, &p.StartDate, &p.EndDate, &p.Conditions, &p.DiscountPercent, &p.Status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Акция не найдена"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// CreatePromotion handles POST /api/promotions.
func CreatePromotion(c *gin.Context) {
	var input models.PromotionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Status == "" {
		input.Status = "active"
	}
	var p models.Promotion
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO promotions (name, start_date, end_date, conditions, discount_percent, status)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, name, start_date, end_date, conditions, discount_percent, status`,
		input.Name, input.StartDate, input.EndDate, input.Conditions, input.DiscountPercent, input.Status,
	).Scan(&p.ID, &p.Name, &p.StartDate, &p.EndDate, &p.Conditions, &p.DiscountPercent, &p.Status)
	c.JSON(http.StatusCreated, p)
}

// UpdatePromotion handles PUT /api/promotions/:id.
func UpdatePromotion(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.PromotionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var p models.Promotion
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE promotions SET name=$1, start_date=$2, end_date=$3,
		 conditions=$4, discount_percent=$5, status=$6
		 WHERE id=$7
		 RETURNING id, name, start_date, end_date, conditions, discount_percent, status`,
		input.Name, input.StartDate, input.EndDate,
		input.Conditions, input.DiscountPercent, input.Status, id,
	).Scan(&p.ID, &p.Name, &p.StartDate, &p.EndDate, &p.Conditions, &p.DiscountPercent, &p.Status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Акция не найдена"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// DeletePromotion handles DELETE /api/promotions/:id.
func DeletePromotion(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM promotions WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}

// GetPromotionStats handles GET /api/promotions/:id/stats.
// Returns usage statistics for the promotion.
func GetPromotionStats(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	var stats models.PromotionStats
	stats.PromotionID = id

	db.Pool.QueryRow(context.Background(), `
		SELECT COUNT(DISTINCT co.id), COALESCE(SUM(co.total_amount), 0)
		FROM client_orders co
		JOIN client_order_items coi ON coi.client_order_id = co.id
		JOIN promotion_items pi ON pi.assortment_id = coi.assortment_id AND pi.promotion_id = $1
		WHERE co.status NOT IN ('cancelled')`, id,
	).Scan(&stats.TotalOrders, &stats.TotalRevenue)

	c.JSON(http.StatusOK, stats)
}

// GetPromotionSuggestions handles GET /api/promotions/suggestions.
// Returns products that are expiring soon and suitable for a promotion.
func GetPromotionSuggestions(c *gin.Context) {
	rows, err := db.Pool.Query(context.Background(), `
		SELECT a.id, a.name, a.price, a.category, a.article,
		       a.expiry_date::text, a.description, a.min_stock_level,
		       s.total_quantity, s.last_updated
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		WHERE a.expiry_date IS NOT NULL
		  AND a.expiry_date <= CURRENT_DATE + INTERVAL '14 days'
		  AND a.expiry_date >= CURRENT_DATE
		  AND (s.total_quantity IS NULL OR s.total_quantity > 0)
		ORDER BY a.expiry_date ASC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var items []models.AssortmentWithStock
	for rows.Next() {
		var item models.AssortmentWithStock
		rows.Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
			&item.ExpiryDate, &item.Description, &item.MinStockLevel,
			&item.TotalQuantity, &item.LastUpdated)
		items = append(items, item)
	}
	c.JSON(http.StatusOK, items)
}

// GetPromotionItems handles GET /api/promotion-items?promotion_id=N.
func GetPromotionItems(c *gin.Context) {
	promoID := c.Query("promotion_id")
	rows, err := db.Pool.Query(context.Background(),
		`SELECT pi.id, pi.special_price, pi.notes, pi.assortment_id, pi.promotion_id, a.name
		 FROM promotion_items pi
		 JOIN assortment a ON a.id = pi.assortment_id
		 WHERE pi.promotion_id = $1`, promoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type ItemWithName struct {
		models.PromotionItem
		ProductName string `json:"product_name"`
	}
	var items []ItemWithName
	for rows.Next() {
		var i ItemWithName
		rows.Scan(&i.ID, &i.SpecialPrice, &i.Notes, &i.AssortmentID, &i.PromotionID, &i.ProductName)
		items = append(items, i)
	}
	c.JSON(http.StatusOK, items)
}

// CreatePromotionItem handles POST /api/promotion-items.
func CreatePromotionItem(c *gin.Context) {
	var input models.PromotionItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var i models.PromotionItem
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO promotion_items (special_price, notes, assortment_id, promotion_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, special_price, notes, assortment_id, promotion_id`,
		input.SpecialPrice, input.Notes, input.AssortmentID, input.PromotionID,
	).Scan(&i.ID, &i.SpecialPrice, &i.Notes, &i.AssortmentID, &i.PromotionID)
	c.JSON(http.StatusCreated, i)
}
