# BERSIHIN V3 — Pelaporan Sampah dan Saluran Tersumbat

Website **dua halaman** untuk simulasi pelaporan masalah lingkungan: **tanpa database**, dengan Google Maps, foto bukti, tracking ID unik, dashboard admin grafik lokal otomatis, dan pembaruan hasil penanganan.

## PENTING: Memperbaiki pesan “Failed to fetch”

1. Pastikan alamat website memakai `http://localhost/`, **bukan Live Server** (`127.0.0.1:5500`) atau membuka file `index.html` langsung.
2. Jika kamu masih memakai struktur dua folder, alamatnya:
   - `http://localhost/BERSIHIN_V3_Pelaporan_Sampah_GoogleMaps_Admin/BERSIHIN_V3/index.html`
   - `http://localhost/BERSIHIN_V3_Pelaporan_Sampah_GoogleMaps_Admin/BERSIHIN_V3/resolve_map.php?check=1`
   Jika folder `BERSIHIN_V3` sudah dipindahkan langsung ke `htdocs`, gunakan `http://localhost/BERSIHIN_V3/resolve_map.php?check=1`.
3. Klik **Tes koneksi PHP Google Maps** pada form. Jika muncul JSON dengan `"ok":true`, file PHP bisa dijangkau. Periksa juga `"curl":"aktif"`.
4. Jika status cURL **tidak aktif**, buka `C:\xampp\php\php.ini` dan cari `;extension=curl`. Hapus `;` sehingga menjadi `extension=curl`, simpan, lalu stop/start Apache.
5. Jika PHP berfungsi tetapi Google gagal, periksa internet dan sertifikat SSL PHP. Google juga dapat memblokir/menyembunyikan koordinat pada beberapa tautan pendek. Untuk tugas, masukkan koordinat yang disalin dari Google Maps melalui klik kanan pada pin.

*Catatan:* Pesan `Failed to fetch` berasal dari browser yang tidak berhasil menghubungi endpoint; berbeda dari pesan `Google Maps belum mengembalikan titik` yang berarti PHP sudah bekerja tetapi koordinat tidak dapat dibaca.

## 1. Struktur project

```text
BERSIHIN_V3/
├── index.html         # Website khusus warga
├── admin.html         # Dashboard khusus admin
├── style.css          # Style utama: bagian warga & komponen bersama
├── enhancements.css   # Animasi, dashboard, Google Maps, dan responsive
├── app.js             # Semua fitur, tiket, grafik, foto, tracking
├── resolve_map.php    # Baca link pendek Google Maps lewat redirect (tanpa database)
└── README.md          # Panduan ini
```

Kode HTML, CSS, dan JS sudah ditata **ke bawah** supaya mudah dibaca dan diedit di VS Code. File PHP hanyalah utilitas pembaca link Maps — **tidak memakai database/MySQL**.

## 2. Cara menjalankan agar link Google Maps pendek dapat dipakai

**Penting: jalankan lewat XAMPP dan PHP, bukan Live Server, jika ingin menempel link `maps.app.goo.gl/...`.**

1. Instal/buka **XAMPP**.
2. Ekstrak ZIP, lalu pindahkan **folder `BERSIHIN_V3`** ke `C:\xampp\htdocs\BERSIHIN_V3`.
3. Buka XAMPP Control Panel; klik **Start** pada **Apache**. **MySQL tidak perlu dinyalakan.**
4. Di browser buka **`http://localhost/BERSIHIN_V3/index.html`** untuk warga.
5. Untuk admin buka **`http://localhost/BERSIHIN_V3/admin.html`**.
6. Kedua halaman perlu dibuka dari **alamat awal yang sama** (misalnya keduanya `localhost`, jangan satu `127.0.0.1`), agar data lokalnya sama.
7. Pastikan **extension cURL** aktif di `C:\xampp\php\php.ini` (cari `extension=curl`) dan Apache bisa mengakses internet.

