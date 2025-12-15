# Quick Fix: Login Gagal

## 🔧 Solusi Cepat

### Langkah 1: Restart Server

Stop server (Ctrl+C) dan jalankan lagi:
```bash
go run .
```

Fungsi seeding sudah diperbaiki untuk **memastikan admin user selalu ada** dengan password yang benar.

### Langkah 2: Cek Log Server

Setelah restart, pastikan log menunjukkan:
```
Database connected successfully
Database migration completed
Categories seeded
Admin user created successfully  ← HARUS ADA INI
Database seeding completed
```

### Langkah 3: Test Login

1. Buka: http://localhost:8080
2. Login dengan:
   - **Username**: `admin`
   - **Password**: `admin123`

## 🐛 Jika Masih Gagal

### Opsi 1: Reset Database (Paling Cepat)

1. Buka phpMyAdmin: http://localhost/phpmyadmin
2. Hapus database `simplee_k`
3. Buat ulang database `simplee_k`
4. Jalankan: `go run .`
5. Cek log, harus ada: "Admin user created successfully"
6. Coba login lagi

### Opsi 2: Update Password Manual

Jalankan di phpMyAdmin:
```sql
-- Generate hash baru untuk password "admin123"
-- Atau biarkan aplikasi yang update otomatis saat restart
```

**Lebih baik**: Biarkan aplikasi yang update otomatis dengan restart server.

## ✅ Perbaikan yang Sudah Dilakukan

1. ✅ Fungsi `seedDB()` diperbaiki
2. ✅ Admin user akan **selalu dibuat** jika belum ada
3. ✅ Password admin akan **selalu di-update** ke hash yang benar
4. ✅ Tidak perlu manual import SQL lagi

## 📝 Default Login

Setelah seeding berhasil:
- **Username**: `admin`
- **Password**: `admin`

## ⚠️ Catatan

Jika log menunjukkan "Database already seeded, skipping..." tapi login masih gagal:
- Kemungkinan user admin ada tapi password hash salah
- **Solusi**: Restart server, fungsi baru akan update password otomatis

