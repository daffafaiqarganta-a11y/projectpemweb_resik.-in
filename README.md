# Resik.In

> **Report Today, Cleaner Tomorrow.**

Resik.In adalah website pelaporan sampah liar dan saluran tersumbat. Melalui website ini, warga dapat mengirim laporan dengan foto, deskripsi, lokasi, serta kategori masalah. Admin kemudian dapat memverifikasi laporan, memperbarui status, mencatat tindak lanjut, dan menampilkan bukti penanganan.

**Live Demo:** [https://bersihin.site.je/](https://bersihin.site.je/)

---

## Latar Belakang

Masalah sampah liar dan saluran air tersumbat sering dilaporkan melalui percakapan pribadi atau secara lisan. Cara tersebut dapat menyebabkan informasi seperti foto, lokasi, deskripsi, dan perkembangan laporan sulit ditelusuri.

Resik.In hadir sebagai prototipe website yang memusatkan proses pelaporan dan pemantauan masalah kebersihan dalam satu alur yang lebih terstruktur dan transparan.

## Tujuan Proyek

- Memudahkan warga dalam melaporkan masalah kebersihan.
- Mengumpulkan foto, lokasi, kategori, dan deskripsi laporan.
- Membantu admin memverifikasi serta mengelola laporan.
- Menampilkan status dan riwayat perkembangan laporan.
- Mendukung partisipasi masyarakat dalam menjaga lingkungan.
- Mendukung **SDG 11: Kota dan Permukiman yang Berkelanjutan**.

---

## Fitur Utama

### Fitur Warga

- Membuat laporan sampah liar atau saluran tersumbat.
- Mengunggah foto kondisi lapangan.
- Menambahkan deskripsi dan kategori laporan.
- Menentukan lokasi menggunakan GPS, Google Maps, atau koordinat manual.
- Melihat daftar laporan publik.
- Mencari dan memfilter laporan.
- Melacak laporan menggunakan kode laporan.
- Melihat status dan riwayat penanganan.

### Fitur Admin

- Melihat ringkasan jumlah laporan.
- Melihat grafik tren laporan.
- Memfilter laporan berdasarkan status dan kategori.
- Memverifikasi atau menolak laporan.
- Mencatat penerusan laporan kepada pihak terkait.
- Memperbarui status penanganan.
- Menambahkan catatan perkembangan.
- Mengunggah foto hasil penanganan.
- Mengekspor data laporan dalam format JSON.

---

## Alur Status Laporan

```text
Menunggu Verifikasi
        ↓
Terverifikasi
        ↓
Diteruskan
        ↓
Dalam Penanganan
        ↓
Selesai
```

Laporan juga dapat berstatus **Ditolak** apabila tidak memenuhi persyaratan atau tidak dapat diverifikasi.

---

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript Vanilla
- Web Storage API atau `localStorage`
- FileReader API
- Canvas API
- Geolocation API
- Google Maps iframe
- PHP dan PHP cURL untuk fitur pembacaan link Google Maps
- Google Fonts: DM Sans dan Manrope

---

## Struktur Repository

```text
.
├── index.html
├── admin.html
├── app.js
├── style.css
├── enhancements.css
├── resolve_map.php
├── config.php
├── tes_koneksi.php
└── README.md
```

| File | Keterangan |
|---|---|
| `index.html` | Halaman warga dan formulir laporan |
| `admin.html` | Dashboard admin |
| `app.js` | Logika utama aplikasi |
| `style.css` | Styling utama website |
| `enhancements.css` | Styling tambahan dan responsive layout |
| `resolve_map.php` | Pemrosesan link pendek Google Maps |
| `README.md` | Dokumentasi proyek |

---

## Instalasi

### Menjalankan dengan Live Server

1. Clone repository:

   ```bash
   git clone https://github.com/daffafaiqarganta-a11y/projectpemweb_resik.-in.git
   ```

2. Buka folder project menggunakan Visual Studio Code.
3. Jalankan file `index.html` menggunakan ekstensi **Live Server**.
4. Untuk membuka dashboard admin, akses file `admin.html`.

> Pada mode Live Server, fitur utama aplikasi tetap dapat digunakan. Namun, fitur pemrosesan link pendek Google Maps membutuhkan PHP dan Apache.

### Menjalankan dengan XAMPP

1. Install dan buka XAMPP.
2. Pindahkan folder project ke:

   ```text
   C:\xampp\htdocs\bersihin
   ```

3. Jalankan **Apache** melalui XAMPP Control Panel.
4. Buka halaman utama:

   ```text
   http://localhost/bersihin/index.html
   ```

5. Buka dashboard admin:

   ```text
   http://localhost/bersihin/admin.html
   ```

6. Untuk mengecek koneksi PHP:

   ```text
   http://localhost/bersihin/resolve_map.php?check=1
   ```

---

## Cara Menggunakan Aplikasi

### Membuat Laporan

1. Buka halaman utama Resik.In.
2. Klik **Buat Laporan**.
3. Isi data pelapor.
4. Pilih kategori laporan.
5. Masukkan judul dan deskripsi masalah.
6. Unggah foto kondisi lapangan.
7. Masukkan lokasi laporan.
8. Klik **Kirim Laporan Sekarang**.
9. Simpan kode laporan yang muncul.

### Melacak Laporan

1. Buka bagian **Lacak Status Laporan**.
2. Masukkan kode laporan.
3. Klik **Lacak**.
4. Lihat status, catatan, lokasi, dan bukti penanganan.

### Mengelola Laporan sebagai Admin

1. Buka halaman `admin.html`.
2. Pilih laporan yang ingin dikelola.
3. Verifikasi atau tolak laporan.
4. Catat penerusan laporan kepada pihak terkait.
5. Perbarui status penanganan.
6. Tambahkan catatan perkembangan.
7. Unggah foto hasil penanganan ketika laporan selesai.

---

## Penyimpanan Data

Resik.In merupakan prototipe frontend. Data laporan disimpan menggunakan `localStorage` pada browser.

Karena belum menggunakan database online:

- Data hanya tersedia pada browser dan perangkat yang sama.
- Data belum tersinkronisasi antarperangkat.
- Dashboard admin belum menggunakan sistem login.
- Penerusan laporan kepada pihak terkait masih berupa simulasi.
- Notifikasi otomatis belum tersedia.

---

## Tim Pengembang

- **Anggit Latifah Kinanti** — H1D025127  
  Creative Strategist & Designer

- **Daffa Faiq Arganta** — H1D025135  
  Full Stack Development & Deployment

- **Moh Faturrohman Cesar Purwoko** — H1D025150  
  Database Designer & Documentation

---
