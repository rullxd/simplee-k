# SIMPEL-K - Campus Complaint & Service Management System

Sistem manajemen keluhan dan layanan kampus yang dibangun dengan Go (Gin), GORM, JWT Authentication, dan MySQL.

## Teknologi yang Digunakan

- **Backend**: Go 1.21+
- **Framework**: Gin
- **ORM**: GORM
- **Database**: MySQL (XAMPP)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multipart form data handling
- **Frontend**: HTML, CSS (Tailwind), JavaScript

## Fitur

- ✅ Login dengan JWT untuk Admin dan Student
- ✅ Dashboard untuk Admin dan Student
- ✅ Submit Complaint dengan upload file
- ✅ Manajemen Complaint (CRUD)
- ✅ Filter dan Search Complaint
- ✅ Statistik Complaint
- ✅ Role-based Access Control (Admin/Student)

## Prerequisites

1. **Go** (versi 1.21 atau lebih baru)
   - Download dari: https://golang.org/dl/
   - Atau install via package manager

2. **XAMPP** (untuk MySQL)
   - Download dari: https://www.apachefriends.org/
   - Pastikan MySQL service berjalan

3. **Git** (opsional, untuk clone repository)

## Instalasi

### 1. Clone atau Download Project

```bash
cd "C:\cloud computing\simplee-k"
```

### 2. Setup Database

1. Buka XAMPP Control Panel
2. Start Apache dan MySQL
3. Buka phpMyAdmin (http://localhost/phpmyadmin)
4. Buat database baru dengan nama: `simplee_k`
   ```sql
   CREATE DATABASE simplee_k CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### 3. Konfigurasi Environment

1. Copy file `.env.example` menjadi `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit file `.env` dan sesuaikan konfigurasi:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=          # Kosongkan jika tidak ada password
   DB_NAME=simplee_k

   JWT_SECRET=your-secret-key-change-this-in-production
   JWT_EXPIRATION_HOURS=24

   SERVER_PORT=8080
   SERVER_HOST=localhost

   UPLOAD_DIR=uploads
   MAX_UPLOAD_SIZE=5242880
   ```

### 4. Install Dependencies

```bash
go mod download
```

### 5. Run Aplikasi

```bash
go run main.go
```

Server akan berjalan di: `http://localhost:8080`

## Struktur Project

```
simplee-k/
├── config/              # Konfigurasi aplikasi
├── database/            # Database connection & migrations
├── handlers/            # Request handlers
├── middleware/          # Middleware (Auth, etc)
├── models/              # Database models
├── routes/              # Route definitions
├── utils/               # Utility functions (JWT, etc)
├── stitch_student_dashboard/  # Frontend HTML files
│   ├── static/
│   │   └── js/          # JavaScript files
│   ├── login_screen/
│   ├── student_dashboard/
│   ├── admin_dashboard/
│   ├── submit_complaint_form/
│   └── complaint_details_(admin_view)/
├── uploads/             # Uploaded files (auto-created)
├── main.go              # Entry point
├── go.mod               # Go modules
└── README.md            # Dokumentasi
```

## Default Credentials

Setelah pertama kali menjalankan aplikasi, database akan di-seed dengan satu admin dan satu student contoh:

**Admin:**
- Username: `admin`
- Password: `admin123`

**Student (contoh):**
- Username: `student001`
- Password: `student123`

## API Endpoints

### Public Endpoints

- `POST /api/login` - Login user

### Protected Endpoints (Require JWT Token)

#### Authentication
- `GET /api/profile` - Get user profile

#### Categories
- `GET /api/categories` - Get all categories

#### Complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - Get all complaints (with filters)
- `GET /api/complaints/stats` - Get complaint statistics
- `GET /api/complaints/:id` - Get complaint by ID
- `PUT /api/complaints/:id` - Update complaint (Admin only)
- `DELETE /api/complaints/:id` - Delete complaint (Admin only)

## Cara Menggunakan

### 1. Login

1. Buka browser dan akses: `http://localhost:8080`
2. Login dengan credentials:
   - **Admin**: username: `admin`, password: `admin123`
3. Setelah login, akan di-redirect ke dashboard sesuai role

### 2. Student Dashboard

- Melihat semua complaint yang telah dibuat
- Melihat statistik complaint (Total, Pending, Resolved)
- Filter complaint berdasarkan status
- Search complaint
- Submit complaint baru

### 3. Admin Dashboard

- Melihat semua complaint dari semua student
- Melihat statistik keseluruhan
- Update status complaint
- Tambahkan response admin
- Delete complaint

### 4. Submit Complaint

1. Klik tombol "Submit New Complaint"
2. Isi form:
   - Pilih Category
   - Masukkan Title
   - Masukkan Description
   - (Opsional) Upload file evidence (max 5MB)
3. Klik "Submit Complaint"

### 5. View/Edit Complaint (Admin)

1. Klik tombol "Details" pada complaint
2. Lihat detail complaint
3. Update status dan tambahkan response
4. Klik "Update Complaint"

## Development

### Menjalankan dalam Mode Development

```bash
# Set environment variable untuk development
set GIN_MODE=debug
go run main.go
```

### Menambahkan User Baru

Anda dapat menambahkan user baru melalui database atau membuat endpoint register (opsional).

Contoh SQL untuk menambahkan student:
```sql
INSERT INTO users (username, student_id, email, password, name, role, created_at, updated_at)
VALUES ('student001', '2024001', 'student@example.com', '$2a$10$hashedpassword', 'Student Name', 'student', NOW(), NOW());
```

**Note**: Password harus di-hash menggunakan bcrypt. Gunakan fungsi `HashPassword` dari package `database`.

## Troubleshooting

### Database Connection Error

1. Pastikan XAMPP MySQL service berjalan
2. Cek konfigurasi di file `.env`
3. Pastikan database `simplee_k` sudah dibuat

### Port Already in Use

Jika port 8080 sudah digunakan, ubah `SERVER_PORT` di file `.env`

### File Upload Error

1. Pastikan folder `uploads/` ada dan memiliki permission write
2. Cek `MAX_UPLOAD_SIZE` di file `.env`

### JWT Token Error

1. Pastikan `JWT_SECRET` di file `.env` sudah di-set
2. Clear browser localStorage jika ada masalah dengan token

## Production Deployment

Untuk production, pastikan:

1. Ubah `JWT_SECRET` menjadi random string yang kuat
2. Set `GIN_MODE=release`
3. Gunakan environment variables untuk konfigurasi
4. Setup reverse proxy (Nginx/Apache)
5. Setup SSL/HTTPS
6. Backup database secara berkala

## License

© 2023 SIMPEL-K System. All rights reserved.

## Support

Untuk bantuan atau pertanyaan, silakan hubungi tim development.

