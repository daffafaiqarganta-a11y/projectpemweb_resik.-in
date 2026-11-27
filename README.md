Resik.In

Resik.In adalah prototipe website pelaporan sampah liar dan saluran tersumbat. Warga dapat mengirim laporan dengan nama, kategori masalah, judul, deskripsi, foto kondisi, alamat atau patokan, serta titik koordinat. Laporan kemudian dapat dipantau secara publik dan dikelola melalui Dashboard Admin.

Live demo: 
https://bersihin.site.je/

Latar Belakang
Masalah sampah liar dan saluran air tersumbat membutuhkan informasi yang jelas agar dapat ditindaklanjuti. Laporan yang hanya disampaikan secara lisan atau melalui percakapan pribadi dapat kehilangan detail penting, seperti foto, lokasi, deskripsi, dan riwayat penanganan.

Resik.In menawarkan satu alur pelaporan yang terdiri dari pengiriman laporan, verifikasi admin, pencatatan penerusan kepada pihak terkait, pembaruan status, dan dokumentasi hasil penanganan. Website ini dibuat sebagai prototipe untuk menunjukkan bagaimana proses pelaporan lingkungan dapat dibuat lebih terstruktur dan transparan.

Tujuan Proyek
- Menyediakan formulir digital untuk melaporkan sampah liar dan saluran tersumbat.
- Mengumpulkan informasi laporan berupa kategori, judul, deskripsi, foto, alamat, dan koordinat.
- Menampilkan laporan publik beserta status terbarunya.
- Membantu admin memverifikasi, menolak, meneruskan, dan memperbarui laporan.
- Menyediakan riwayat aktivitas dan bukti foto sebelum serta sesudah penanganan.
- Menunjukkan konsep partisipasi warga untuk mendukung SDG 11: Kota dan Permukiman yang Berkelanjutan.

Fitur dan Modul
Halaman warga — index.html
- Beranda dengan penjelasan singkat tentang Resik.In
- Statistik laporan: total laporan, perlu verifikasi, dalam proses, dan selesai.
- Bagian “Cara Kerja” dengan empat tahap utama.
- Daftar laporan publik.
- Pencarian laporan berdasarkan kode, judul, lokasi, atau deskripsi.
- Filter laporan berdasarkan status.
  Filter laporan berdasarkan kategori:
  - Sampah Liar
  - Saluran Tersumbat
- Detail laporan dalam modal.
- Formulir pembuatan laporan baru.
- Validasi nama, kategori, judul, deskripsi, foto, koordinat, dan alamat.
- Unggah foto kondisi awal dengan format JPG, PNG, atau WebP.
- Batas ukuran foto maksimal 8 MB sebelum diproses oleh browser.
- Kompresi foto menggunakan Canvas API sebelum disimpan.
- Penentuan lokasi menggunakan:
  - Tombol GPS
  - Link Google Maps
  - Latitude dan longitude manual.
- Pratinjau lokasi menggunakan Google Maps iframe.
- Pelacakan laporan menggunakan kode otomatis, misalnya BRH-261122-A1B2C3D4.
- Riwayat progres laporan.
- Tampilan foto awal dan foto hasil penanganan.
- Link untuk melihat titik dan rute laporan di Google Maps.

Dashboard admin — admin.html
- Ringkasan dashboard admin.
- Kartu metrik:
  - Total Laporan Masuk
  - Menunggu Verifikasi
  - Dalam Tindak Lanjut
  - Sudah Selesai
- Grafik tren laporan 7 hari terakhir.
- Grafik distribusi status laporan.
- Grafik klasifikasi jenis masalah.
- Ringkasan kinerja penanganan.
- Pencarian berdasarkan ID, lokasi, pelapor, atau judul.
- Filter berdasarkan status.
- Filter berdasarkan kategori.
- Daftar tiket laporan.
- Detail laporan dan informasi pelapor privat.
- Tampilan koordinat dan lokasi laporan pada Google Maps.
- Verifikasi dan persetujuan laporan.
- Penolakan laporan dengan alasan.
- Pencatatan penerusan laporan kepada pemerintah atau instansi terkait.
- Pembaruan status menjadi “Dalam Penanganan”.
- Pengiriman pesan atau pembaruan kepada pelapor.
- Unggah foto hasil penanganan.
- Penyelesaian laporan dengan keterangan dan foto hasil yang wajib tersedia.
- Export data laporan dalam format JSON.

