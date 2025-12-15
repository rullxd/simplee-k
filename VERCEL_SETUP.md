# Vercel Setup Guide untuk Static HTML

## Framework Preset yang Harus Dipilih

### ✅ Pilih: **"Other"** atau **"Static Site"**

**JANGAN pilih:**
- ❌ Blitz.js (Legacy)
- ❌ Next.js
- ❌ React
- ❌ Vue
- ❌ Angular
- ❌ Framework lainnya

**Pilih:**
- ✅ **Other** (Recommended)
- ✅ **Static Site** (jika ada opsi ini)

---

## Konfigurasi Vercel yang Benar

### 1. Framework Preset
- **Pilih**: `Other` atau `Static Site`

### 2. Root Directory
- **Isi**: `./` (atau kosongkan)
- Atau: `web` (jika ingin spesifik)

### 3. Build Command
- **Isi**: (KOSONGKAN)
- Atau: `echo 'No build needed'`
- **Jangan isi**: `npm run build` atau command build lainnya

### 4. Output Directory
- **Isi**: `web`
- Ini adalah folder yang berisi file HTML, CSS, JS

### 5. Install Command
- **Isi**: (KOSONGKAN)
- Tidak perlu install dependencies karena ini static files

---

## Konfigurasi Lengkap di Vercel Dashboard

```
Framework Preset: Other
Root Directory: ./
Build Command: (kosong)
Output Directory: web
Install Command: (kosong)
```

---

## Setelah Deploy

1. **Update API URL** di `web/static/js/api.js`:
   ```javascript
   const API_BASE_URL = 'https://your-ngrok-url.ngrok.io/api';
   ```

2. **Redeploy** jika sudah update API URL

---

## Troubleshooting

### Jika Deploy Gagal:
- Pastikan **Output Directory** = `web`
- Pastikan **Build Command** kosong atau minimal
- Pastikan **Framework Preset** = `Other`

### Jika File Tidak Muncul:
- Check **Root Directory** sudah benar
- Check **Output Directory** = `web`
- Pastikan file HTML ada di folder `web/`

---

## Catatan

- Vercel akan otomatis serve static files dari folder `web`
- Tidak perlu build process untuk static HTML
- Pastikan backend sudah di-expose (ngrok atau cloud)

