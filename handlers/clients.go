package handlers

import (
	"context"
	"net/http"
	"strconv"

	"warehouse-api/db"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
)

// GetClients handles GET /api/clients.
// Supports optional ?search= query parameter.
func GetClients(c *gin.Context) {
	search := "%" + c.Query("search") + "%"
	rows, err := db.Pool.Query(context.Background(),
		`SELECT id, name, phone, email, company FROM clients
		 WHERE name ILIKE $1 OR company ILIKE $1 ORDER BY name`, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var clients []models.Client
	for rows.Next() {
		var cl models.Client
		rows.Scan(&cl.ID, &cl.Name, &cl.Phone, &cl.Email, &cl.Company)
		clients = append(clients, cl)
	}
	c.JSON(http.StatusOK, clients)
}

// GetClientByID handles GET /api/clients/:id.
func GetClientByID(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var cl models.Client
	err := db.Pool.QueryRow(context.Background(),
		`SELECT id, name, phone, email, company FROM clients WHERE id = $1`, id,
	).Scan(&cl.ID, &cl.Name, &cl.Phone, &cl.Email, &cl.Company)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Клиент не найден"})
		return
	}
	c.JSON(http.StatusOK, cl)
}

// CreateClient handles POST /api/clients.
func CreateClient(c *gin.Context) {
	var input models.ClientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cl models.Client
	db.Pool.QueryRow(context.Background(),
		`INSERT INTO clients (name, phone, email, company)
		 VALUES ($1, $2, $3, $4) RETURNING id, name, phone, email, company`,
		input.Name, input.Phone, input.Email, input.Company,
	).Scan(&cl.ID, &cl.Name, &cl.Phone, &cl.Email, &cl.Company)
	c.JSON(http.StatusCreated, cl)
}

// UpdateClient handles PUT /api/clients/:id.
func UpdateClient(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var input models.ClientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var cl models.Client
	err := db.Pool.QueryRow(context.Background(),
		`UPDATE clients SET name=$1, phone=$2, email=$3, company=$4
		 WHERE id=$5 RETURNING id, name, phone, email, company`,
		input.Name, input.Phone, input.Email, input.Company, id,
	).Scan(&cl.ID, &cl.Name, &cl.Phone, &cl.Email, &cl.Company)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Клиент не найден"})
		return
	}
	c.JSON(http.StatusOK, cl)
}

// DeleteClient handles DELETE /api/clients/:id.
func DeleteClient(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	db.Pool.Exec(context.Background(), "DELETE FROM clients WHERE id = $1", id)
	c.JSON(http.StatusOK, gin.H{"message": "Удалено"})
}