Alur Status Laporan
Plain Text
Menunggu Verifikasi
        ↓
Terverifikasi
        ↓
Diteruskan
        ↓
Dalam Penanganan
        ↓
Selesai

Laporan juga dapat berstatus Ditolak apabila tidak memenuhi persyaratan atau tidak dapat diverifikasi.

Teknologi yang Digunakan
- HTML5 untuk struktur halaman warga dan dashboard admin.
- CSS3 untuk layout, responsive design, komponen UI, animasi, warna, dan tipografi.
- JavaScript vanilla untuk validasi form, render laporan, filter, pencarian, dashboard, grafik, modal, tracking, dan interaksi admin.
- Web Storage API / localStorage untuk menyimpan laporan pada browser.
- FileReader API dan Canvas API untuk membaca, mengompres, dan menampilkan foto.
- Geolocation API untuk membantu mengambil lokasi GPS pengguna.
- Google Maps iframe untuk pratinjau lokasi serta tautan titik dan rute.
- PHP 7.4+ atau lebih baru secara opsional melalui resolve_map.php untuk memproses link pendek Google Maps.
- PHP cURL extension untuk mengikuti redirect link Google Maps apabila koordinat belum tersedia langsung pada URL.
- Google Fonts dengan font DM Sans dan Manrope.

Struktur Repository
Plain Text
.
├── index.html          # Halaman utama warga dan formulir laporan
├── admin.html          # Dashboard admin
├── app.js              # Logika aplikasi dan penyimpanan data browser
├── style.css           # Style utama website
├── enhancements.css    # Style tambahan, animasi, Google Maps, dan dashboard admin
├── resolve_map.php     # Endpoint opsional untuk membaca link pendek Google Maps
├── config.php          # Konfigurasi database lama / opsional
├── tes_koneksi.php     # Script uji koneksi database lama / opsional
└── README.md           # Dokumentasi proyek

Persyaratan Sistem
Untuk menjalankan frontend secara lokal:
- Browser modern seperti Google Chrome, Microsoft Edge, atau Mozilla Firefox.
- Web server lokal atau static server, misalnya VS Code Live Server, XAMPP, atau Apache.
Untuk menggunakan pemrosesan link pendek Google Maps melalui resolve_map.php:
- XAMPP atau Apache dengan PHP.
- PHP cURL extension aktif.
- Koneksi internet.

Instalasi dan Konfigurasi
Opsi 1 — Menjalankan sebagai frontend statis
1. Clone repository:
Bash
git clone https://github.com/daffafaiqarganta-a11y/projectpemweb_resik.-in.git
cd projectpemweb_resik.-in
2. Buka folder project menggunakan VS Code.
3. Jalankan index.html menggunakan ekstensi Live Server, atau buka file tersebut langsung melalui browser.
4. Untuk membuka dashboard admin, akses:
   Plain Text
   admin.html
   Pada mode frontend statis, fitur utama pelaporan dan dashboard dapat berjalan menggunakan localStorage. Namun, pemrosesan link pendek Google Maps melalui PHP tidak berjalan apabila website hanya dibuka dengan Live Server atau langsung dari file lokal.

Opsi 2 — Menjalankan menggunakan XAMPP dan Apache
1. Install XAMPP.
2. Salin folder repository ke direktori htdocs, misalnya:
   Plain Text
   C:\xampp\htdocs\bersihin
3. Jalankan Apache melalui XAMPP Control Panel.
4. Buka halaman utama melalui:
   Plain Text
   http://localhost/bersihin/index.html
5. Buka halaman pengecekan PHP berikut untuk memastikan endpoint aktif:
   Plain Text
   http://localhost/bersihin/resolve_map.php?check=1
   Jika berhasil, endpoint akan memberikan respons JSON yang menandakan PHP Resik.In aktif.
