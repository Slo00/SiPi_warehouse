package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetStock обрабатывает GET /api/stock.
// Поддерживает ?filter=expiring и ?filter=expired для фильтрации по сроку годности.
// Поддерживает ?category= для фильтрации по категории.
func GetStock(c *gin.Context) {
	filter := c.Query("filter")
	category := c.Query("category")

	query := `
		SELECT s.id, s.total_quantity, s.last_updated, s.assortment_id,
		       a.name, a.article, a.expiry_date::text, a.min_stock_level, a.category
		FROM stock s
		JOIN assortment a ON a.id = s.assortment_id
		WHERE 1=1`

	args := []interface{}{}
	argIdx := 0

	if filter == "expiring" {
		query += ` AND a.expiry_date IS NOT NULL AND a.expiry_date <= CURRENT_DATE + INTERVAL '3 days' AND a.expiry_date >= CURRENT_DATE`
	} else if filter == "expired" {
		query += ` AND a.expiry_date IS NOT NULL AND a.expiry_date < CURRENT_DATE`
	}

	if category != "" {
		argIdx++
		query += ` AND a.category ILIKE $` + strconv.Itoa(argIdx)
		args = append(args, "%"+category+"%")
	}

	query += ` ORDER BY a.name`

	rows, err := db.Pool.Query(context.Background(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type StockFull struct {
		models.Stock
		ProductName    string  `json:"product_name"`
		ProductArticle string  `json:"product_article"`
		ExpiryDate     *string `json:"expiry_date"`
		MinStockLevel  int     `json:"min_stock_level"`
		Category       string  `json:"category"`
	}

	var items []StockFull
	for rows.Next() {
		var s StockFull
		rows.Scan(&s.ID, &s.TotalQuantity, &s.LastUpdated, &s.AssortmentID,
			&s.ProductName, &s.ProductArticle, &s.ExpiryDate, &s.MinStockLevel, &s.Category)
		items = append(items, s)
	}
	c.JSON(http.StatusOK, items)
}

// CreateStock обрабатывает POST /api/stock.
func CreateStock(c *gin.Context) {
	var input models.StockInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var s models.Stock
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO stock (total_quantity, assortment_id)
		 VALUES ($1, $2) RETURNING id, total_quantity, last_updated, assortment_id`,
		input.TotalQuantity, input.AssortmentID,
	).Scan(&s.ID, &s.TotalQuantity, &s.LastUpdated, &s.AssortmentID)
	c.JSON(http.StatusCreated, s)
}

// UpdateStock обрабатывает PUT /api/stock/:id.
func UpdateStock(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.StockInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var s models.Stock
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE stock SET total_quantity=$1, last_updated=now()
		 WHERE id=$2 RETURNING id, total_quantity, last_updated, assortment_id`,
		input.TotalQuantity, id,
	).Scan(&s.ID, &s.TotalQuantity, &s.LastUpdated, &s.AssortmentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Запись не найдена"})
		return
	}
	c.JSON(http.StatusOK, s)
}

// GetStockForecast обрабатывает GET /api/stock/forecast.
// Возвращает прогноз спроса по каждому товару на основе продаж за последние 6 месяцев.
func GetStockForecast(c *gin.Context) {
	rows, err := db.Pool.Query(context.Background(), `
		WITH monthly AS (
			SELECT assortment_id,
			       to_char(date_trunc('month', sale_date), 'YYYY-MM') AS month,
			       SUM(quantity) AS qty
			FROM sales
			WHERE sale_date >= CURRENT_DATE - INTERVAL '6 months'
			GROUP BY assortment_id, month
		),
		avg_sales AS (
			SELECT assortment_id, AVG(qty) AS avg_qty
			FROM monthly
			GROUP BY assortment_id
		)
		SELECT a.id, a.name, COALESCE(s.total_quantity, 0), COALESCE(av.avg_qty, 0)
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		LEFT JOIN avg_sales av ON av.assortment_id = a.id
		ORDER BY a.name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var result []models.RecommendedOrder
	for rows.Next() {
		var r models.RecommendedOrder
		rows.Scan(&r.AssortmentID, &r.ProductName, &r.CurrentStock, &r.AvgMonthlySale)
		r.Recommended = int(r.AvgMonthlySale*2) - r.CurrentStock
		if r.Recommended < 0 {
			r.Recommended = 0
		}
		result = append(result, r)
	}
	c.JSON(http.StatusOK, result)
}
