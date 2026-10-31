> Catatan arsip v0.1. Alur akun dan setup terbaru mengikuti [README v0.3](../README.md); login bersama dan generator setup bukan alur terbaru.

# Panduan deploy dan operasional — MIS Harga v0.1

## Kapan boleh klik Deploy?

Kode v0.1 harus sudah ada di branch main dan workflow Checks hijau. Isi Build command `npm run build`, Deploy command `npx wrangler deploy`, root repo default. Preview builds OFF. Klik Deploy untuk membuat pilot; tidak perlu mengisi key Gemini/OpenRouter dahulu.

Worker bisa berhasil dideploy sebelum secret login diisi. Pada kondisi itu halaman login akan menyebut setup belum lengkap dan endpoint data tetap tertutup.

## Resource D1

`wrangler.jsonc` menyertakan binding `DB` dan nama database `mis-harga-db`, tanpa ID akun. Wrangler versi terkunci mendukung provisioning otomatis. Database dijaga tetap terhubung pada deploy berikutnya melalui mekanisme provisioning Cloudflare.

Jika provisioning gagal karena akses akun:

1. Pastikan koneksi GitHub/Workers Builds memiliki izin deploy dan membuat D1 pada akun yang benar.
2. Buat D1 `mis-harga-db` dari dashboard bila diminta.
3. Salin Database ID; tambahkan **build variable** `D1_DATABASE_ID` pada Settings Builds, lalu rebuild. Script build memasukkan ID ke konfigurasi; tidak perlu menaruh token di repo.
4. Pastikan tab Bindings Worker menampilkan D1 bernama `DB`.

Aplikasi membuat tabel/indeks/trigger secara idempotent saat API pertama diakses. Ini bootstrap skema v1, bukan sistem migrasi versi masa depan; perubahan skema berikutnya harus mempunyai migrasi dan backup terpisah. Data tidak dihapus saat restart/deploy.

## Dua secret runtime wajib

Buka URL aplikasi `/setup.html`. Gunakan perangkat pribadi melalui HTTPS. Generator memakai Web Crypto lokal; password dan hasil generator tidak dikirim ke API.

Salin hasil ke **Worker → Settings → Variables and Secrets**:

| Nama | Jenis | Nilai |
|---|---|---|
| APP_PASSWORD_HASH | Secret | Verifier bersalt hasil generator, bukan password mentah |
| SETTINGS_ENCRYPTION_KEY | Secret | Base64 kunci 32 byte hasil generator |

Pakai password yang telah ditetapkan pemilik; password tidak dicantumkan dalam repo public. Dua secret ini bukan build variable. Setelah menyimpan, deploy perubahan secret bila dashboard meminta, lalu reload login. Key provider baru dimasukkan setelah login.

Sesi disimpan dalam D1, token cookie hanya menyimpan token acak; D1 menyimpan hash token. Sesi berlaku delapan jam. Tombol logout semua sesi membatalkan seluruh sesi. Setelah mengubah verifier password, batalkan sesi lama melalui kontrol sesi atau perintah `DELETE FROM sessions` pada D1 Console. Mengganti password saja tidak otomatis menghapus token yang sudah terbit.

PBKDF2-SHA256 menggunakan 100.000 iterasi sesuai batas Web Crypto Workers; throttling membatasi request login. Pastikan login diuji pada paket Free akun target. Jika CPU limit terlampaui, jangan mengurangi validasi atau mengganti dengan hash cepat; sesuaikan mekanisme autentikasi yang teruji.

**Jangan mengganti SETTINGS_ENCRYPTION_KEY rutin tanpa migrasi.** D1 ciphertext provider hanya dapat dibuka dengan key tersebut. Simpan key secara aman di password manager. Kehilangan key berarti key provider perlu dimasukkan ulang. Aplikasi tidak memberi endpoint untuk mengekspor key provider yang tersimpan.

## Gemini gratis

