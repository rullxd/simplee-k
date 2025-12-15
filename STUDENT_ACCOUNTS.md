# Akun Mahasiswa untuk Testing

## ✅ Akun yang Tersedia (Auto-Created)

Setelah menjalankan `go run .`, aplikasi akan otomatis membuat 3 user mahasiswa contoh:

### 1. Alex Johnson
- **Username**: `student001`
- **Student ID**: `2024001`
- **Password**: `student123`
- **Email**: student001@university.edu

### 2. Sarah Lee
- **Username**: `student002`
- **Student ID**: `2024002`
- **Password**: `student123`
- **Email**: student002@university.edu

### 3. Michael Brown
- **Username**: `student003`
- **Student ID**: `2024003`
- **Password**: `student123`
- **Email**: student003@university.edu

## 🔐 Cara Login

1. Buka: http://localhost:8080
2. Masukkan:
   - **Username**: `student001` (atau bisa pakai Student ID: `2024001`)
   - **Password**: `student123`
3. Klik **Log In**
4. Akan redirect ke: `/student/dashboard`

## 📝 Catatan

- Bisa login dengan **username** atau **student_id**
- Password sama untuk semua: `student123`
- Setelah login, akan melihat dashboard mahasiswa
- Hanya bisa melihat complaint yang dibuat sendiri

## ➕ Membuat User Mahasiswa Baru

### Via SQL (phpMyAdmin):

```sql
INSERT INTO users (username, student_id, email, password, name, role, created_at, updated_at) 
VALUES (
    'student004',                    -- username
    '2024004',                       -- student_id (NIM)
    'student004@university.edu',      -- email
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password: student123
    'Nama Mahasiswa',                -- nama lengkap
    'student',                       -- role
    NOW(),
    NOW()
);
```

**Password**: `student123` (hash sudah disediakan)

### Via Aplikasi (Coming Soon)

Endpoint untuk register mahasiswa bisa ditambahkan jika diperlukan.

## 🎯 Fitur Mahasiswa

Setelah login sebagai mahasiswa, Anda bisa:
- ✅ Melihat dashboard dengan statistik complaint
- ✅ Submit complaint baru
- ✅ Melihat complaint yang sudah dibuat
- ✅ Melihat detail complaint
- ✅ Filter dan search complaint

## ⚠️ Perbedaan Admin vs Student

| Fitur | Admin | Student |
|-------|-------|---------|
| Lihat semua complaint | ✅ | ❌ (hanya milik sendiri) |
| Update status complaint | ✅ | ❌ |
| Tambah response | ✅ | ❌ |
| Delete complaint | ✅ | ❌ |
| Submit complaint | ✅ | ✅ |
| Lihat statistik | ✅ (semua) | ✅ (hanya milik sendiri) |

