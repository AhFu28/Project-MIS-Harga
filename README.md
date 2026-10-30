# MIS Harga v0.2

Workspace internal satu tim di Cloudflare Workers + D1, dengan aplikasi upload langsung di beranda. Mengikuti prinsip [Ponytail](https://github.com/DietrichGebert/ponytail): Web APIs/native UI, validasi data harga, perhitungan deterministik, review manusia, dan tes terfokus.

## Alur penggunaan

1. Drop gambar/PDF/XLSX/CSV, atau input manual. CSV/XLSX dipetakan lokal, OCR visual memakai Gemini setelah sign in dan persetujuan pemrosesan.
2. Periksa sumber dan tabel berdampingan. Koreksi harga, unit, kondisi, channel, tanggal dan item. Copy TSV atau download Excel tanpa akun.
3. Simpan draft di D1; folder PT/tanggal terbentuk dari metadata. Draft boleh belum lengkap. Konfirmasi hanya setelah harga/sumber/unit dan mapping standar valid.
4. Admin membuat master item dan menyetujui alias per PT/spesifikasi. Alias persis yang disetujui dapat dipakai ulang; saran mirip tidak otomatis digabung.
5. Kompilasi item × PT dari batch terkonfirmasi. Pilih date range dan PT; klik harga untuk semua sumber. Konflik diberi label dan tidak dipilih sebagai harga utama.
6. Analisis range → preview 10 slide → edit narasi / review usulan AI → download PPTX/PDF. Simpan snapshot angka, filter dan narasi; perubahan sumber berikutnya tidak mengubah snapshot lama.

## Peran dan AI

| Kemampuan | Admin | Editor | Viewer |
|---|---|---|---|
| Baca arsip, kompilasi, report dan ekspor | Ya | Ya | Ya |
| AI bersama, simpan/koreksi/konfirmasi draft, simpan report | Ya | Ya | Tidak |
| API key, katalog model, tes koneksi, engine review | Ya | Tidak | Tidak |
| User, master item dan persetujuan alias | Ya | Tidak | Tidak |

Otorisasi ditegakkan API. Frontend tidak menerima key atau ciphertext. Key terenkripsi AES-GCM di D1; master key hanya runtime Secret. Admin memilih engine review teks/report; OCR gambar/PDF memakai Gemini. OpenRouter hanya model eksplisit `:free` dengan harga katalog nol. Tidak ada fallback berbayar. Katalog bukan bukti inference berhasil: gunakan tombol Tes koneksi. Kuota aplikasi AI 30 permintaan/hari bersama; provider bisa membatasi lebih rendah.

User baru/reset wajib mengganti password sementara. Password reset, perubahan role, dan penonaktifan membatalkan sesi. Admin aktif terakhir dilindungi. Akun bootstrap berasal dari hash runtime, tidak dari password di repository.

## Deployment

Cloudflare Workers Builds: build `npm run build`, deploy `npx wrangler deploy`. Binding D1 `DB`. Environment build `D1_DATABASE_ID` dapat menunjuk database yang sudah ada; jangan mengganti database saat upgrade.

Runtime Secrets:

- `BOOTSTRAP_ADMIN_HASH`: verifier PBKDF2 untuk admin awal `adminF`, hanya dipakai jika tabel user kosong. Mengubahnya tidak mereset user yang sudah dibuat.
- `SETTINGS_ENCRYPTION_KEY`: 32 byte Base64; pertahankan key lama agar konfigurasi provider dapat didekripsi.
- `APP_PASSWORD_HASH`: secret v0.1 boleh dipertahankan saat upgrade; entrypoint v0.2 memakai akun individual.

`GEMINI_FREE_CONFIRMED=true` hanya jika pemilik telah memastikan proyek Gemini tanpa billing. Default false. Isi key via Admin Settings → Fetch model → pilih → Simpan → Tes koneksi. Konfirmasi consent provider sebelum mengirim data.

R2 `DOCUMENTS` opsional, tidak diaktifkan secara default. Tanpa R2, data tabel tersimpan di D1, gambar hanya preview/download lokal dan tidak tersedia lagi setelah perangkat ditutup. Mengaktifkan R2 perlu penilaian biaya akun; allowance gratis bukan jaminan tagihan nol.

## Batas rilis

- Satu workspace tim bersama, bukan isolasi multi-perusahaan. Akses Viewer mencakup seluruh data tim.
- 2 MB/file, 5 file per pilihan upload, 100 baris/batch, maksimal 10.000 observasi kompilasi. PDF besar perlu dipecah. File XLSX/CSV diproses di browser; formula/rich text ditolak.
- Google Sheets publik dibaca satu snapshot CSV tab bernama; tidak menulis sumber dan belum sinkronisasi terjadwal/OAuth. Hasil baca dapat diimpor melalui mapping long/wide.
- Alias/spec harus tepat; belum konversi kg/pack, fuzzy merge massal atau normalisasi master otomatis. Item baru dibuat Admin.
- Tanggal dokumen OCR belum menjadi metadata terpisah yang terstruktur; tanggal upload dan berlaku dibedakan. Metadata tanggal batch berlaku untuk semua baris; pisahkan batch jika periode berbeda.
- Report bersifat deskriptif: observasi mingguan terakhir, perubahan awal–akhir, WoW hanya minggu berurutan. Tanpa forecast, penyebab kausal atau margin. Ringkasan konflik dikeluarkan. Narasi AI tetap perlu review; tidak ada perubahan harga otomatis.
- Maksimum 12 baris tabel dan 6 seri sepadan di slide; ekspor kompilasi menyediakan seluruh detail. Snapshot tidak menyimpan file presentasi; ekspor ulang dari snapshot.
- Tidak ada migrasi arsip RAR atau data supplier asli otomatis. UAT dengan sumber nyata, provider API asli, kapasitas Workers Free dan pemulihan backup perlu diverifikasi terpisah.

## Pengembangan

Node 22+, `npm ci`, `npm test`, `npm run build`, `npx wrangler deploy --dry-run`, `npm run dev`. Jangan commit `.dev.vars`, key, password nyata, data pengguna, dokumen supplier, atau database. Tes memakai data sintetis. Skema upgrade additive mempertahankan tabel v0.1; endpoint lama tetap dilindungi otorisasi v0.2.