Dengan **Live Server** (port 5500), HTML/CSS/JS tetap bekerja, termasuk **link Maps panjang**, koordinat manual, GPS, foto dan dashboard. **Link pendek membutuhkan endpoint PHP** yang tidak dieksekusi oleh Live Server.

### Cara menggunakan link pendek dari Google Maps

1. Buka Google Maps di HP/browser, pilih **pin lokasi tertentu** (bukan sekadar menampilkan area peta).
2. Klik **Bagikan** → **Salin link**. Contoh format: `https://maps.app.goo.gl/xxxxxxxx`.
3. Tempel link pada form **Titik Lokasi Kejadian** dan klik **Gunakan Titik**.
4. `resolve_map.php` mengikuti redirect Google dan mencoba membaca koordinat yang muncul pada tautan tujuan. Bila berhasil, **latitude, longitude dan Google Maps pratinjau otomatis berubah**.
5. Jika Google tidak memberi koordinat pada URL redirect, website menampilkan pesan jelas; buka Google Maps, salin koordinat, kemudian masukkan latitude & longitude manual.

**Batasan Google:** link pendek tertentu dapat gagal dibaca karena respons Google berbeda-beda, pemblokiran jaringan, atau tidak mengandung koordinat; fitur ini tidak menjamin setiap link dapat diurai. Peta Google tanpa API key ditampilkan sebagai **iframe pratinjau**; klik untuk memilih pin di dalam iframe tidak bisa mengirim koordinat ke website. Gunakan tautan lokasi, GPS, atau koordinat manual.

Link ke Google Maps **Lihat Titik** / **Buka Rute** pada tiket membuka Google Maps sungguhan ke koordinat kejadian yang tersimpan, sehingga bisa dipakai navigasi.

## 3. Alur warga

1. Buka `index.html` → **Buat Laporan**.
2. Isi nama, kategori (sampah liar/saluran tersumbat), judul, dan penjelasan.
3. Unggah **foto kejadian** JPG/PNG/WebP maksimal **8 MB**. Browser mengecilkan foto sebelum menyimpan.
4. Tempel Google Maps atau gunakan GPS/koordinat; tambahkan patokan jalan.
5. Kirim dan simpan kode unik dengan pola `BRH-YYMMDD-XXXXXXXX`, contoh `BRH-261122-A1B2C3D4`.
6. Pada **Lacak Laporan**, masukkan **kode masing-masing** untuk melihat status, riwayat pembaruan, pesan dari admin, serta foto **sebelum dan sesudah** bila penanganan sudah selesai.
7. Daftar **Laporan Publik** menampilkan status dan foto, bukan identitas atau nomor telepon pelapor.

**Setiap klik Kirim Laporan membuat kode baru** dengan bytes acak; 2 laporan yang dibuat berdekatan tetap mendapat kode yang berbeda.

## 4. Alur admin

1. Buka `admin.html` (halaman **berbeda** dari halaman warga).
2. Lihat grafik tren 7 hari, donat status, kategori, dan tingkat penyelesaian. Semua dihitung dari tiket aktual yang tersimpan di browser ini.
3. Pilih salah satu tiket di **Kelola Laporan**.
4. Klik **Verifikasi & ACC** (atau tolak, dengan alasan).
5. Jika penanganan belum selesai, admin dapat **Catat Penerusan ke Pemerintah** dan **Mulai Penanganan**. Ini hanya **catatan simulasi**, bukan koneksi ke instansi nyata.
6. **Jika sudah ditangani, admin dapat langsung dari status Terverifikasi / Diteruskan / Dalam Penanganan**:
   - Unggah **foto hasil penanganan nyata dari admin**.
   - Isi **keterangan hasil penanganan** (minimal 10 karakter).
   - Klik **Selesai & Kirim Hasil ke Pelapor** dan konfirmasi.
7. Status berubah **Selesai** dan bukti foto serta keterangan muncul di **Lacak Laporan** pada halaman warga untuk kode itu.
8. Tombol **Kirim Pembaruan** dapat mencatat pesan tambahan. Tombol **Export JSON** menyimpan salinan data lokal.

