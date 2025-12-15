# Panduan JavaScript di Project SIMPEL-K

## ❌ TIDAK PERLU Menjalankan JavaScript Secara Terpisah!

JavaScript di project ini **otomatis dimuat** oleh browser ketika Anda membuka halaman HTML.

## ✅ Cara Kerja JavaScript

### 1. JavaScript Terintegrasi di HTML

Setiap file HTML sudah memiliki tag `<script>` yang memuat JavaScript:

**Contoh di `web/login/code.html`:**
```html
<script src="/static/js/api.js"></script>
<script src="/static/js/login.js"></script>
```

**Contoh di `web/student/code.html`:**
```html
<script src="/static/js/api.js"></script>
<script src="/static/js/student-dashboard.js"></script>
```

### 2. Alur Kerja

1. **User membuka browser** → http://localhost:8080
2. **Server mengirim HTML** → `web/login/code.html`
3. **Browser membaca HTML** → menemukan tag `<script>`
4. **Browser otomatis memuat JavaScript** → dari `/static/js/`
5. **JavaScript langsung berjalan** → tanpa perlu command terpisah

## 📁 Struktur JavaScript

```
web/static/js/
├── api.js                 # API helper functions (diload pertama)
├── login.js              # Login page functionality
├── student-dashboard.js  # Student dashboard functionality
├── admin-dashboard.js    # Admin dashboard functionality
├── submit-complaint.js   # Submit complaint form
└── complaint-details.js # Complaint details page
```

## 🔄 Urutan Loading

JavaScript di-load secara **berurutan** sesuai urutan di HTML:

1. **`api.js`** selalu di-load pertama (berisi fungsi-fungsi dasar)
2. **File spesifik** di-load setelahnya (login.js, student-dashboard.js, dll)

**Contoh:**
```html
<script src="/static/js/api.js"></script>        <!-- Load pertama -->
<script src="/static/js/login.js"></script>      <!-- Load kedua -->
```

## ✅ Yang Perlu Dilakukan

### Hanya Jalankan Server Go:

```bash
go run .
```

**Itu saja!** JavaScript akan otomatis bekerja ketika:
- Anda membuka halaman di browser
- Browser memuat HTML
- Browser otomatis memuat dan menjalankan JavaScript

## 🧪 Testing JavaScript

Untuk memastikan JavaScript bekerja:

1. **Jalankan server:**
   ```bash
   go run .
   ```

2. **Buka browser:** http://localhost:8080

3. **Buka Developer Tools** (F12):
   - Tab **Console** → lihat apakah ada error
   - Tab **Network** → pastikan file `.js` ter-load (status 200)

4. **Cek apakah fungsi bekerja:**
   - Login form bisa di-submit
   - Dashboard menampilkan data
   - Dll

## 🐛 Troubleshooting

### JavaScript tidak bekerja?

1. **Cek Console (F12):**
   - Lihat apakah ada error merah
   - Pastikan file `.js` ter-load (status 200, bukan 404)

2. **Cek Network Tab:**
   - Pastikan `/static/js/api.js` ter-load
   - Pastikan file JavaScript lainnya ter-load

3. **Cek Path:**
   - Pastikan folder `web/static/js/` ada
   - Pastikan semua file `.js` ada di folder tersebut

4. **Restart Server:**
   - Stop server (Ctrl+C)
   - Jalankan lagi: `go run .`

## 📝 Catatan Penting

- ✅ JavaScript **TIDAK perlu di-compile** (seperti Go)
- ✅ JavaScript **TIDAK perlu di-run secara terpisah**
- ✅ JavaScript **otomatis dijalankan oleh browser**
- ✅ Cukup **jalankan server Go**, lalu buka browser

## 🎯 Kesimpulan

**TIDAK PERLU menjalankan JavaScript satu per satu!**

Cukup:
1. `go run .` → Jalankan server
2. Buka browser → http://localhost:8080
3. JavaScript otomatis bekerja! ✨

