package main

import (
	"errors"
	"fmt"
	"log"
	"simplee-k/config"
	"simplee-k/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Database functions
func connectDB() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBName,
	)

	var err error
	// Set logger to Silent in production, Info in development
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // Change to logger.Info for debugging
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Database connected successfully")
}

func migrateDB() {
	err := DB.AutoMigrate(&models.User{}, &models.Category{}, &models.Complaint{}, &models.Announcement{}, &models.Notification{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migration completed")
}

func seedDB() {
	// Seed categories
	var categoryCount int64
	DB.Model(&models.Category{}).Count(&categoryCount)
	if categoryCount == 0 {
		categories := []models.Category{
			{Name: "Facilities", Slug: "facilities"},
			{Name: "Academics", Slug: "academics"},
			{Name: "IT Support", Slug: "it_support"},
			{Name: "Security", Slug: "security"},
			{Name: "Services", Slug: "services"},
			{Name: "Cleanliness", Slug: "cleanliness"},
			{Name: "Network", Slug: "network"},
			{Name: "General", Slug: "general"},
			{Name: "Other", Slug: "other"},
		}

		for _, category := range categories {
			DB.Create(&category)
		}
		log.Println("Categories seeded")
	}

	// Seed admin user (always ensure admin exists with correct password)
	var adminUser models.User
	result := DB.Where("username = ?", "admin").First(&adminUser)

	if result.Error == gorm.ErrRecordNotFound {
		// Create new admin user
		hashedPassword, err := hashPassword("admin123")
		if err != nil {
			log.Printf("Error hashing password: %v", err)
			return
		}

		admin := models.User{
			Username:  "admin",
			Email:     "admin@simplee-k.com",
			Password:  hashedPassword,
			Name:      "Admin User",
			Role:      models.RoleAdmin,
			StudentID: "ADMIN001",
		}

		if err := DB.Create(&admin).Error; err != nil {
			log.Printf("Error creating admin user: %v", err)
		} else {
			log.Println("Admin user created successfully")
		}
	} else {
		// Update admin password to ensure it's correct
		hashedPassword, err := hashPassword("admin123")
		if err == nil {
			adminUser.Password = hashedPassword
			DB.Save(&adminUser)
			log.Println("Admin user password updated")
		}
	}

	// Seed a single sample student user (if none exist)
	var studentCount int64
	DB.Model(&models.User{}).Where("role = ?", "student").Count(&studentCount)
	if studentCount == 0 {
		hashedPassword, _ := hashPassword("student123")
		student := models.User{
			Username:  "student001",
			StudentID: "2024001",
			Email:     "student001@university.edu",
			Password:  hashedPassword,
			Name:      "Student User",
			Role:      models.RoleStudent,
			Phone:     "+6281234567890",
		}

		if err := DB.Create(&student).Error; err != nil {
			log.Printf("Error creating sample student user: %v", err)
		} else {
			log.Println("Sample student user created (username=student001, password=student123)")
		}
	}

	log.Println("Database seeding completed")
}

// Password functions
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// JWT functions
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func generateToken(userID uint, username, role string) (string, error) {
	expirationTime := time.Now().Add(time.Duration(config.AppConfig.JWTExpirationHours) * time.Hour)
	claims := &Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "simplee-k",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

func validateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// Middleware functions
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(401, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}
		claims, err := validateToken(parts[1])
		if err != nil {
			c.JSON(401, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Set("username", claims.Username)
		c.Next()
	}
}

func adminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists || role != "admin" {
			c.JSON(403, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func getUserID(c *gin.Context) uint {
	userID, _ := c.Get("user_id")
	return userID.(uint)
}

func getUserRole(c *gin.Context) string {
	role, _ := c.Get("user_role")
	return role.(string)
}