6. Untuk menggunakan link pendek Google Maps, pastikan ekstensi cURL aktif pada PHP. Pada XAMPP, buka php.ini, pastikan baris berikut tidak diawali tanda titik koma:
   Plain Text
   extension=curl
7. Restart Apache setelah mengubah php.ini.

Cara Menjalankan Aplikasi
Halaman warga
1. Buka index.html.
2. Klik Buat Laporan atau Laporkan Sekarang.
3. Isi nama pelapor dan nomor WhatsApp jika diperlukan.
4. Pilih jenis laporan.
5. Masukkan judul serta keterangan kondisi.
6. Unggah foto kondisi awal.
7. Tentukan lokasi dengan GPS, link Google Maps, atau koordinat manual.
8. Isi nama jalan atau patokan lokasi.
9. Klik Kirim Laporan Sekarang.
10. Simpan kode laporan yang muncul.

Melacak laporan
1. Buka bagian Lacak Status Laporan.
2. Masukkan kode laporan.
3. Klik Lacak.
4. Lihat status, riwayat aktivitas, lokasi, serta foto sebelum dan sesudah penanganan.

Dashboard admin
1. Buka admin.html atau klik Dashboard Admin dari halaman utama.
2. Pilih tiket dari daftar laporan.
3. Gunakan tombol sesuai status laporan:
   - Verifikasi & ACC untuk laporan baru.
   - Tolak Laporan untuk laporan yang tidak memenuhi syarat.
   - Catat Penerusan ke Pemerintah untuk laporan terverifikasi.
   - Mulai Penanganan untuk laporan yang sudah diteruskan.
   - Selesai & Kirim Hasil ke Pelapor setelah mengunggah foto dan menulis keterangan hasil.
   - Kirim Pembaruan untuk menambahkan catatan tanpa mengubah tahap utama.
4. Gunakan pencarian, filter status, atau filter kategori untuk menemukan laporan tertentu.
5. Gunakan Export JSON untuk mengunduh data laporan dari browser.

Penyimpanan Data dan Batasan Prototipe
- Data laporan disimpan di localStorage browser dengan key bersihin_reports_v1.
- Data tidak tersimpan pada server atau database dalam alur aplikasi aktif.
- Data dapat terlihat antar-tab pada browser dan perangkat yang sama.
- Data tidak otomatis tersinkronisasi ke browser atau perangkat lain.
- Dashboard admin tidak menggunakan autentikasi login.
- Penerusan kepada pemerintah atau instansi terkait hanya berupa pencatatan simulasi.
- Website belum mengirim notifikasi otomatis kepada pemerintah, admin, petugas, atau pelapor.
- Statistik awal dapat berisi data contoh.
- Foto demo, koordinat demo, dan status demo bukan bukti penanganan sungguhan.
- Fitur Google Maps menggunakan iframe dan link Google Maps; aplikasi tidak menggunakan Google Maps API key pada implementasi ini.

Privasi dan Keamanan
- Nama dan nomor WhatsApp pelapor ditampilkan pada panel admin lokal, bukan pada daftar laporan publik.
- Jangan mengunggah wajah, dokumen, nomor rumah, atau informasi pribadi orang lain tanpa izin.
- Jangan memasukkan password, API key, atau kredensial database ke dalam repository public.
- Sebelum deployment, periksa kembali file konfigurasi dan hapus kredensial yang tidak diperlukan.

Catatan Konfigurasi Database
File config.php dan tes_koneksi.php tersedia di repository sebagai konfigurasi atau uji koneksi PHP lama, tetapi alur frontend yang digunakan saat ini menyimpan data melalui localStorage dan tidak memanggil database.
Jika fitur database ingin dikembangkan pada tahap berikutnya, kredensial database harus dipindahkan ke environment variable atau konfigurasi server yang tidak di-commit ke repository public.

Tim Pengembang
- Anggit Latifah Kinanti — H1D025127 — Creative Strategist & Designer
- Daffa Faiq Arganta — H1D025135 — Full Stack Development & Deployment
- Moh Faturrohman Cesar Purwoko — H1D025150 — Database Designer & Documentation
