# Update API URL - Quick Guide

## ✅ Ngrok Sudah Running!

URL Backend Anda: `https://e04de0acf391.ngrok-free.app`

---

## 🔧 Langkah Update API URL

### 1. API URL Sudah Diupdate

File `web/static/js/api.js` sudah diupdate dengan URL ngrok Anda:
```javascript
const API_BASE_URL = 'https://e04de0acf391.ngrok-free.app/api';
```

### 2. Push ke GitHub

```bash
git add web/static/js/api.js
git commit -m "Update API URL to ngrok backend"
git push
```

### 3. Vercel Auto-Redeploy

Vercel akan otomatis redeploy setelah push. Tunggu beberapa detik.

### 4. Test Aplikasi

1. Buka: `https://simplee-k2.vercel.app`
2. Test login:
   - Admin: `admin` / `admin123`
   - Student: `student001` / `student001`
3. Test fitur lainnya

---

## ⚠️ Catatan Penting

### Jika Ngrok URL Berubah

Setiap kali restart ngrok, URL akan berubah. Jika URL berubah:

1. **Copy URL baru** dari ngrok terminal
2. **Update** `web/static/js/api.js`:
   ```javascript
   const API_BASE_URL = 'https://URL-BARU.ngrok-free.app/api';
   ```
3. **Push & redeploy**:
   ```bash
   git add web/static/js/api.js
   git commit -m "Update API URL"
   git push
   ```

### Keep Backend & Ngrok Running

- ✅ **Backend harus running** setiap kali frontend diakses
- ✅ **Ngrok harus running** setiap kali frontend diakses
- ❌ Jika salah satu mati, aplikasi tidak akan berfungsi

### Ngrok Web Interface

Buka: `http://127.0.0.1:4040` untuk:
- Lihat semua request yang masuk
- Debug API calls
- Monitor traffic

---

## 🎯 Checklist

- [x] Backend running di `localhost:8080`
- [x] Ngrok running dan expose backend
- [x] API URL sudah diupdate
- [ ] Push perubahan ke GitHub
- [ ] Vercel sudah redeploy
- [ ] Test login berhasil
- [ ] Test fitur lainnya

---

## 🔍 Troubleshooting

### API Connection Failed
- Pastikan backend masih running
- Pastikan ngrok masih running
- Check URL di `api.js` sudah benar
- Check browser console untuk error detail

### CORS Error
- Backend sudah mengizinkan semua origin (`*`)
- Jika masih error, check `main.go` CORS configuration

### Login Gagal
- Pastikan backend API accessible
- Test langsung: `https://e04de0acf391.ngrok-free.app/api/login` (POST)
- Check database connection
- Check JWT_SECRET sudah di-set

---

## 💡 Tips

1. **Keep Terminal Open**: Jangan close terminal ngrok dan backend
2. **Monitor Ngrok Dashboard**: Buka `http://127.0.0.1:4040` untuk monitoring
3. **Check Logs**: Lihat backend logs untuk debugging
4. **Test API Directly**: Test API endpoint langsung via Postman/curl

---

## 📝 Next Steps

Setelah semua berfungsi:
1. Test semua fitur aplikasi
2. Pastikan database connection stabil
3. Consider deploy backend ke cloud untuk production (Railway, Render, dll)

