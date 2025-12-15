# Quick Deploy Guide - Vercel + Backend Local

## 🚀 Cara Cepat Deploy Frontend ke Vercel

### Prasyarat:
- Akun Vercel (gratis): https://vercel.com
- Backend sudah running di `localhost:8080`
- Ngrok (untuk expose backend): https://ngrok.com

---

## Langkah 1: Expose Backend dengan Ngrok

### Install Ngrok:
```bash
# Windows: Download dari https://ngrok.com/download
# Atau pakai npm
npm install -g ngrok
```

### Jalankan Backend:
```bash
# Di terminal pertama
go run main.go
```

### Expose dengan Ngrok:
```bash
# Di terminal kedua
ngrok http 8080
```

**Copy URL yang diberikan**, contoh: `https://abc123.ngrok.io`

⚠️ **Catatan**: URL ngrok akan berubah setiap restart (kecuali pakai plan berbayar)

---

## Langkah 2: Update API URL di Frontend

### Opsi A: Update Langsung di api.js (Sementara)
Edit `web/static/js/api.js`:
```javascript
const API_BASE_URL = 'https://abc123.ngrok.io/api'; // Ganti dengan URL ngrok Anda
```

### Opsi B: Inject via Script Tag (Lebih Fleksibel)
Tambahkan di setiap HTML file sebelum `api.js`:
```html
<script>
    window.API_BASE_URL = 'https://abc123.ngrok.io/api';
</script>
<script src="/static/js/api.js"></script>
```

---

## Langkah 3: Deploy ke Vercel

### Via GitHub (Recommended):

1. **Push ke GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Import ke Vercel**:
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import dari GitHub
   - **Root Directory**: `web` (atau biarkan kosong)
   - **Build Command**: (kosongkan)
   - **Output Directory**: `web`
   - Click Deploy

3. **Set Environment Variable** (Optional):
   - Go to Project Settings > Environment Variables
   - Add: `API_BASE_URL` = `https://abc123.ngrok.io/api`
   - **Tapi ini tidak akan bekerja untuk static HTML**, jadi lebih baik pakai Opsi B di atas

### Via Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd "c:\cloud computing\simplee-k"
vercel --prod
```

---

## Langkah 4: Update CORS di Backend (Jika Perlu)

Backend sudah mengizinkan semua origin (`*`), jadi seharusnya tidak perlu diubah.

Jika ada masalah CORS, pastikan di `main.go`:
```go
c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
```

---

## ⚡ Quick Script untuk Update API URL

Buat file `update-api-url.js`:
```javascript
const fs = require('fs');
const path = require('path');

const ngrokUrl = process.argv[2]; // Get from command line
if (!ngrokUrl) {
    console.error('Usage: node update-api-url.js <ngrok-url>');
    process.exit(1);
}

const apiJsPath = path.join(__dirname, 'web', 'static', 'js', 'api.js');
let content = fs.readFileSync(apiJsPath, 'utf8');

// Replace API_BASE_URL
content = content.replace(
    /const API_BASE_URL = .*?;/,
    `const API_BASE_URL = 'https://${ngrokUrl}/api';`
);

fs.writeFileSync(apiJsPath, content);
console.log(`✅ Updated API_BASE_URL to: https://${ngrokUrl}/api`);
```

Usage:
```bash
node update-api-url.js abc123.ngrok.io
```

---

## 🔄 Workflow Harian

1. **Start Backend**:
   ```bash
   go run main.go
   ```

2. **Start Ngrok** (di terminal lain):
   ```bash
   ngrok http 8080
   ```

3. **Update API URL** (jika ngrok URL berubah):
   - Copy URL baru dari ngrok
   - Update di `api.js` atau script tag

4. **Redeploy ke Vercel** (jika perlu):
   ```bash
   vercel --prod
   ```

---

## 🎯 Solusi Permanen (Recommended untuk Production)

Untuk production, **deploy backend juga ke cloud**:

### Railway (Gratis):
1. Sign up: https://railway.app
2. New Project > Deploy from GitHub
3. Auto-detect Go
4. Set environment variables
5. Dapat URL: `https://your-app.railway.app`
6. Update API URL di frontend ke: `https://your-app.railway.app/api`

### Render (Gratis):
1. Sign up: https://render.com
2. New Web Service
3. Connect GitHub
4. Build: `go build -o app`
5. Start: `./app`
6. Dapat URL: `https://your-app.onrender.com`

---

## ❓ Troubleshooting

### CORS Error
- Pastikan backend CORS mengizinkan origin Vercel
- Check browser console untuk error detail

### API Connection Failed
- Pastikan ngrok masih running
- Check URL di api.js sudah benar
- Pastikan backend masih running

### Environment Variable tidak bekerja
- Static HTML tidak bisa baca env var langsung
- Gunakan script tag injection atau update langsung di api.js

---

## 📝 Catatan

- **Ngrok URL berubah setiap restart** (kecuali pakai plan berbayar)
- **Backend harus running** setiap kali frontend diakses
- **Untuk production**, deploy backend ke cloud (Railway/Render)
- **Database** juga perlu accessible (pakai cloud database)