Semua perubahan segera memperbarui grafik dan laporan, termasuk antar-tab browser yang sama. **Tanpa server/database, tidak ada notifikasi WhatsApp, sinkronisasi antarperangkat, maupun pengiriman bukti otomatis ke pelapor yang membuka perangkat lain**.

## 5. Foto asli dari Indonesia (contoh demo)

Untuk menghormati lisensi dan menghindari foto Google/Pinterest tanpa izin, foto contoh menggunakan **Wikimedia Commons**. Ketiganya **berbeda** dan berasal dari Indonesia:

| Penggunaan | Foto / lokasi | Fotografer | Lisensi & sumber |
| --- | --- | --- | --- |
| Tiket demo 1 | Sampah Tanjung Priok, Jakarta | Hullie | [CC BY-SA 2.5](https://commons.wikimedia.org/wiki/File:Waste_dump_-_Jakarta_-_Indonesia.jpg) |
| Tiket demo 2 | Sampah di selokan Banjar, Bali | DayakSibiriak | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Waste_in_rain_gutter_near_school_Bali.jpg) |
| Tiket demo 3 | Sampah bantaran Kali Code, Yogyakarta | Crisco 1492 | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Pile_of_garbage_along_the_Code_River,_as_viewed_from_near_Prawirodirjan_-_North.jpg) |
| Visual beranda | Petugas kebersihan Kota Tua, Jakarta | Herusutimbul | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Petugas_Kebersihan_Sungai_Kota_Tua_Jakarta.jpg) |
| Bukti selesai tiket **demo** (ilustrasi, tidak terkait foto sebelumnya) | Kegiatan gotong royong membersihkan sungai | Stanley Teguh | [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Gotong_royong_membersihkan_sungai_dari_sampah._Gotong_royong_adalah_salah_satu_ciri_budaya_bangsa_Indonesia.jpg) |

Foto ditampilkan lewat alamat gambar Wikimedia dan **butuh internet**. Hak foto milik pencipta; atribut kredit juga ditampilkan di footer `index.html` sebagai panel **Kredit foto**. Bila mengganti gambar, pastikan mempunyai izin dan menyertakan atribusi sesuai lisensi.

**Sangat penting:** Titik peta pada *laporan demo* hanyalah perkiraan area contoh, **bukan titik persis foto**. Foto demo **tidak boleh** diklaim sebagai foto hasil penanganan laporan sungguhan. Untuk laporan baru, foto sebelum diunggah pelapor dan foto sesudah **wajib diunggah admin**.

## 6. Penjelasan "real-time" tanpa database

- Semua tiket, catatan, dan foto hasil disimpan dalam `localStorage` browser.
- Grafik dan daftar diperbarui langsung setelah warga/admin melakukan tindakan.
- Perubahan tersebar antar-tab pada **browser, perangkat, dan origin/localhost yang sama** dengan `storage` event.
- Data tetap ada setelah refresh, kecuali jika penyimpanan situs dihapus atau kapasitasnya penuh.
- Website **belum memiliki login admin yang aman** — pemisahan halaman hanyalah antarmuka demo. Jangan pakai untuk pengiriman data pribadi atau pelayanan masyarakat sungguhan.
- Untuk aplikasi nyata: tambahkan backend PHP/Laravel atau Node, database MySQL/PostgreSQL, penyimpanan foto server, akun/peran, pemberitahuan resmi, dan integrasi instansi.

## 7. Contoh kode tiket untuk demonstrasi

- `BRH-DEMO01` — sampah Jakarta, status menunggu verifikasi.
- `BRH-DEMO02` — selokan Bali, dalam penanganan.
- `BRH-DEMO03` — sampah Yogyakarta, status selesai **hanya simulasi**.

**Sumber kode:** edit file `index.html` untuk teks/section, `admin.html` untuk dashboard, `style.css` dan `enhancements.css` untuk warna/efek, `app.js` untuk fungsi dan contoh data, `resolve_map.php` untuk link Maps pendek.
