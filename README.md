# Project MIS Harga — Rencana Build dan Kesiapan
Tanggal: 30 Oktober 2026. Status: planning; aplikasi belum dibangun atau dideploy.

## Tujuan
Aplikasi internal untuk mengarsipkan pricelist, memeriksa hasil ekstraksi, menerbitkan harga sesuai tanggal berlaku, membandingkan harga mingguan per pemasok, dan mengekspor Excel. AI membantu membaca dan menjelaskan data; kode menghitung angka dan reviewer menyetujui publikasi.

Repo tujuan: https://github.com/AhFu28/Project-MIS-Harga
Repo ini diperiksa melalui koneksi GitHub: kosong saat penyusunan plan, branch default main, akses tulis tersedia, visibility public. Tidak ada aplikasi atau konfigurasi yang harus dipertahankan saat ini. Jangan commit pricelist asli, data pengguna, dokumen internal, token, atau API key. Repo public tidak berarti data aplikasi harus public.

## Prinsip Ponytail yang diterapkan
Referensi dibaca: [README](https://github.com/DietrichGebert/ponytail/blob/main/README.md), [skill](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md), dan [AGENTS.md](https://github.com/DietrichGebert/ponytail/blob/main/AGENTS.md). Blob skill yang diperiksa: d64edd32265ba21cbf5270158f04e97d96925f27.

Penerapan ini mengadopsi prinsip kerja, bukan memasang plugin, hooks, telemetry, atau menyalin keseluruhan Ponytail.

1. Pahami aliran data dan seluruh pemanggil sebelum mengubah kode.
2. Bangun fungsi yang diminta; hindari fitur spekulatif.
3. Gunakan komponen proyek, fitur platform, dan dependency yang sudah ada sebelum menambah library.
4. Pilih perubahan paling kecil yang menyelesaikan kebutuhan secara lengkap dan mudah dibaca.
5. Jangan memangkas validasi, error handling untuk mencegah kehilangan data, keamanan, aksesibilitas, atau kebutuhan audit.
6. Logika uang, parser, tanggal, percabangan, dan otorisasi harus mempunyai tes kecil yang bermakna.
7. Review juga bagian di luar diff yang terkena perubahan.
8. Catat keterbatasan dan pemicu perbaikannya; jangan mengklaim siap produksi tanpa bukti pemeriksaan.

Konsekuensi desain: satu aplikasi dan satu database dahulu; dua integrasi AI sederhana; tanpa framework multi-agent, vector database, microservices, atau abstraction provider generik. Pekerjaan panjang memakai status job dan retry terukur; layanan antrean khusus ditambahkan bila POC membuktikan perlu.

## Keputusan produk yang sudah ada
- Seluruh riwayat April–Oktober dimasukkan; tahun dan cakupan aktual diverifikasi dari dokumen.
- Harga ditampilkan per minggu dan per PT/pemasok.
- Wahana fresh dan frozen terpisah pada tampilan/ekspor, tetap dapat memakai supplier ID yang sama.
- Ciomas memakai kategori/channel untuk membedakan jenis daftar.
- Tanggal eksplisit pada pricelist didahulukan; rentang nama file memberi konteks masa berlaku.
- Gambar identik cukup diekstraksi sekali, tetapi kejadian dan periode berlaku yang berbeda tetap dicatat.
- Harga yang belum diperiksa tidak masuk laporan harga terbit.

## Default untuk menghindari pertanyaan yang tidak perlu
Default berikut dipakai bila belum ada perubahan dari pemilik:
- Nama aplikasi MIS Harga; pemakaian internal tim.
- Bahasa Indonesia, IDR, zona waktu bisnis Asia/Jakarta.
- Minggu Senin–Minggu; perubahan tengah minggu ditampilkan sebagai dua interval.
- Mode gelap, desktop untuk review/tabel, responsif untuk pencarian di HP.
- Status: draft, menunggu review, terbit, konflik, kedaluwarsa, belum ada data.
- Tidak ada carry-forward harga diam-diam; referensi harga lama diberi label.
- Manual review sebelum publikasi, termasuk pada hasil AI.
- Subdomain platform untuk pilot; custom domain opsional.
- Tanpa fallback AI berbayar otomatis. AI gagal/kuota habis masuk antrean atau input manual.
- Data sensitif tidak dikirim ke model gratis tanpa dasar kebijakan data yang sesuai.

## MVP yang akan dibangun
| Modul | Hasil yang harus berfungsi |
|---|---|
| Akses | Login internal dan peran Admin, Operator, Reviewer, Viewer; API memeriksa izin |
| Master | Pemasok, produk, fresh/frozen, ukuran, kemasan, satuan, wilayah, channel, alias |
| Arsip | Upload gambar/PDF/XLSX/CSV, dokumen privat, metadata sumber, hash duplikat |
| Input/review | Input manual dan draft impor; sumber berdampingan dengan hasil; koreksi dan persetujuan |
| Harga mingguan | Filter PT/produk/periode/channel; perubahan harga dan status gap data |
| Riwayat | Interval tanggal berlaku, revisi, sumber dan aktor |
| Excel | Export sesuai filter dan pembagian tab yang disepakati |
| Gemini | Membaca dokumen menjadi draft terstruktur dengan referensi sumber |
| OpenRouter | Ringkasan/pertanyaan berbasis data terbit; model yang telah diuji |
| Audit | Riwayat perubahan, kesalahan impor, pemakaian AI, backup dan restore |

Urutan MVP membuat fungsi harga/manual terlebih dahulu agar aplikasi tetap berguna sebelum key AI tersedia. PWA installable dilaksanakan setelah alur inti stabil; offline harga bukan cakupan awal.

## Arsitektur yang diusulkan
| Bagian | Pilihan | Alasan |
|---|---|---|
| Frontend | React, TypeScript, Vite | SPA ringan untuk aplikasi internal |
| UI | shadcn/ui + TanStack Table | Pakai komponen yang tersedia; tabel filter dan sorting |
| API | Hono pada Cloudflare Workers | Runtime sesuai target deployment |
| Data | Cloudflare D1; skema/migrasi dengan Drizzle | Harga, periode, review, audit |
| Dokumen | Cloudflare R2 privat | File asli di luar repository |
| AI dokumen | Gemini API langsung | Pembacaan visual dan output terstruktur |
| AI tambahan | OpenRouter API | Model teks untuk ringkasan; bukan sumber angka utama |
| CI/deploy | GitHub checks + Cloudflare Workers Builds | Satu jalur deployment dari main |
| Login | Kandidat Cloudflare Access | Harus dibuktikan cocok dengan host/domain dan akun pengguna |

Cloudflare Access belum dianggap keputusan final sampai POC memverifikasi proteksi hostname, validasi token, dan alur login. Jika host awal tidak mendukung kebutuhan yang disepakati, pilih auth terkelola yang paling kecil dan sesuai; jangan membuat password sendiri.

Paket dan kuota harus dicek pada akun nyata sebelum provisioning. OCR berat, ekstraksi RAR, dan konversi file besar tidak diasumsikan dapat berjalan pada request Workers Free. Import arsip lama dilakukan melalui proses migrasi terkontrol; aplikasi awal menerima file yang sudah diekstrak. ExcelJS adalah kandidat ekspor yang perlu diuji ukuran bundle dan memori.

## Model data minimum
- suppliers: identitas PT/pemasok.
- products dan product_aliases: spesifikasi kanonis serta alias yang disetujui.
- document_blobs: hash unik, key objek privat, tipe dan ukuran file.
- document_occurrences: nama file, pemasok, konteks periode, kategori/channel, wilayah.
- import_jobs dan extraction_runs: status, model, versi prompt/schema, retry, hasil mentah.
- price_records: harga, unit, basis pajak/ongkir, interval berlaku, sumber, status publikasi.
- price_revisions dan review_actions: koreksi, alasan, reviewer, waktu pencatatan.
- users/role mapping dan audit_events: identitas, izin, aksi.
- ai_runs: provider/model aktual, penggunaan, error; tanpa bocoran secret.

Harga disimpan sebagai integer rupiah atau integer berskala untuk pecahan. Tanggal berlaku dan waktu pencatatan berbeda. Akhir interval internal bersifat eksklusif. Nilai kosong, nol, strip, dan “hubungi sales” tidak disamakan.

Produk dibandingkan hanya jika ukuran, kondisi, kemasan, unit, channel, wilayah, periode, dan basis harga setara. Konversi per kg/pack/karton memerlukan isi kemasan yang diketahui. Konflik periode diblokir dari publikasi sampai diselesaikan.

## Tahap kerja dan gate penerimaan
| Tahap | Pekerjaan | Bukti selesai | Kebutuhan dari pengguna |
|---|---|---|---|
| 0. Persiapan | Audit arsip, kamus data, format keluaran | Inventaris sumber dan daftar aturan ambigu | Arsip yang sudah tersedia; klarifikasi hanya untuk konflik |
| 1. Pondasi lokal | Scaffold, skema, sample sintetis, tabel/input manual | Build dan tes harga/tanggal lolos | Tidak perlu API key |
| 2. POC Cloudflare | D1/R2, login, unggah privat, deployment staging | Login–upload–query berjalan; API langsung tetap terlindungi | Akun/konfigurasi Cloudflare dan pengguna pilot |
| 3. Harga dan review | Masa berlaku, publikasi, histori, ekspor | Sampel hasil cocok sumber dan ekspor | Reviewer bisnis dan contoh keluaran yang disetujui |
| 4. AI | Gemini ekstraksi, OpenRouter ringkasan, retry/kuota | Benchmark angka/tanggal; tidak ada auto-publish | Key dipasang sebagai secret; kebijakan data jelas |
| 5. Migrasi pilot | Riwayat arsip, deduplikasi, rekonsiliasi | Jumlah sumber/baris/gap/konflik dapat dijelaskan | Review data yang belum jelas |
| 6. Go-live | UAT, backup/restore, smoke test, runbook | Checklist operasional lulus | Admin operasional dan keputusan go-live |

Estimasi awal keseluruhan tetap 20–34 hari kerja pengembangan untuk satu pengembang berpengalaman; bukan SLA atau janji durasi sesi. Transkripsi, arsip buram, akses akun, dan waktu review dapat menambah durasi. Setelah tahap 0–2, revisi estimasi memakai hasil nyata.

## Yang perlu pemilik sediakan
| Prioritas | Kebutuhan | Cara menyediakan | Kapan dibutuhkan |
|---|---|---|---|
| Sudah siap | Repo Project-MIS-Harga | Akses tulis telah diverifikasi | Sekarang |
| Sudah dirujuk | Cek 1.rar dan Cek 2.rar | Gunakan dua arsip yang sudah diberikan; jangan upload ulang kecuali gagal diakses | Audit/migrasi |
| Wajib deployment | Akun Cloudflare yang dipakai | Pemilik login dan menghubungkan repo lewat dashboard; tidak perlu memberikan password | POC staging |
| Wajib deployment | D1, R2, binding, environment | Dibuat dengan panduan setup yang disertakan saat kode siap | POC staging |
| Wajib login | Email Admin dan pengguna pilot, masing-masing peran | Berikan secara privat, jangan ditulis dalam repo public | POC login |
| Wajib data | Status kerahasiaan dan izin memproses pricelist melalui provider AI | Nyatakan publik/boleh dikirim atau rahasia/tidak boleh | Sebelum mengirim dokumen ke AI |
| Wajib AI | Gemini API project/key | Buat di AI Studio dan masukkan ke Workers Secrets | Pengujian Gemini |
| Wajib AI | OpenRouter API account/key | Masukkan ke Workers Secrets | Pengujian OpenRouter |
| Wajib operasional | Pilihan biaya | Gratis saja atau batas maksimum bulanan; tidak ada upgrade diam-diam | Sebelum aktivasi layanan |
| Wajib audit | Satu reviewer bisnis | Tunjuk orang yang bisa mengesahkan harga, tanggal, produk, dan unit | Pilot sampai go-live |
| Jika ada | Daftar pemasok/channel/wilayah dan kamus SKU | Berikan file master yang memang dipakai; bila belum ada dibentuk dari arsip | Tahap 0–3 |
| Jika ada | Format Excel final/contoh laporan | Pakai contoh hasil yang dianggap benar; bila belum ada disusun dari aturan percakapan | Tahap 3 |
| Opsional | Domain/subdomain | Misalnya harga.domain-perusahaan; bukan syarat build lokal | Sebelum domain produksi |
| Opsional | Logo/nama final | Default MIS Harga dapat dipakai dahulu | Penyempurnaan UI |

Sampel awal diambil dari arsip yang ada, bukan meminta pengguna menyiapkan ulang seluruh dataset. Hanya file tidak terbaca, periode konflik, atau metadata yang tak dapat disimpulkan yang dikembalikan sebagai pertanyaan.

### Format jawaban singkat yang dapat dipakai
- Cloudflare: sudah ada / belum.
- Biaya: gratis saja / maksimal USD ... per bulan.
- Pricelist: boleh diproses provider AI / rahasia, jangan kirim dulu / perlu konfirmasi internal.
- Reviewer: saya sendiri / orang lain.
- Pengguna pilot: jumlah ...; email dan peran diberikan secara privat saat setup.
- Domain: pakai alamat platform dahulu / domain sendiri ....
- Kalender: default Senin–Minggu / aturan lain ....
- Gemini/OpenRouter: akun sudah ada / perlu panduan membuat akun.

API key tidak dikirim lewat chat, issue, atau commit. Nama secret rencana: GEMINI_API_KEY dan OPENROUTER_API_KEY. Nama model disimpan sebagai konfigurasi terpisah dan dipilih berdasarkan model yang benar-benar tersedia pada akun. Cloudflare Account ID dan resource ID merupakan konfigurasi non-secret, tetap tidak perlu diumbar dalam dokumentasi publik.

Jika deployment dikerjakan pemilik melalui koneksi GitHub–Cloudflare, token API Cloudflare tidak perlu diberikan kepada pengembang. Jika kelak diperlukan deployment via CI, gunakan token dengan scope minimum melalui penyimpanan secret yang sesuai.

## Setup yang akan disertakan bersama implementasi
1. Panduan membuat/memilih akun Cloudflare dan menghubungkan hanya repo ini.
2. Perintah dan penjelasan membuat resource staging/production terpisah.
3. Contoh konfigurasi binding tanpa key asli; template environment dengan placeholder.
4. Cara memasang key sebagai secret dan mengecek provider tanpa mencetak nilainya.
5. Cara mengatur login/role dan memeriksa API dari sesi tidak berizin.
6. Langkah migrasi, deploy, smoke test, backup/restore, serta rollback.
7. Petunjuk upload–review–publish–export untuk pengguna nonteknis.

## Checklist siap dijalankan
- [ ] Build frontend/backend dan migrasi berhasil di environment target.
- [ ] Login dan setiap role diuji, termasuk akses langsung ke API/dokumen.
- [ ] Dokumen di R2 privat; tidak ada data asli pada repo public.
- [ ] Semua harga terbit memiliki sumber, masa berlaku, dan reviewer.
- [ ] Kasus fresh/frozen, unit/kemasan, periode beda, duplikat, gap, dan revisi lulus tes.
- [ ] Perubahan tengah minggu, lintas tahun, dan overlap tidak menghasilkan harga keliru.
- [ ] Ekspor cocok dengan filter dan data terbit.
- [ ] AI tidak mempunyai akses publikasi; jawaban memiliki sumber atau menyatakan data tidak tersedia.
- [ ] Model, kuota, privasi, dan biaya provider telah diperiksa pada akun aktual.
- [ ] 429/timeout/retry tidak menduplikasi publikasi; mode manual tetap berfungsi.
- [ ] Backup berhasil dipulihkan di staging.
- [ ] Pilot satu siklus pembaruan mingguan disetujui reviewer.

## Urutan keputusan berikutnya
Build lokal dapat dimulai dengan data sintetis tanpa akun/key tambahan. Audit arsip asli dapat berjalan setelah akses file dipastikan. Deployment staging menunggu konfigurasi Cloudflare dan login. Pemrosesan AI dokumen asli menunggu klasifikasi data dan secret. Produksi menunggu audit data dan UAT.

Belum dilakukan: pembangunan aplikasi, instalasi Ponytail, akses Cloudflare, pengujian key/provider, pembacaan ulang arsip, atau deployment. Risiko utama yang belum ditutup adalah tanggal/angka pada sumber, kebijakan data AI gratis, dan batas runtime/kuota akun.
