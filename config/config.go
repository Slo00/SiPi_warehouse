// Пакет config отвечает за загрузку конфигурации приложения
// из переменных окружения и опционального файла .env.
package config

import (
	"os"

	"github.com/joho/godotenv"
)

// Config хранит конфигурацию приложения.
type Config struct {
	// DBURL — строка подключения к PostgreSQL (DSN).
	DBURL string

	// JWTSecret — секретный ключ для подписи JWT-токенов.
	JWTSecret string

	// Port — порт HTTP-сервера. По умолчанию "8080".
	Port string
}

// Load читает конфигурацию из файла .env (если присутствует)
// и переменных окружения. Если PORT не задан, используется "8080".
func Load() *Config {
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return &Config{
		DBURL:     os.Getenv("DB_URL"),
		JWTSecret: os.Getenv("JWT_SECRET"),
		Port:      port,
	}
}
