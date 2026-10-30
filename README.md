# MIS Harga

Aplikasi internal harga mingguan untuk Cloudflare Workers Free + D1. Login password bersama, input/review harga, impor/ekspor Excel, audit, serta pengaturan Gemini/OpenRouter.

**Status v0.1:** kode pilot tersedia; belum diuji pada akun Cloudflare pemilik atau dengan API key asli. Siap dicoba deploy, belum dinyatakan siap produksi/data final.

## Deploy pertama

Pada halaman Cloudflare yang sudah dibuka:

| Isian | Nilai |
|---|---|
| Repository | AhFu28/Project-MIS-Harga |
| Project name | project-mis-harga |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory / Path | root repo; biarkan default |
| Preview builds | OFF |
| Protect with Cloudflare Access | OFF; aplikasi memiliki login |

**Setelah commit aplikasi tersedia di main dan GitHub Checks lulus, boleh klik Deploy.** Tidak perlu key AI dahulu. Wrangler mendeklarasikan D1 binding `DB` dan akan mencoba membuat/menautkan database otomatis. R2 tidak diaktifkan default.

Setelah deployment sukses:

1. Buka URL Worker → **Panduan setup pertama**, atau `/setup.html`.
2. Isi password pilihanmu pada generator lokal browser. Nilai password tidak dikirim oleh generator.
3. Salin `APP_PASSWORD_HASH` dan `SETTINGS_ENCRYPTION_KEY` hasil generator ke **Worker → Settings → Variables and Secrets → Secret runtime**. Jangan tempel ke repo/chat.
4. Simpan/deploy perubahan secret. Buka kembali URL utama dan login.
5. Masukkan key AI melalui **Settings AI** jika sudah tersedia. Gunakan mode manual sebelum itu.

Detail konfigurasi, fallback provisioning, kuota, dan cara mengaktifkan Gemini/R2: **[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Yang sudah tersedia

- Dashboard dengan jumlah data nyata; database awal kosong tanpa harga contoh.
- Password verifier PBKDF2 bersalt, sesi HttpOnly/Secure/SameSite, logout dan logout semua sesi; rate limit D1 dan Origin check.
- Draft harga dengan sumber, fresh/frozen, kemasan, channel, wilayah, basis harga, tanggal berlaku.
- Edit draft dengan revision guard; AI review teks; publikasi oleh manusia; penarikan tanpa menghapus histori.
- Filter harga berdasarkan tanggal minggu Senin–Minggu dan nama produk/pemasok. Perubahan tengah minggu tetap menjadi interval terpisah.
- Penolakan overlap harga terbit pada dimensi setara melalui trigger database.
- Impor XLSX template (maksimal 100 baris/2 MB), draft; request ID deterministik menghindari penggandaan file Excel identik.
- Ekspor XLSX per pemasok sesuai filter (maksimal 10.000 baris), Wahana fresh/frozen terpisah; kolom channel/kategori tersedia.
- Settings key provider terenkripsi AES-GCM di D1; daftar model, tes koneksi, hapus/ganti key; API baca tidak mengembalikan key.
- OpenRouter hanya model eksplisit `:free` dengan seluruh nilai harga katalog nol; tanpa fallback berbayar.
- Gemini diblokir sampai proyek gratis tanpa billing dikonfirmasi lewat build variable.
- R2 opt-in: arsip privat PNG/JPG/PDF maksimal 2 MB, SHA-256, cache ekstraksi identik, ekstraksi Gemini ke kandidat yang harus dilengkapi manual.
- Audit perubahan, sumber, sesi, dan permintaan review; isi key tidak dicatat.

## Batas pilot

- Belum ada transkripsi/migrasi kedua arsip RAR, audit harga asli, atau harga historis yang dimasukkan otomatis.
- Review AI atas harga hanya menerima teks terstruktur; bukan pembacaan ulang gambar independen. Ekstraksi dokumen visual hanya melalui Gemini bila R2 diaktifkan.
- Tidak ada grafik tren/matriks pivot banyak minggu, chat bebas, job queue besar, import CSV, alias produk otomatis, atau operasi offline pada rilis pertama. Riwayat dapat dicari lewat tabel/ekspor. Fitur tersebut masih backlog, bukan fitur yang diklaim selesai.
- Impor bukan satu transaksi seluruh workbook: baris gagal dilaporkan, baris berhasil tetap draft. File identik aman diulang, file yang berubah dianggap impor baru. Produk/alias dievaluasi manual.
- Akhir berlaku kosong tetap diberi label belum diketahui; filter minggu memakai interval kandidat dan tidak membuktikan harga masih terkonfirmasi. Lengkapi tanggal sebelum digunakan untuk laporan final.
- Semua pemegang password punya hak sama. Audit sesi bukan identitas personal. Aplikasi tidak menyediakan pemisahan admin/viewer.
- R2 adalah layanan berbasis pemakaian dengan allowance gratis, bukan hard cap tagihan. Tidak diaktifkan tanpa opt-in.
- Key Gemini tidak membuktikan proyek tanpa billing. Pemilik wajib memastikan billing tidak aktif sebelum mengaktifkan integrasinya.
- Perubahan yang menyentuh uang/otorisasi/parser diuji; kapasitas CPU Workers Free, restore backup, dan API provider asli masih perlu uji pada akun target.

## Lokal dan pemeriksaan

Node.js 22 atau lebih baru:

```sh
npm ci
npm test
npm run build
npx wrangler deploy --dry-run
npm run dev
```

Generator alternatif untuk komputer pribadi: `npm run secrets:generate`. Simpan output hanya ke Cloudflare runtime Secrets atau `.dev.vars` lokal yang diabaikan Git. Generator terminal menampilkan input; generator browser memakai input password.

Tidak ada dependency framework UI/API yang diperlukan saat ini. Worker memakai Web APIs, antarmuka memakai HTML/CSS/JS native, dan ExcelJS hanya dibundel ke browser. Ini menerapkan [Ponytail](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md): perubahan kecil yang lengkap, tanpa memotong validasi, keamanan, atau tes.

[Blueprint dan riwayat rencana](docs/PLAN.md) · [Panduan operasional dan deployment](docs/DEPLOY.md)
