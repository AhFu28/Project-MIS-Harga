# MIS Harga v0.3

Workspace internal satu tim di Cloudflare Workers + D1. Landing hanya login username/password; halaman, API dan aset workspace memerlukan sesi. Mengikuti prinsip [Ponytail](https://github.com/DietrichGebert/ponytail): Web APIs, UI native, perubahan kecil, validasi bersama, perhitungan deterministik dan review manusia.

## Alur penggunaan

1. **Tambah Harga:** drop gambar/PDF lalu tekan Proses. XLSX/CSV/TSV/TXT dibaca lokal; pilih sheet/kolom jika deteksi belum jelas. Impor tabel dipisahkan per PT/tanggal. JSON cadangan `entries` tersedia dengan verifikasi metadata.
2. **Periksa:** sumber dan tabel berdampingan, pencarian/filter, 50 baris per halaman. Koreksi barang, harga, satuan dan kondisi; Detail memuat SKU, ukuran, potongan, kemasan, MOQ/channel/wilayah/basis. Semua baris ikut ekspor/simpan.
3. **Simpan:** autosave IndexedDB setelah 2 detik diam, paling lambat 10 detik selama perubahan. Tidak ada timer penulisan server. Tombol Simpan sementara menyimpan draft di D1. Simpan harga meminta konfirmasi pemeriksaan seluruh sumber; data final tetap memerlukan field valid. Gambar dilepas setelah simpan berhasil; pilih ulang file yang hash-nya sama untuk memeriksa draft.
4. **Data Harga:** arsip PT/tanggal, lanjutkan draft, copy final ke draft koreksi, tarik versi lama tanpa menghapus histori, download sumber dan kompilasi.
5. **Pembanding:** Admin membuat daftar item prioritas. Item lain tetap tersimpan tanpa harus dipetakan. Aturan persis per PT/nama atau SKU/spesifikasi dipakai ulang; saran nama mirip perlu keputusan manusia. Admin dapat menetapkan konversi pack/BAG ke kg dengan berat bersih terkonfirmasi. Sumber asli dan snapshot master tetap disimpan.
6. **Analisis:** date range/PT, minggu Senin–Minggu, rata-rata seluruh update pada konteks sebanding. Minggu kosong ditandai, bukan diisi nol. Ukuran, potongan, kondisi, MOQ, wilayah, channel dan basis berbeda dipisah. Konflik tidak menjadi headline.
7. **Laporan:** preview 10 slide, narasi dapat diedit, review AI opsional, ekspor PPTX/PDF dan snapshot. Angka dihitung aplikasi; AI tidak menetapkan harga.

## OCR dan angka

Tesseract.js 7 berjalan di browser dengan model English best_int dan WASM yang dibundel pada origin aplikasi. Tidak mengirim gambar ke layanan OCR. Tabel bergrid dengan header berwarna dikenali secara heuristik, dipotong per sel, diperbesar 4×, dan harga dibaca dua kali (asli/pembersihan garis). Hasil berbeda ditandai. Layout lain menghasilkan kandidat baris dan teks mentah untuk koreksi/manual/AI.

Deteksi otomatis **belum menjamin semua blok/barang/tier terbaca**. Kesepakatan dua bacaan juga bukan bukti angka benar. Periksa jumlah baris, unit, judul dan catatan sumber sebelum final. Wahana Fresh: pilih HARGA biasa, bukan HORECA; importer tabel dan prompt AI mengikuti aturan ini, hasil OCR umum tetap harus diperiksa manusia. Semua tier dipertahankan; belum ada pemilihan otomatis tier order terbesar. Angka harga dan angka ukuran/MOQ tidak boleh dicampur.

Format input file dipilih eksplisit US `35,000.50` atau Indonesia `35.000,50`. Hasil edit/ekspor memakai US, maksimal dua desimal; grouping rusak ditolak tanpa mengubah skala. Observasi baru menambah `amount_minor`, `scale=2` dan versi skema secara additive; data lama tidak diskalakan ulang. Konversi kemasan dibulatkan dua desimal, tidak mengubah harga asli.

## Peran dan AI

| Kemampuan | Admin | Editor | Viewer |
|---|---|---|---|
| Baca seluruh data tim dan ekspor | Ya | Ya | Ya |
| Koreksi/simpan/konfirmasi draft, AI bersama, simpan report | Ya | Ya | Tidak |
| API key, model, tes koneksi, engine, akun | Ya | Tidak | Tidak |
| Master pembanding, alias global dan konversi | Ya | Tidak | Tidak |

Pengaturan Admin ada di menu Akun. API menegakkan otorisasi; key terenkripsi AES-GCM di D1 dan tidak dikembalikan ke browser. OpenRouter default `openrouter/free`, atau model `:free` dengan seluruh harga katalog nol. Gemini auto-free memilih katalog dari daftar kebijakan gratis bertanggal; model lain diblokir dan daftar memiliki masa berlaku. Pemilik harus mengonfirmasi proyek Gemini tanpa billing. Tidak ada fallback ke model berbayar. Katalog bukan bukti inference berhasil: gunakan Tes koneksi. Kuota aplikasi AI bersama 30 permintaan/hari, tes koneksi terpisah; provider dapat membatasi lebih rendah. Cache ekstraksi tidak menghabiskan kuota baru. Error provider tidak menghalangi OCR lokal/manual.

User baru/reset wajib mengganti password sementara. Perubahan password/role/status membatalkan sesi; Admin aktif terakhir dilindungi. Jangan menyimpan password bootstrap di kode.

## Deployment

Cloudflare Workers Builds: build `npm run build`, deploy `npx wrangler deploy`. Binding D1 `DB`; build environment `D1_DATABASE_ID` menunjuk database yang sudah ada. Migrasi menambah kolom spesifikasi/aturan tanpa menghapus data. Pertahankan secrets dan database saat upgrade.

Runtime Secrets:

- `BOOTSTRAP_ADMIN_HASH`: verifier PBKDF2 admin awal, hanya untuk tabel user kosong; bukan cara mereset akun yang sudah ada.
- `SETTINGS_ENCRYPTION_KEY`: 32 byte Base64; pertahankan agar key provider lama dapat didekripsi.
- `APP_PASSWORD_HASH`: secret versi lama boleh tetap ada; login sekarang memakai akun individual.

R2 tidak diaktifkan. Tidak ada arsip gambar baru dari alur upload ini. Backup sumber asli tetap tanggung jawab pengguna. Endpoint kompatibilitas lama tetap dilindungi; koneksi Sheets lama Admin-only, tidak ditampilkan sebagai alur utama dan tidak menulis spreadsheet.

## Batas dan validasi

- Satu workspace tim, bukan isolasi beberapa organisasi.
- Antrean 10 file, maksimal 5 MB/file dan total 25 MB. Gambar maksimal 12 MP; fallback OCR satu frame maksimal 6 MP. PDF maksimal 10 halaman, masing-masing render maksimal 6 MP. Satu OCR berjalan pada satu waktu, dapat dibatalkan.
- Preview tabel maksimal 5.000 baris × 100 kolom. Simpan maksimal 500 observasi per batch dan 850 KB payload baris sebelum metadata. Melebihi batas ditolak tanpa memotong; ekspor tetap mencakup seluruh baris. XLSX formula/rich text ditolak; gunakan values. Bantuan AI maksimal 2 MB/gambar; PDF gunakan OCR lokal atau gambar halaman.
- Kompilasi maksimal 10.000 observasi. Analisis memakai data terkonfirmasi saja, tanpa carry-forward, forecast, klaim sebab-akibat atau margin. Minggu pertama/terakhir mengikuti potongan date range pilihan.
- Draft IndexedDB hanya pada browser/perangkat/user itu, bukan sinkronisasi multi-perangkat atau backup; logout menghapus draft lokal setelah peringatan. Draft web memerlukan tombol simpan.
- Koreksi harga final berupa draft baru; pengguna menarik versi lama sebelum final agar tidak terjadi konflik. Belum ada penggantian versi final otomatis.
- Laporan masih 10 slide, maksimum 12 baris tabel dan 6 seri sebanding per grafik. Detail lengkap tersedia melalui ekspor kompilasi. Tidak ada penulisan Google Sheets atau sinkronisasi terjadwal.
- Tes otomatis memakai data sintetis dan provider mock. Pengujian UI memakai API fixture terpisah yang tidak dikirim ke produksi. Akurasi OCR pada semua variasi dokumen, API key nyata, performa perangkat rendah dan beban tim nyata masih perlu UAT.

## Pengembangan

Node 22+, `npm ci`, `npm test`, `npm run build`, `npx wrangler deploy --dry-run`, `npm run dev`. Jangan commit `.dev.vars`, key, password nyata, data supplier/pengguna atau database. Dependensi OCR dibundel saat build; browser tidak mengunduh model dari CDN eksternal.