1. Buat Gemini API key pada proyek yang memang tidak terhubung billing. Periksa tier/kuota di AI Studio; akun berlangganan aplikasi Gemini tidak otomatis menjadi kuota API gratis.
2. Pada Settings Builds Cloudflare, tambahkan **build variable** `GEMINI_FREE_CONFIRMED=true`. Rebuild. Ini pernyataan pemilik, bukan deteksi otomatis billing oleh aplikasi.
3. Login aplikasi → Settings AI → Gemini. Isi key dan ID model yang tersedia dengan kuota gratis. Default isian adalah kandidat `gemini-2.5-flash`; gunakan Daftar model untuk memastikan tersedia, lalu sesuaikan.
4. Simpan; klik Tes koneksi. Tes mengirim prompt kecil dan tetap menggunakan kuota gratis.
5. Centang izin pemrosesan data hanya jika dokumen/data boleh dikirim sesuai ketentuan provider.

Aplikasi tidak mengaktifkan billing. Namun bila proyek kemudian diberi billing, pemilik harus mematikan integrasi; API tidak menyediakan jaminan gratis hanya dari model ID.

## OpenRouter gratis

Settings AI → OpenRouter → isi key dan ID model eksplisit berakhiran `:free`, lalu Simpan. Daftar model hanya memuat model `:free` dengan seluruh nilai harga yang dilaporkan katalog bernilai nol. Tes koneksi melakukan panggilan inference, bukan sekadar memeriksa format key.

Status bisa belum diatur, belum dites, tersambung, atau error. Tes 401/403, 429, model hilang, dan timeout ditampilkan berbeda. Status yang ditampilkan adalah hasil tes terakhir; bukan jaminan request berikutnya. Model yang berganti harga/hilang ditolak sebelum inference. Tidak ada fallback model/provider otomatis.

Batas tambahan aplikasi: 30 percobaan AI per hari UTC (termasuk tes/percobaan gagal); model listing 30 per jam; upload 30 per hari. Penyedia dapat mempunyai batas lebih kecil. Batas aplikasi bukan hard cap seluruh akun provider atau Cloudflare.

## R2 opsional

Default tidak ada R2 binding; harga manual dan Excel tetap berjalan. Fitur unggah arsip/preview/ekstraksi visual membutuhkan R2.

Jika menerima subscription R2 dengan allowance gratis dan potensi tagihan di atas allowance:

1. Aktifkan R2 di akun Cloudflare sesuai persyaratan akun; jangan upgrade Workers Paid.
2. Set **build variable** `ENABLE_R2=true`, rebuild. Script menambahkan bucket `mis-harga-documents` dengan binding `DOCUMENTS` dan provisioning Wrangler.
3. Pastikan bucket privat; jangan mengaktifkan public access/r2.dev.
4. Uji file kecil, lalu klik Baca dengan Gemini jika data diizinkan.

File maksimal 2 MB, tipe/signature PNG/JPG/PDF. Setiap unggah memiliki occurrence ID berbeda; konten hash sama dapat memakai cache ekstraksi. Cache adalah saran AI untuk konten asli, bukan masa berlaku baru. Pada editor tetap tentukan tanggal sesuai dokumen dan nama file.

Tidak ada OCR/RAR besar, konversi PDF lokal, atau queue otonom. Timeout 40 detik provider ditampilkan sebagai kegagalan; tidak ada retry berbayar tersembunyi.

## Review dan koreksi data

1. Tambah harga manual atau unduh template lalu impor XLSX. Semua baris masuk draft.
2. Lengkapi pemasok, produk, kondisi, harga integer, satuan, basis harga, sumber, dan tanggal. Kosong pada akhir berlaku = belum diketahui.
3. Review AI opsional melalui detail draft. Hasil AI memeriksa teks terstruktur; jangan menganggapnya verifikasi gambar independen.
4. Cocokkan manual dengan sumber. Setujui dan catat alasan pemeriksaan; atau edit draft.
5. Harga terbit tidak dapat ditimpa. Jika salah, tarik dengan alasan, salin sebagai draft, perbaiki lalu terbitkan.
6. Trigger overlap menolak dua harga terbit pada produk/dimensi sama dengan periode bertabrakan. Akhir berlaku pada UI inklusif; kosong dianggap interval terbuka untuk pemeriksaan konflik agar data ambigu tidak lolos.

