# Next Steps Setelah Deploy ke Vercel

## ✅ Deployment Berhasil!

Frontend sudah berhasil di-deploy ke Vercel:
- URL: `https://simplee-k2.vercel.app`
- Status: Ready ✅

---

## 🔧 Langkah Selanjutnya

### 1. Expose Backend ke Internet

Backend yang running di localhost **HANYA bisa diakses dari device yang sama**. Untuk bisa diakses dari device lain, Anda perlu expose backend.

#### Opsi A: Menggunakan Ngrok (Quick Test)

```bash
# Install ngrok (jika belum)
npm install -g ngrok

# Jalankan backend di terminal pertama
go run main.go

# Expose dengan ngrok di terminal kedua
ngrok http 8080
```

**Copy URL yang diberikan**, contoh: `https://abc123.ngrok.io`

⚠️ **Catatan**: URL ngrok akan berubah setiap restart

#### Opsi B: Deploy Backend ke Cloud (Recommended untuk Production)

**Railway** (Gratis):
1. Sign up: https://railway.app
2. New Project > Deploy from GitHub
3. Connect repository
4. Set environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET)
5. Railway akan memberikan URL: `https://your-app.railway.app`

**Render** (Gratis):
1. Sign up: https://render.com
2. New Web Service
3. Connect GitHub
4. Build: `go build -o app`
5. Start: `./app`
6. URL: `https://your-app.onrender.com`

---

### 2. Update API URL di Frontend

Setelah backend di-expose, update API URL:

#### Cara 1: Update Langsung di `api.js` (Sementara)

Edit `web/static/js/api.js`:
```javascript
const API_BASE_URL = 'https://abc123.ngrok.io/api'; // Ganti dengan URL backend Anda
```

Kemudian push dan redeploy:
```bash
git add web/static/js/api.js
git commit -m "Update API URL to backend"
git push
```

#### Cara 2: Inject via Script Tag (Lebih Fleksibel)

Tambahkan di setiap HTML file sebelum `api.js`:
```html
<script>
    window.API_BASE_URL = 'https://abc123.ngrok.io/api';
</script>
<script src="/static/js/api.js"></script>
```

---

### 3. Update CORS di Backend (Jika Perlu)

Backend sudah mengizinkan semua origin (`*`), jadi seharusnya tidak perlu diubah.

Jika ada masalah CORS, pastikan di `main.go`:
```go
c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
```

---

### 4. Test Aplikasi

1. **Buka URL Vercel**: `https://simplee-k2.vercel.app`
2. **Test Login**:
   - Username: `admin` / Password: `admin123` (atau sesuai seed data)
   - Username: `student001` / Password: `student001` (atau sesuai seed data)
3. **Test Fitur**:
   - Login sebagai admin
   - Login sebagai student
   - Submit complaint
   - Dll.

---

### 5. Database Configuration

Jika backend di cloud, pastikan database juga accessible:

#### Opsi A: Cloud Database
- **Railway Postgres**: Otomatis jika deploy di Railway
- **Supabase**: https://supabase.com (gratis)
- **PlanetScale**: https://planetscale.com (gratis)

#### Opsi B: Keep Local Database (Hanya untuk Testing)
- Backend harus running di device yang sama dengan database
- Tidak cocok untuk production

---

## 📝 Checklist

- [ ] Backend sudah di-expose (ngrok atau cloud)
- [ ] API URL sudah di-update di frontend
- [ ] Push perubahan ke GitHub
- [ ] Vercel sudah auto-redeploy
- [ ] Test login berhasil
- [ ] Test fitur utama berhasil
- [ ] Database accessible (jika backend di cloud)

---

## 🔍 Troubleshooting

### API Connection Failed
- Pastikan backend masih running
- Check URL di `api.js` sudah benar
- Pastikan ngrok masih running (jika pakai ngrok)
- Check browser console untuk error detail

### CORS Error
- Pastikan backend CORS mengizinkan origin Vercel
- Check `main.go` CORS configuration

### Login Gagal
- Pastikan backend API accessible
- Check database connection
- Check JWT_SECRET sudah di-set

---

## 🎯 Production Checklist

Untuk production, pastikan:

1. ✅ Backend di-deploy ke cloud (bukan local)
2. ✅ Database di cloud (bukan local)
3. ✅ Environment variables sudah di-set dengan benar
4. ✅ HTTPS enabled (otomatis di Vercel & cloud platforms)
5. ✅ JWT_SECRET yang kuat (bukan default)
6. ✅ File uploads menggunakan cloud storage (AWS S3, Cloudinary)
7. ✅ Error handling yang baik
8. ✅ Logging dan monitoring

---

## 📚 Resources

- Vercel Dashboard: https://vercel.com/dashboard
- Ngrok: https://ngrok.com
- Railway: https://railway.app
- Render: https://render.com

---

## 💡 Tips

1. **Untuk Development**: Pakai ngrok (cepat, mudah)
2. **Untuk Production**: Deploy backend ke cloud (stabil, permanent)
3. **Database**: Gunakan cloud database untuk production
4. **File Uploads**: Consider cloud storage untuk production
5. **Monitoring**: Setup logging dan monitoring untuk production

