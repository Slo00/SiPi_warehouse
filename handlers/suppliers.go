package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetSuppliers handles GET /api/suppliers.
// Returns all suppliers.
func GetSuppliers(c *gin.Context) {
	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, name, contact_info, phone, email FROM suppliers ORDER BY name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var suppliers []models.Supplier
	for rows.Next() {
		var s models.Supplier
		rows.Scan(&s.ID, &s.Name, &s.ContactInfo, &s.Phone, &s.Email)
		suppliers = append(suppliers, s)
	}
	c.JSON(http.StatusOK, suppliers)
}

// GetSupplierByID handles GET /api/suppliers/:id.
func GetSupplierByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var s models.Supplier
	err := db.Pool.QueryRow(context.Background(),
		`SELECT id, name, contact_info, phone, email FROM suppliers WHERE id = $1`, id,
	).Scan(&s.ID, &s.Name, &s.ContactInfo, &s.Phone, &s.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Поставщик не найден"})
		return
	}
	c.JSON(http.StatusOK, s)
}

// CreateSupplier handles POST /api/suppliers.
func CreateSupplier(c *gin.Context) {
	var input models.SupplierInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var s models.Supplier
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO suppliers (name, contact_info, phone, email)
		 VALUES ($1, $2, $3, $4) RETURNING id, name, contact_info, phone, email`,
		input.Name, input.ContactInfo, input.Phone, input.Email,
	).Scan(&s.ID, &s.Name, &s.ContactInfo, &s.Phone, &s.Email)
	c.JSON(http.StatusCreated, s)
}

// UpdateSupplier handles PUT /api/suppliers/:id.
func UpdateSupplier(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.SupplierInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var s models.Supplier
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE suppliers SET name=$1, contact_info=$2, phone=$3, email=$4
		 WHERE id=$5 RETURNING id, name, contact_info, phone, email`,
		input.Name, input.ContactInfo, input.Phone, input.Email, id,
	).Scan(&s.ID, &s.Name, &s.ContactInfo, &s.Phone, &s.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Поставщик не найден"})
		return
	}
	c.JSON(http.StatusOK, s)
}

// DeleteSupplier handles DELETE /api/suppliers/:id.
func DeleteSupplier(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM suppliers WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}