Audit menandai aksi berakhiran attempt agar tidak mengklaim setiap request bersamaan berhasil. Status/revisi harga dan baris data adalah acuan hasil. Audit mempertahankan nilai sebelum koreksi/penarikan. Semua pengguna memakai satu password dan hak sama; tidak ada jaminan identitas individual.

## Impor dan ekspor

- XLSX template memiliki header supplier, product, condition, amount, unit, channel, region, pack, basis, valid_from, valid_to, source, notes.
- Gunakan tanggal YYYY-MM-DD, harga angka bulat; formula/rich text pada input ditolak. Maksimal 100 baris/2 MB; gunakan file kecil dari sumber tepercaya.
- Baris valid disimpan berurutan; jika baris gagal, pesan menyebut sheet/baris dan jumlah tersimpan. Tidak ada baris yang dilewati diam-diam. Mengulangi file byte-identik tidak membuat ulang baris yang sudah masuk.
- Ekspor memakai filter yang aktif, sampai 10.000 baris. Sheet per pemasok; Wahana dipisahkan berdasarkan fresh/frozen. Ciomas dibedakan kolom channel/condition, bukan ditafsirkan otomatis dari nama.
- String dalam workbook ditulis sebagai nilai sel, bukan formula. Tidak ada CSV export pada versi ini.
- Tabel maksimum 200 baris per halaman. Audit dan daftar dokumen menampilkan 200 kejadian terbaru.

## Backup, restore dan rollback

Sebelum mengisi data penting, buat dan uji backup D1 melalui tooling Cloudflare; simpan master key terpisah pada password manager. Backup R2 mencakup objek dan metadata D1; D1 saja tidak mencakup file.

Dengan Wrangler pada komputer pribadi yang sudah login:

```sh
npx wrangler d1 export mis-harga-db --remote --output backup.sql
```

Gunakan database staging terpisah untuk uji restore, jangan menimpa production. Ikuti petunjuk D1 import untuk backup yang besar. Untuk restore, kaitkan Worker staging ke DB staging, terapkan SQL, pastikan sesi lama dibersihkan, key provider dapat dibaca menggunakan master key yang cocok, serta dokumen masih dapat diakses. Status pengujian restore v0.1: **belum dilakukan pada akun pengguna**.

Rollback kode melalui versi Cloudflare yang pernah berhasil. Tidak ada migrasi destruktif pada bootstrap v1. Rollback kode bukan rollback data. Jangan menghapus DB/bucket untuk mencoba memperbaiki error login.

## Kriteria sebelum data produksi

- Deploy sukses, binding DB benar, login/expiry/logout diuji pada URL nyata.
- Secret tidak ada pada repo, browser response, audit atau export.
- Pilot sumber asli diperiksa dan tabel/Excel sesuai; data historis belum dimigrasi pada v0.1.
- Kuota dan CPU Free nyata diamati; provider/key/status tes dikonfirmasi.
- Semua data yang dikirim AI memenuhi ketentuan provider; AI tidak mempublikasikan.
- Backup/restore diuji, pemilik menerima keterbatasan shared password.

Referensi: [Cloudflare automatic provisioning](https://developers.cloudflare.com/changelog/post/2025-10-24-automatic-resource-provisioning/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [D1](https://developers.cloudflare.com/d1/get-started/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Gemini terms](https://ai.google.dev/gemini-api/terms), [OpenRouter free models](https://openrouter.ai/collections/free-models).
