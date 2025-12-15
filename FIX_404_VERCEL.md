# Fix 404 Error di Vercel

## Masalah
Setelah deploy ke Vercel, muncul error **404: NOT_FOUND**

## Penyebab
1. Vercel tidak menemukan file index.html di root
2. Routing tidak dikonfigurasi dengan benar
3. Output Directory tidak sesuai

## Solusi yang Sudah Diterapkan

### 1. ✅ File `web/index.html` dibuat
- File redirect ke `/login.html`
- Memastikan root path (`/`) bisa diakses

### 2. ✅ `vercel.json` diperbaiki
- Routing untuk semua halaman sudah dikonfigurasi
- Rewrites untuk semua route yang ada

### 3. ✅ Konfigurasi Vercel
Pastikan di Vercel Dashboard:
- **Output Directory**: `web`
- **Root Directory**: `./` (atau kosong)
- **Build Command**: (kosong)
- **Framework Preset**: `Other`

## Langkah Perbaikan

### 1. Push perubahan ke GitHub
```bash
git add .
git commit -m "Fix 404 error - add index.html and update vercel.json"
git push
```

### 2. Redeploy di Vercel
- Vercel akan otomatis redeploy setelah push
- Atau manual: Go to Vercel Dashboard > Deployments > Redeploy

### 3. Test URL
Setelah redeploy, test:
- `https://your-app.vercel.app/` → Should redirect to login
- `https://your-app.vercel.app/login` → Should show login page
- `https://your-app.vercel.app/admin/dashboard` → Should show admin dashboard

## Jika Masih Error 404

### Check 1: Pastikan file ada di folder `web/`
```bash
# Pastikan file-file ini ada:
web/login.html
web/admin-dashboard.html
web/student-dashboard.html
web/index.html
```

### Check 2: Pastikan Output Directory benar
Di Vercel Dashboard:
- Settings > General > Output Directory = `web`

### Check 3: Check Vercel Logs
- Go to Vercel Dashboard > Deployments
- Click pada deployment terbaru
- Check "Build Logs" untuk error

### Check 4: Test file langsung
Coba akses file langsung:
- `https://your-app.vercel.app/login.html` (harusnya bisa)
- Jika bisa, berarti routing yang bermasalah
- Jika tidak bisa, berarti file tidak ter-deploy

## Alternative: Gunakan Root Directory = `web`

Jika masih error, coba ubah di Vercel Dashboard:
- **Root Directory**: `web` (bukan `./`)
- **Output Directory**: `.` (bukan `web`)

Ini akan membuat Vercel langsung serve dari folder `web/`

## Catatan Penting

- Setelah fix, pastikan **update API URL** di `web/static/js/api.js`
- Backend harus sudah di-expose (ngrok atau cloud)
- Test semua halaman setelah fix

