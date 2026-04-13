// Пакет middleware предоставляет Gin-middleware для JWT-аутентификации.
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTSecret — секретный ключ для подписи и проверки JWT-токенов.
var JWTSecret []byte

// InitJWT устанавливает секретный ключ для JWT. Должна вызываться при старте
// приложения до регистрации маршрутов.
func InitJWT(secret string) {
	JWTSecret = []byte(secret)
}

// GenerateToken создаёт подписанный JWT-токен с идентификатором и ролью пользователя.
func GenerateToken(userID int64, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret)
}

// AuthRequired — Gin-middleware, проверяющий JWT-токен из заголовка
// Authorization: Bearer <token>. При успехе записывает "user_id" и "role"
// в контекст запроса. Возвращает 401, если токен отсутствует или невалиден.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Токен не предоставлен"})
			c.Abort()
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверный формат токена"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(parts[1], func(t *jwt.Token) (interface{}, error) {
			return JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Невалидный токен"})
			c.Abort()
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		c.Set("user_id", int64(claims["user_id"].(float64)))
		c.Set("role", claims["role"].(string))
		c.Next()
	}
}

// AdminOnly — Gin-middleware, ограничивающий доступ только для роли "admin".
// Возвращает 403, если текущий пользователь не является администратором.
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")
		if role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещён"})
			c.Abort()
			return
		}
		c.Next()
	}
}
