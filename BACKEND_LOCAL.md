# Menjalankan Backend Manual di Terminal

## ✅ BISA! Backend Bisa Dijalankan Manual

Ya, Anda **BISA** menjalankan backend manual di terminal komputer Anda. Tapi ada syaratnya:

---

## ⚠️ Masalah: Localhost Tidak Bisa Diakses dari Internet

Backend yang running di `localhost:8080` **HANYA bisa diakses dari komputer yang sama**.

- ✅ Bisa diakses dari: `http://localhost:8080` (di komputer yang sama)
- ❌ **TIDAK bisa** diakses dari: Device lain, Vercel frontend, dll.

---

## 🔧 Solusi: Expose Backend ke Internet

Untuk membuat backend yang running di local bisa diakses dari internet, gunakan **tunneling service**.

### Opsi 1: Ngrok (Paling Populer & Mudah) ⭐

#### Install Ngrok:
```bash
# Download dari https://ngrok.com/download
# Atau pakai npm
npm install -g ngrok
```

#### Cara Pakai:
```bash
# 1. Jalankan backend di terminal pertama
go run main.go

# 2. Expose dengan ngrok di terminal kedua
ngrok http 8080
```

Ngrok akan memberikan URL seperti:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:8080
```

**Copy URL ini** dan update di frontend:
```javascript
// web/static/js/api.js
const API_BASE_URL = 'https://abc123.ngrok.io/api';
```

#### Kelebihan Ngrok:
- ✅ Gratis
- ✅ Mudah digunakan
- ✅ HTTPS otomatis
- ✅ Real-time web interface untuk monitoring

#### Kekurangan Ngrok:
- ❌ URL berubah setiap restart (kecuali pakai plan berbayar)
- ❌ Ada batas request untuk free plan

---

### Opsi 2: LocalTunnel (Alternatif Gratis)

#### Install:
```bash
npm install -g localtunnel
```

#### Cara Pakai:
```bash
# Jalankan backend
go run main.go

# Expose dengan localtunnel (di terminal lain)
lt --port 8080
```

Akan memberikan URL: `https://xxx.loca.lt`

---

### Opsi 3: Serveo (Tanpa Install)

#### Cara Pakai:
```bash
# Jalankan backend
go run main.go

# Expose dengan serveo (di terminal lain)
ssh -R 80:localhost:8080 serveo.net
```

---

### Opsi 4: Cloudflare Tunnel (Gratis & Stabil)

#### Install:
```bash
# Download dari https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

#### Cara Pakai:
```bash
# Setup sekali
cloudflared tunnel login
cloudflared tunnel create simplee-k

# Jalankan tunnel
cloudflared tunnel --url http://localhost:8080
```

---

## 📋 Workflow Lengkap

### 1. Start Backend
```bash
# Terminal 1: Jalankan backend
cd "c:\cloud computing\simplee-k"
go run main.go
```

Backend akan running di: `http://localhost:8080`

### 2. Expose dengan Ngrok
```bash
# Terminal 2: Expose ke internet
ngrok http 8080
```

Copy URL yang diberikan, contoh: `https://abc123.ngrok.io`

### 3. Update Frontend
Edit `web/static/js/api.js`:
```javascript
const API_BASE_URL = 'https://abc123.ngrok.io/api';
```

### 4. Push & Redeploy
```bash
git add web/static/js/api.js
git commit -m "Update API URL to ngrok"
git push
```

Vercel akan otomatis redeploy.

### 5. Test
- Buka: `https://simplee-k2.vercel.app`
- Test login dan fitur lainnya

---

## 🔄 Workflow Harian

Setiap kali mau pakai aplikasi:

1. **Start Backend**:
   ```bash
   go run main.go
   ```

2. **Start Ngrok** (di terminal lain):
   ```bash
   ngrok http 8080
   ```

3. **Copy URL baru** (jika URL berubah)

4. **Update API URL** di `api.js` (jika URL berubah)

5. **Push & Redeploy** (jika URL berubah)

---

## 💡 Tips

### 1. Pakai Ngrok dengan Custom Domain (Berbayar)
- URL tidak akan berubah
- Lebih stabil untuk production
- Plan mulai dari $8/bulan

### 2. Pakai Ngrok Web Interface
- Buka: `http://127.0.0.1:4040` (setelah ngrok running)
- Bisa lihat semua request yang masuk
- Berguna untuk debugging

### 3. Auto-restart Backend
Pakai tool seperti `nodemon` atau `air` untuk auto-restart:
```bash
# Install air untuk Go
go install github.com/cosmtrek/air@latest

# Jalankan dengan air
air
```

### 4. Keep Ngrok Running
- Jangan close terminal ngrok
- Jika close, URL akan berubah
- Untuk production, consider deploy backend ke cloud

---

## ⚡ Quick Script untuk Memudahkan

Buat file `start-backend.bat` (Windows):
```batch
@echo off
echo Starting backend...
start cmd /k "go run main.go"
timeout /t 3
echo Starting ngrok...
start cmd /k "ngrok http 8080"
echo Backend and ngrok started!
pause
```

Atau `start-backend.sh` (Linux/Mac):
```bash
#!/bin/bash
echo "Starting backend..."
go run main.go &
sleep 2
echo "Starting ngrok..."
ngrok http 8080
```

---

## 🎯 Kesimpulan

**BISA** run backend manual di terminal, tapi:

1. ✅ **Harus expose dengan ngrok** (atau tool serupa)
2. ✅ **URL akan berubah** setiap restart ngrok (kecuali pakai plan berbayar)
3. ✅ **Backend harus running** setiap kali frontend diakses
4. ✅ **Cocok untuk development/testing**
5. ⚠️ **Tidak cocok untuk production** (lebih baik deploy backend ke cloud)

---

## 📚 Resources

- Ngrok: https://ngrok.com
- Ngrok Docs: https://ngrok.com/docs
- LocalTunnel: https://localtunnel.github.io/www/
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

---

## ❓ FAQ

**Q: Apakah backend harus running terus?**
A: Ya, backend harus running setiap kali frontend diakses. Jika backend mati, frontend tidak bisa connect.

**Q: Apakah URL ngrok bisa permanen?**
A: Ya, dengan plan berbayar. Free plan URL berubah setiap restart.

**Q: Apakah aman pakai ngrok untuk production?**
A: Untuk production, lebih baik deploy backend ke cloud (Railway, Render, dll).

**Q: Apakah bisa pakai database local?**
A: Bisa, tapi database juga harus accessible. Untuk production, lebih baik pakai cloud database.

