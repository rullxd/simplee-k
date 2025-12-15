package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost            string
	DBPort            string
	DBUser            string
	DBPassword        string
	DBName            string
	JWTSecret         string
	JWTExpirationHours int
	ServerPort        string
	ServerHost        string
	UploadDir         string
	MaxUploadSize     int64
}

var AppConfig *Config

func LoadConfig() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	AppConfig = &Config{
		DBHost:            getEnv("DB_HOST", "localhost"),
		DBPort:            getEnv("DB_PORT", "3306"),
		DBUser:            getEnv("DB_USER", "root"),
		DBPassword:        getEnv("DB_PASSWORD", ""),
		DBName:            getEnv("DB_NAME", "simplee_k"),
		JWTSecret:         getEnv("JWT_SECRET", "your-secret-key-change-this-in-production"),
		JWTExpirationHours: getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		ServerPort:        getEnv("SERVER_PORT", "8080"),
		ServerHost:        getEnv("SERVER_HOST", "localhost"),
		UploadDir:         getEnv("UPLOAD_DIR", "uploads"),
		MaxUploadSize:     int64(getEnvAsInt("MAX_UPLOAD_SIZE", 5242880)),
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(AppConfig.UploadDir, 0755); err != nil {
		log.Printf("Warning: Could not create upload directory: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

