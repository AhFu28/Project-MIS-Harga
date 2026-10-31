# MIS Harga v0.3.4

Workspace internal satu tim di Cloudflare Workers + D1. Landing hanya login username/password; halaman, API dan aset workspace memerlukan sesi. Mengikuti prinsip [Ponytail](https://github.com/DietrichGebert/ponytail): Web APIs, UI native, perubahan kecil, validasi bersama, perhitungan deterministik dan review manusia.

## Alur penggunaan

1. **Tambah Harga:** drop gambar/PDF lalu tekan Proses. XLSX/CSV/TSV/TXT dibaca lokal; pilih sheet/kolom jika deteksi belum jelas. Impor tabel dipisahkan per PT/tanggal. JSON cadangan `entries` tersedia dengan verifikasi metadata.
2. **Periksa:** sumber dan tabel berdampingan, pencarian/filter, 50 baris per halaman, pilihan kategori/satuan, tambah/hapus dengan undo, pindah baris dan urutkan nama/kategori/harga. Nomor urut ada pada kolom tersendiri. Koreksi barang, harga, satuan dan kondisi; Catatan sumber yang bisa dibuka memuat SKU, ukuran, potongan, kemasan dan MOQ/channel/wilayah/basis; tidak diperlukan dialog Detail untuk pekerjaan biasa. Semua baris ikut ekspor/simpan.
3. **Simpan:** autosave IndexedDB setelah 2 detik diam, paling lambat 10 detik selama perubahan. Tidak ada timer penulisan server. Tombol Simpan sementara menyimpan draft di D1. Simpan harga meminta konfirmasi pemeriksaan seluruh sumber; kekurangan metadata/isian ditampilkan dengan nomor baris. Error API ditampilkan di dalam dialog sehingga tidak tertutup backdrop; sumber lokal tetap ada ketika konfirmasi gagal. Gambar dilepas setelah simpan berhasil; pilih ulang file yang hash-nya sama untuk memeriksa draft.
4. **Harga Seragam:** tabel Company, Tahun week ISO, Week, Tanggal Harga dan 22 kolom item sesuai daftar tim. Pilih rata-rata mingguan atau per tanggal, satuan dan kondisi; sel menyimpan jejak sumber. Copy/Excel mencakup seluruh halaman; ekspor menambahkan konteks satuan/kondisi/MOQ agar tidak hilang. **Arsip PT & tanggal:** arsip PT/tanggal, lanjutkan draft, copy final ke draft koreksi, tarik versi lama tanpa menghapus histori, download sumber dan kompilasi.
5. **Kategori item:** pengguna memilih salah satu dari 22 nama item standar langsung pada baris, tanpa membuat master/spesifikasi dahulu. Item tanpa kategori tetap tersimpan di arsip. Admin dapat mengingat kategori untuk PT/nama atau SKU/spesifikasi yang sama; SKU berganti nama tidak diterapkan otomatis. Aturan master/alias lama tetap didukung. Pengguna dapat memeriksa dan mengubah berat bersih per pack/BAG/karton/ekor/pcs untuk konversi per kg; massa gram/ton memakai faktor tetap. Konversi memerlukan konfirmasi, tidak mengubah harga sumber, dan tidak membuat aturan global kecuali Admin.
6. **Analisis:** date range/PT, minggu Senin–Minggu, rata-rata seluruh update pada konteks sebanding. Minggu kosong ditandai, bukan diisi nol. Ukuran, potongan, kondisi, MOQ, wilayah, channel dan basis berbeda dipisah. Konflik tidak menjadi headline.
7. **Laporan:** preview 10 slide, narasi dapat diedit, review AI opsional, ekspor PPTX/PDF dan snapshot. Angka dihitung aplikasi; AI tidak menetapkan harga.

## OCR dan angka

Tesseract.js 7 berjalan di browser dengan model English best_int dan WASM yang dibundel pada origin aplikasi. Tidak mengirim gambar ke layanan OCR. Deteksi tata letak dijalankan pada worker terpisah dari UI. Tabel dengan header berwarna dan garis abu/gelap dikenali secara heuristik. Jika tidak ditemukan, detektor garis mencari tabel putih tanpa bergantung warna header, mengabaikan baris judul yang melintang, dan memerlukan header harga yang dikenali. Kolom diperbesar 1–4× sesuai batas piksel, latar/batas garis dibersihkan dan setiap kata disejajarkan ke batas baris sumber. Sel harga meragukan dapat dibaca ulang hingga 4×. Layout lain menghasilkan kandidat baris dan teks mentah; ID baris serta posisi vertikal mencegah penggabungan baris bertetangga. Judul Price List, metadata kontak/tanggal dan nomor urut umum disaring; semua tier tetap dipertahankan untuk review. Urutan kata memakai baris teks dan posisi kiri–kanan, bukan selisih tinggi glyph. Kolom Berat/Weight dikecualikan dari harga, disimpan sebagai berat/kemasan sumber dan tampil pada editor. Berat kg/gram/ons boleh mengisi saran berat pada dialog konversi, tetapi tidak menetapkan satuan penjualan atau mengaktifkan konversi tanpa konfirmasi. Berat dibaca melalui kolom dan sel; bila kedua bacaan valid tetapi berbeda, keduanya ditampilkan untuk koreksi dan tidak dipilih otomatis sebagai berat konversi. Kata fresh/frozen yang eksplisit pada kolom kondisi atau nama produk dapat dibaca sebagai kondisi; kolom Fresh/Frozen yang ambigu tetap perlu keputusan pengguna.

Deteksi otomatis **belum menjamin semua blok/barang/tier terbaca**. Teks yang terbaca dan harga yang lolos format belum membuktikan angka benar. Periksa jumlah baris, unit, judul dan catatan sumber sebelum final. Wahana Fresh: pilih HARGA biasa, bukan HORECA; importer tabel dan prompt AI mengikuti aturan ini, hasil OCR umum tetap harus diperiksa manusia. Semua tier dipertahankan; belum ada pemilihan otomatis tier order terbesar. Angka harga dan angka ukuran/MOQ tidak boleh dicampur.

Pada OCR saja, pemisah titik/koma dan spasi ribuan yang tertukar dapat dinormalkan jika memenuhi salah satu grammar ketat, tanpa menyambung dua harga. Format input file tabel dipilih eksplisit US `35,000.50` atau Indonesia `35.000,50`. Hasil edit/ekspor memakai US, maksimal dua desimal; grouping rusak ditolak tanpa mengubah skala. Library Excel/PPT/PDF dimuat saat fitur dipakai. Pengubahan sel tidak menggambar ulang seluruh tabel; ringkasan/pencarian ditunda singkat agar pengetikan ringan.

Observasi baru menambah `amount_minor`, `scale=2` dan versi skema secara additive; data lama tidak diskalakan ulang. Konversi kemasan dibulatkan dua desimal, tidak mengubah harga asli.

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

## v0.3.3 OCR and responsiveness audit

- Full ruled grids take precedence over colored product highlights. Pale lines and two-level quantity headers are recognized; header-only inference never invents a selling unit.
- Dense tables use bounded cell reads. Numeric cells no longer use the horizontal-stroke eraser, which could erase digits in narrow columns. Conflicting reads leave an empty price for correction; unreadable source rows remain visible.
- OCR stage progress and visible quantity-tier labels. AI requests have a two-minute browser timeout and cannot overlap another extraction.
- Extra row metadata is created only when expanded; source-row numbering is linear; independent admin settings requests run concurrently.
- No new dependency or paid OCR service. Unlimited-OCR was reviewed through its official README: Python/CUDA inference requires separate infrastructure and is not embedded in this Worker.

Validation limitation: synthetic parser/grid/security tests are automated. An intermediate browser check of a small screenshot crop still had inaccurate text/numbers. The last numeric-cell correction could not be browser-verified because the browser approval service reached its usage limit. No accuracy percentage or user-device speedup is claimed. Original-resolution supplier files and end-to-end browser regression remain required before treating extraction as reliable. Gemini Auto free is configured separately from code; live inference/key validity remains unverified.

## v0.3.4 source-aligned OCR corrections

- Suppress overlapping table regions, retain the left product column, and re-read missing product cells. Blank source gaps and document notes are excluded.
- Preserve product names across currency-prefixed quantity tiers. Re-read tier headers at higher resolution, normalize dark header polarity, and flag disagreements. Select ordinary prices before HORECA.
- Treat suspicious leading-zero grouped prices as unreadable. Keep incomplete values for review rather than inventing digits.
- Red-heavy promotional posters currently fail explicitly with AI/manual guidance; this is a bounded sample heuristic, not a universal layout classifier.
- Use explicit source-header condition evidence rather than filenames; mixed Fresh/Frozen cells remain ambiguous. Support spaced and cross-month filename date proposals.
- Overlapping validity windows alone no longer invalidate update averages; contradictory same-date prices remain conflicts. All updates and original dates remain stored.
- Gemini inline extraction uses a JSON response schema; malformed/empty/oversized AI tables cannot replace prior work. Failed OCR preserves the prior table and reports failure. Bitmap resources close on failure; individual OCR reads time out after 60 seconds.

Validation: private supplier samples are integration inputs, never public fixtures. Row count and test-suite success are not extraction accuracy. Product spelling, size, selling unit, quantity tiers and completeness still require source review. Browser timing and live provider inference must be verified separately. No new database migration or automatic AI/paid fallback is introduced.
