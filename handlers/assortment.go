package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetAssortment обрабатывает GET /api/assortment.
// Поддерживает ?filter=expiring (срок годности в течение 3 дней), ?filter=low_stock и ?filter=expired.
// Также поддерживает ?category= для фильтрации по категории.
func GetAssortment(c *gin.Context) {
	filter := c.Query("filter")
	category := c.Query("category")

	query := `
		SELECT a.id, a.name, a.price, a.category, a.article,
		       a.expiry_date::text, a.description, a.min_stock_level,
		       s.total_quantity, s.last_updated
		FROM assortment a
		LEFT JOIN stock s ON s.assortment_id = a.id
		WHERE 1=1`

	args := []interface{}{}
	argIdx := 1

	if filter == "expiring" {
		query += ` AND a.expiry_date IS NOT NULL AND a.expiry_date <= CURRENT_DATE + INTERVAL '3 days' AND a.expiry_date >= CURRENT_DATE`
	} else if filter == "low_stock" {
		query += ` AND s.total_quantity IS NOT NULL AND s.total_quantity <= a.min_stock_level`
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

	var items []models.AssortmentWithStock
	for rows.Next() {
		var item models.AssortmentWithStock
		rows.Scan(
			&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
			&item.ExpiryDate, &item.Description, &item.MinStockLevel,
			&item.TotalQuantity, &item.LastUpdated,
		)
		items = append(items, item)
	}
	c.JSON(http.StatusOK, items)
}

// GetAssortmentByID обрабатывает GET /api/assortment/:id.
func GetAssortmentByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var item models.Assortment
	err := db.Pool.QueryRow(context.Background(),
		`SELECT id, name, price, category, article, expiry_date::text, description, min_stock_level
		 FROM assortment WHERE id = $1`, id,
	).Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
		&item.ExpiryDate, &item.Description, &item.MinStockLevel)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Товар не найден"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// GetAssortmentSalesChart обрабатывает GET /api/assortment/:id/sales-chart.
// Возвращает помесячные продажи за последние 6 месяцев.
func GetAssortmentSalesChart(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)

	rows, err := db.Pool.Query(context.Background(), `
		SELECT to_char(date_trunc('month', sale_date), 'YYYY-MM') AS month,
		       SUM(quantity) AS quantity
		FROM sales
		WHERE assortment_id = $1
		  AND sale_date >= CURRENT_DATE - INTERVAL '6 months'
		GROUP BY month
		ORDER BY month`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var points []models.SalePoint
	for rows.Next() {
		var p models.SalePoint
		rows.Scan(&p.Month, &p.Quantity)
		points = append(points, p)
	}
	c.JSON(http.StatusOK, points)
}

// CreateAssortment обрабатывает POST /api/assortment.
func CreateAssortment(c *gin.Context) {
	var input models.AssortmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var item models.Assortment
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO assortment (name, price, category, article, expiry_date, description, min_stock_level)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, name, price, category, article, expiry_date::text, description, min_stock_level`,
		input.Name, input.Price, input.Category, input.Article,
		input.ExpiryDate, input.Description, input.MinStockLevel,
	).Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
		&item.ExpiryDate, &item.Description, &item.MinStockLevel)
	c.JSON(http.StatusCreated, item)
}

// UpdateAssortment обрабатывает PUT /api/assortment/:id.
func UpdateAssortment(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.AssortmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var item models.Assortment
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE assortment SET name=$1, price=$2, category=$3, article=$4,
		 expiry_date=$5, description=$6, min_stock_level=$7
		 WHERE id=$8
		 RETURNING id, name, price, category, article, expiry_date::text, description, min_stock_level`,
		input.Name, input.Price, input.Category, input.Article,
		input.ExpiryDate, input.Description, input.MinStockLevel, id,
	).Scan(&item.ID, &item.Name, &item.Price, &item.Category, &item.Article,
		&item.ExpiryDate, &item.Description, &item.MinStockLevel)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Товар не найден"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteAssortment обрабатывает DELETE /api/assortment/:id.
func DeleteAssortment(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM assortment WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}
