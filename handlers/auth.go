// Пакет handlers содержит HTTP-обработчики всех эндпоинтов REST API.
package handlers

import (
	"context"
	"net/http"

	"warehouse-api/db"
	"warehouse-api/middleware"
	"warehouse-api/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Register обрабатывает POST /api/auth/register.
// Принимает first_name, last_name, email, password, phone и опциональную роль.
func Register(c *gin.Context) {
	var input models.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var exists bool
	err := db.Pool.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", input.Email,
	).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка БД"})
		return
	}
	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email уже зарегистрирован"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка хеширования"})
		return
	}

	role := input.Role
	if role == "" {
		role = "warehouse_keeper"
	}

	var user models.User
	err = db.Pool.QueryRow(context.Background(),
		`INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, email, first_name, last_name, role, phone`,
		input.Email, string(hash), input.FirstName, input.LastName, input.Phone, role,
	).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Role, &user.Phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать пользователя"})
		return
	}

	token, _ := middleware.GenerateToken(user.ID, user.Role)
	c.JSON(http.StatusCreated, gin.H{"user": user, "token": token})
}

// Login обрабатывает POST /api/auth/login.
// При успехе возвращает объект пользователя и подписанный JWT-токен.
func Login(c *gin.Context) {
	var input models.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := db.Pool.QueryRow(context.Background(),
		`SELECT id, email, password_hash, first_name, last_name, role, phone
		 FROM users WHERE email = $1 AND is_active = true`,
		input.Email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName, &user.Role, &user.Phone)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный email или пароль"})
		return
	}

	token, _ := middleware.GenerateToken(user.ID, user.Role)
	c.JSON(http.StatusOK, gin.H{"user": user, "token": token})
}
