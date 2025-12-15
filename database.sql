-- ============================================
-- SIMPEL-K Database Setup Script
-- ============================================
-- Copy dan paste seluruh script ini di phpMyAdmin SQL tab
-- atau MySQL command line

-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS simplee_k CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE simplee_k;

-- 2. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    student_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role ENUM('admin', 'student') DEFAULT 'student',
    phone VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_student_id (student_id),
    INDEX idx_email (email),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'in_process', 'completed', 'rejected') DEFAULT 'pending',
    admin_response TEXT,
    evidence_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insert Data Categories
INSERT INTO categories (name, slug) VALUES
('Facilities', 'facilities'),
('Academics', 'academics'),
('IT Support', 'it_support'),
('Security', 'security'),
('Services', 'services'),
('Cleanliness', 'cleanliness'),
('Network', 'network'),
('General', 'general'),
('Other', 'other')
ON DUPLICATE KEY UPDATE name=name;

-- 6. Insert Default Admin User
-- Password: admin123 (bcrypt hash)
-- Catatan: Jika hash ini tidak bekerja, jalankan aplikasi Go sekali untuk auto-seed
-- atau generate hash baru dengan: go run -c "package main; import (\"fmt\"; \"golang.org/x/crypto/bcrypt\"); func main() { h, _ := bcrypt.GenerateFromPassword([]byte(\"admin123\"), 10); fmt.Print(string(h)) }"
INSERT INTO users (username, student_id, email, password, name, role) VALUES
('admin', 'ADMIN001', 'admin@simplee-k.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- ============================================
-- SELESAI!
-- ============================================
-- Default Login:
-- Username: admin
-- Password: admin123
-- ============================================
