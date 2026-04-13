// Пакет db управляет пулом соединений с PostgreSQL
// через драйвер pgx/v5.
package db

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool — глобальный пул соединений с PostgreSQL.
// Инициализируется функцией Connect и используется всеми обработчиками.
var Pool *pgxpool.Pool

// Connect создаёт пул соединений с PostgreSQL по переданному DSN
// и сохраняет его в Pool. Проверяет соединение через Ping.
// При ошибке завершает программу через log.Fatalf.
func Connect(dbURL string) {
	var err error
	Pool, err = pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Не удалось подключиться к БД: %v", err)
	}

	err = Pool.Ping(context.Background())
	if err != nil {
		log.Fatalf("БД не отвечает: %v", err)
	}

	fmt.Println("Подключено к PostgreSQL")
}
