# Deployment Guide - Frontend ke Vercel dengan Backend Local

## ⚠️ Catatan Penting

**Backend yang dijalankan manual di terminal HANYA bisa diakses dari device yang sama (localhost).**

Untuk mengakses dari device lain, Anda HARUS:
1. **Expose backend ke internet** (menggunakan ngrok atau deploy ke cloud)
2. **Update API URL** di frontend

---

## Opsi 1: Menggunakan Ngrok (Paling Mudah untuk Testing)

### Langkah-langkah:

1. **Install Ngrok**
   ```bash
   # Download dari https://ngrok.com/download
   # Atau menggunakan npm
   npm install -g ngrok
   ```

2. **Jalankan Backend di Terminal**
   ```bash
   go run main.go
   ```

3. **Expose Backend dengan Ngrok**
   ```bash
   ngrok http 8080
   ```
   
   Ngrok akan memberikan URL seperti: `https://abc123.ngrok.io`

4. **Update API_BASE_URL di Vercel**
   - Buka project di Vercel Dashboard
   - Go to Settings > Environment Variables
   - Tambahkan:
     - Key: `VITE_API_BASE_URL`
     - Value: `https://abc123.ngrok.io/api`
   - Redeploy aplikasi

5. **Update api.js untuk menggunakan environment variable**
   File sudah diupdate untuk menggunakan `import.meta.env.VITE_API_BASE_URL`

### Catatan:
- URL ngrok akan berubah setiap kali restart (kecuali pakai plan berbayar)
- Cocok untuk testing dan development
- Tidak cocok untuk production

---

## Opsi 2: Deploy Backend ke Cloud (Recommended untuk Production)

### Pilihan Platform Backend:

#### A. Railway (Gratis untuk mulai)
1. Sign up di https://railway.app
2. New Project > Deploy from GitHub
3. Connect repository
4. Railway akan auto-detect Go
5. Set environment variables:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`
6. Railway akan memberikan URL seperti: `https://your-app.railway.app`
7. Update `VITE_API_BASE_URL` di Vercel ke: `https://your-app.railway.app/api`

#### B. Render (Gratis)
1. Sign up di https://render.com
2. New > Web Service
3. Connect GitHub repository
4. Build command: `go build -o app`
5. Start command: `./app`
6. Set environment variables
7. Render akan memberikan URL: `https://your-app.onrender.com`
8. Update `VITE_API_BASE_URL` di Vercel

#### C. Fly.io (Gratis)
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Deploy: `fly launch`
4. Set secrets: `fly secrets set KEY=value`
5. Update `VITE_API_BASE_URL` di Vercel

---

## Setup Vercel

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Deploy ke Vercel

#### Via CLI:
```bash
cd "c:\cloud computing\simplee-k"
vercel
```

#### Via GitHub:
1. Push code ke GitHub
2. Go to https://vercel.com
3. Import Project dari GitHub
4. Root Directory: `web` (atau biarkan kosong jika struktur sudah benar)
5. Build Command: (kosongkan, karena static files)
6. Output Directory: `web`

### 3. Set Environment Variables di Vercel
- Go to Project Settings > Environment Variables
- Tambahkan:
  ```
  VITE_API_BASE_URL = https://your-backend-url.com/api
  ```

### 4. Update CORS di Backend
Pastikan backend mengizinkan origin dari Vercel:
```go
// Di main.go, update CORS middleware:
c.Writer.Header().Set("Access-Control-Allow-Origin", "https://your-vercel-app.vercel.app")
// Atau untuk development:
// c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
```

---

## Konfigurasi untuk Development vs Production

### Development (Local)
- Frontend: `http://localhost:3000` (jika pakai dev server)
- Backend: `http://localhost:8080`
- API_BASE_URL: `http://localhost:8080/api` (default)

### Production (Vercel + Cloud Backend)
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app` (atau platform lain)
- API_BASE_URL: Set via environment variable di Vercel

---

## Troubleshooting

### CORS Error
- Pastikan backend mengizinkan origin dari Vercel
- Check CORS headers di backend

### API Connection Failed
- Pastikan backend sudah running dan accessible
- Check URL di environment variable
- Pastikan endpoint menggunakan `/api` prefix

### Environment Variable tidak terbaca
- Pastikan menggunakan prefix `VITE_` untuk Vite
- Atau gunakan `window.API_BASE_URL` untuk runtime config
- Redeploy setelah set environment variable

---

## Catatan Penting

1. **Backend Local hanya bisa diakses dari device yang sama**
   - Untuk akses dari device lain, backend HARUS di-expose ke internet
   - Gunakan ngrok (temporary) atau deploy ke cloud (permanent)

2. **Database**
   - Jika backend di cloud, pastikan database juga accessible
   - Bisa pakai cloud database (Railway Postgres, Supabase, dll)

3. **File Uploads**
   - Pastikan folder `uploads` accessible
   - Consider menggunakan cloud storage (AWS S3, Cloudinary) untuk production

4. **Security**
   - Jangan hardcode credentials
   - Gunakan environment variables
   - Enable HTTPS untuk production

