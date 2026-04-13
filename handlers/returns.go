package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetReturns handles GET /api/returns.
// Returns all return records sorted by date descending.
func GetReturns(c *gin.Context) {
	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, return_number, return_date, order_number, items_list, reason, client_order_id
		 FROM returns ORDER BY return_date DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var returns []models.Return
	for rows.Next() {
		var r models.Return
		rows.Scan(&r.ID, &r.ReturnNumber, &r.ReturnDate, &r.OrderNumber, &r.ItemsList, &r.Reason, &r.ClientOrderID)
		returns = append(returns, r)
	}
	c.JSON(http.StatusOK, returns)
}

// CreateReturn handles POST /api/returns.
func CreateReturn(c *gin.Context) {
	var input models.ReturnInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var r models.Return
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO returns (return_number, order_number, items_list, reason, client_order_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, return_number, return_date, order_number, items_list, reason, client_order_id`,
		input.ReturnNumber, input.OrderNumber, input.ItemsList, input.Reason, input.ClientOrderID,
	).Scan(&r.ID, &r.ReturnNumber, &r.ReturnDate, &r.OrderNumber, &r.ItemsList, &r.Reason, &r.ClientOrderID)
	c.JSON(http.StatusCreated, r)
}

// UpdateReturn handles PUT /api/returns/:id.
func UpdateReturn(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.ReturnInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var r models.Return
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE returns SET return_number=$1, order_number=$2, items_list=$3, reason=$4, client_order_id=$5
		 WHERE id=$6
		 RETURNING id, return_number, return_date, order_number, items_list, reason, client_order_id`,
		input.ReturnNumber, input.OrderNumber, input.ItemsList, input.Reason, input.ClientOrderID, id,
	).Scan(&r.ID, &r.ReturnNumber, &r.ReturnDate, &r.OrderNumber, &r.ItemsList, &r.Reason, &r.ClientOrderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Возврат не найден"})
		return
	}
	c.JSON(http.StatusOK, r)
}

// DeleteReturn handles DELETE /api/returns/:id.
func DeleteReturn(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM returns WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}
