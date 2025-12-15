package main

import (
	"fmt"
	"log"
	"simplee-k/config"

	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadConfig()
	connectDB()
	migrateDB()
	seedDB()

	r := setupRoutes()

	serverAddr := fmt.Sprintf("%s:%s", config.AppConfig.ServerHost, config.AppConfig.ServerPort)
	log.Printf("Server starting on http://%s", serverAddr)

	if err := r.Run(serverAddr); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes() *gin.Engine {
	// Set release mode in production
	// gin.SetMode(gin.ReleaseMode)
	
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	
	// Trust only localhost for development
	// In production, set specific trusted proxies
	r.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	// Serve static files
	r.Static("/static", "./web/static")
	r.Static("/uploads", "./uploads")

	// Serve HTML files
	r.GET("/", func(c *gin.Context) { c.File("./web/login.html") })
	r.GET("/login", func(c *gin.Context) { c.File("./web/login.html") })
	r.GET("/student/dashboard", func(c *gin.Context) { c.File("./web/student-dashboard.html") })
	r.GET("/admin/dashboard", func(c *gin.Context) { c.File("./web/admin-dashboard.html") })
	r.GET("/admin/users", func(c *gin.Context) { c.File("./web/users.html") })
	r.GET("/admin/reports", func(c *gin.Context) { c.File("./web/reports.html") })
	r.GET("/admin/settings", func(c *gin.Context) { c.File("./web/settings.html") })
	r.GET("/admin/complaints", func(c *gin.Context) { c.File("./web/complaints.html") })
	r.GET("/admin/announcements", func(c *gin.Context) { c.File("./web/announcements.html") })
	r.GET("/complaint/submit", func(c *gin.Context) { c.File("./web/submit-complaint.html") })
	r.GET("/admin/complaint/:id", func(c *gin.Context) { c.File("./web/complaint-detail.html") })
	r.GET("/student/complaint/:id", func(c *gin.Context) { c.File("./web/student-complaint-detail.html") })
	
	// Legacy route redirect for backward compatibility
	// Redirect old /complaint/:id to /student/complaint/:id (default to student)
	// This prevents 404 errors from old links or cached JavaScript
	r.GET("/complaint/:id", func(c *gin.Context) {
		id := c.Param("id")
		// Default to student route - if user is admin, they should use /admin/complaint/:id
		c.Redirect(302, "/student/complaint/"+id)
	})

	// API Routes
	api := r.Group("/api")
	{
		api.POST("/login", login)

		protected := api.Group("")
		protected.Use(authMiddleware())
		{
			protected.GET("/profile", getProfile)
			protected.GET("/categories", getCategories)
			protected.POST("/complaints", createComplaint)
			protected.GET("/complaints", getComplaints)
			protected.GET("/complaints/stats", getComplaintStats)
			protected.GET("/complaints/:id", getComplaint)
			protected.PUT("/complaints/:id", updateComplaint)
			protected.DELETE("/complaints/:id", deleteComplaint)

			// Notifications
			protected.GET("/notifications", getNotifications)
			protected.PUT("/notifications/:id/read", markNotificationAsRead)
			protected.PUT("/notifications/read-all", markAllNotificationsAsRead)

			// Users (Admin only)
			protected.GET("/users", getAllUsers)
			protected.GET("/users/stats", getUserStats)
		}

		// Admin only routes
		admin := protected.Group("")
		admin.Use(adminOnly())
		{
			// Users (Admin only)
			admin.POST("/users", createUser)
			
			// Reports (Admin only)
			admin.GET("/reports/stats", getReportStats)
			admin.GET("/reports/categories", getCategoryStats)
			admin.GET("/reports/trends", getComplaintTrends)
			
			// Announcements
			admin.GET("/announcements", getAnnouncements)
			admin.POST("/announcements", createAnnouncement)
			admin.GET("/announcements/:id", getAnnouncement)
			admin.PUT("/announcements/:id", updateAnnouncement)
			admin.DELETE("/announcements/:id", deleteAnnouncement)
		}
	}

	return r
}
