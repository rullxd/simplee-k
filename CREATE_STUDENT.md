# Cara Membuat User Mahasiswa

## Opsi 1: Melalui SQL (Paling Cepat)

### Langkah 1: Buka phpMyAdmin
http://localhost/phpmyadmin

### Langkah 2: Pilih Database `simplee_k`

### Langkah 3: Klik Tab SQL

### Langkah 4: Copy-Paste Script Berikut

```sql
-- Buat user mahasiswa baru
-- Password: student123 (akan di-hash otomatis oleh aplikasi)
-- Atau gunakan hash bcrypt langsung:

INSERT INTO users (username, student_id, email, password, name, role, created_at, updated_at) 
VALUES (
    'student001',                    -- username
    '2024001',                       -- student_id (NIM)
    'student001@university.edu',      -- email
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password: student123
    'Student Name',                  -- nama lengkap
    'student',                       -- role
    NOW(),
    NOW()
);
```

**Catatan**: Hash password di atas adalah untuk password `student123`

### Langkah 5: Klik Go

### Langkah 6: Login
- Username: `student001` atau `2024001`
- Password: `student123`

---

## Opsi 2: Melalui Aplikasi (Auto-Create)

Saya bisa tambahkan endpoint untuk register mahasiswa, atau buat script Go sederhana.

---

## Opsi 3: Update Fungsi Seeding (Otomatis)

Saya bisa update fungsi `seedDB()` untuk otomatis membuat beberapa user mahasiswa contoh.

---

## Script SQL Lengkap (Multiple Students)

```sql
-- Buat beberapa user mahasiswa sekaligus
INSERT INTO users (username, student_id, email, password, name, role, created_at, updated_at) VALUES
('student001', '2024001', 'student001@university.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alex Johnson', 'student', NOW(), NOW()),
('student002', '2024002', 'student002@university.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Lee', 'student', NOW(), NOW()),
('student003', '2024003', 'student003@university.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael Brown', 'student', NOW(), NOW());
```

**Password untuk semua**: `student123`

---

## Generate Hash Password Baru

Jika ingin password berbeda, jalankan di Go:

```go
package main
import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)
func main() {
    hash, _ := bcrypt.GenerateFromPassword([]byte("password-anda"), 10)
    fmt.Println(string(hash))
}
```

Atau biarkan aplikasi yang generate saat seeding.

---

## Login sebagai Mahasiswa

Setelah user dibuat:

1. Buka: http://localhost:8080
2. Login dengan:
   - **Username**: `student001` (atau `2024001` - student_id)
   - **Password**: `student123`
3. Akan redirect ke: `/student/dashboard`

---

## Catatan

- Username atau Student ID bisa digunakan untuk login
- Password default: `student123` (bisa diubah di database)
- Role harus `student` (bukan `admin`)

