package main

import (
	"fmt"
	"net/http"

	"warehouse-api/config"
	"warehouse-api/db"
	"warehouse-api/handlers"
	"warehouse-api/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	db.Connect(cfg.DBURL)
	middleware.InitJWT(cfg.JWTSecret)

	r := gin.Default()

	// CORS для React frontend
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// === Публичные роуты ===
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// === Защищённые роуты ===
	api := r.Group("/api")
	api.Use(middleware.AuthRequired())
	{
		// Дашборды по ролям
		api.GET("/dashboard/procurement", handlers.GetProcurementDashboard)
		api.GET("/dashboard/manager", handlers.GetManagerDashboard)
		api.GET("/dashboard/warehouse", handlers.GetWarehouseDashboard)

		// Поставщики
		api.GET("/suppliers", handlers.GetSuppliers)
		api.GET("/suppliers/:id", handlers.GetSupplierByID)
		api.POST("/suppliers", handlers.CreateSupplier)
		api.PUT("/suppliers/:id", handlers.UpdateSupplier)
		api.DELETE("/suppliers/:id", handlers.DeleteSupplier)

		// Клиенты
		api.GET("/clients", handlers.GetClients)
		api.GET("/clients/:id", handlers.GetClientByID)
		api.POST("/clients", handlers.CreateClient)
		api.PUT("/clients/:id", handlers.UpdateClient)
		api.DELETE("/clients/:id", handlers.DeleteClient)

		// Ассортимент
		api.GET("/assortment", handlers.GetAssortment)
		api.GET("/assortment/:id", handlers.GetAssortmentByID)
		api.GET("/assortment/:id/sales-chart", handlers.GetAssortmentSalesChart)
		api.POST("/assortment", handlers.CreateAssortment)
		api.PUT("/assortment/:id", handlers.UpdateAssortment)
		api.DELETE("/assortment/:id", handlers.DeleteAssortment)

		// Остатки на складе
		api.GET("/stock", handlers.GetStock)
		api.GET("/stock/forecast", handlers.GetStockForecast)
		api.POST("/stock", handlers.CreateStock)
		api.PUT("/stock/:id", handlers.UpdateStock)

		// Заказы клиентов
		api.GET("/client-orders", handlers.GetClientOrders)
		api.GET("/client-orders/:id", handlers.GetClientOrderByID)
		api.POST("/client-orders", handlers.CreateClientOrder)
		api.PUT("/client-orders/:id", handlers.UpdateClientOrder)
		api.DELETE("/client-orders/:id", handlers.DeleteClientOrder)
		api.POST("/client-orders/:id/confirm", handlers.ConfirmClientOrder)
		api.POST("/client-orders/:id/reject", handlers.RejectClientOrder)

		// Позиции заказа клиента
		api.GET("/client-order-items", handlers.GetClientOrderItems)
		api.POST("/client-order-items", handlers.CreateClientOrderItem)

		// Заказы у поставщика
		api.GET("/supplier-orders", handlers.GetSupplierOrders)
		api.GET("/supplier-orders/:id", handlers.GetSupplierOrderByID)
		api.POST("/supplier-orders", handlers.CreateSupplierOrder)
		api.PUT("/supplier-orders/:id", handlers.UpdateSupplierOrder)
		api.DELETE("/supplier-orders/:id", handlers.DeleteSupplierOrder)

		// Позиции заказа у поставщика
		api.GET("/supplier-order-items", handlers.GetSupplierOrderItems)
		api.POST("/supplier-order-items", handlers.CreateSupplierOrderItem)

		// Поступившие товары
		api.GET("/received-goods", handlers.GetReceivedGoods)
		api.POST("/received-goods", handlers.CreateReceivedGoods)

		// Акции
		api.GET("/promotions/suggestions", handlers.GetPromotionSuggestions)
		api.GET("/promotions", handlers.GetPromotions)
		api.GET("/promotions/:id", handlers.GetPromotionByID)
		api.GET("/promotions/:id/stats", handlers.GetPromotionStats)
		api.POST("/promotions", handlers.CreatePromotion)
		api.PUT("/promotions/:id", handlers.UpdatePromotion)
		api.DELETE("/promotions/:id", handlers.DeletePromotion)

		// Товары в акции
		api.GET("/promotion-items", handlers.GetPromotionItems)
		api.POST("/promotion-items", handlers.CreatePromotionItem)

		// Возвраты
		api.GET("/returns", handlers.GetReturns)
		api.POST("/returns", handlers.CreateReturn)
		api.PUT("/returns/:id", handlers.UpdateReturn)
		api.DELETE("/returns/:id", handlers.DeleteReturn)
	}

	// Проверка здоровья
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	fmt.Printf("Сервер на http://localhost:%s\n", cfg.Port)
	r.Run(":" + cfg.Port)
}
