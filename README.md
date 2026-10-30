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
| Akses | Satu password bersama, validasi di server, session cookie aman; semua pemegang password mempunyai akses yang sama |
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
| Login | Password bersama dan sesi server | Sesuai keputusan pemilik; Cloudflare Access bukan syarat MVP |

Login MVP memakai password bersama yang ditetapkan pemilik melalui secret, bukan hardcode frontend. Tidak ada akun/peran terpisah pada MVP. Semua pemegang password mempunyai hak yang sama, termasuk Settings dan persetujuan; audit mencatat sesi, bukan identitas personal yang terverifikasi. Jika tim memerlukan pemisahan hak akses, barulah tambahkan login per pengguna.

Paket dan kuota harus dicek pada akun nyata sebelum provisioning. OCR berat, ekstraksi RAR, dan konversi file besar tidak diasumsikan dapat berjalan pada request Workers Free. Import arsip lama dilakukan melalui proses migrasi terkontrol; aplikasi awal menerima file yang sudah diekstrak. ExcelJS adalah kandidat ekspor yang perlu diuji ukuran bundle dan memori.

## Model data minimum
- suppliers: identitas PT/pemasok.
- products dan product_aliases: spesifikasi kanonis serta alias yang disetujui.
- document_blobs: hash unik, key objek privat, tipe dan ukuran file.
- document_occurrences: nama file, pemasok, konteks periode, kategori/channel, wilayah.
- import_jobs dan extraction_runs: status, model, versi prompt/schema, retry, hasil mentah.
- price_records: harga, unit, basis pajak/ongkir, interval berlaku, sumber, status publikasi.
- price_revisions dan review_actions: koreksi, alasan, reviewer, waktu pencatatan.
- sessions dan audit_events: sesi, aksi, waktu; tanpa klaim identitas individual pada shared login.
- app_settings: konfigurasi model, ciphertext key provider, status tes koneksi, versi konfigurasi.
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
| Sudah diputuskan | Password bersama | Nilai yang diminta pemilik dipasang sebagai secret; tidak dicantumkan pada repo public | Sebelum deployment |
| Wajib data | Status kerahasiaan dan izin memproses pricelist melalui provider AI | Nyatakan publik/boleh dikirim atau rahasia/tidak boleh | Sebelum mengirim dokumen ke AI |
| Nanti melalui web | Gemini API project/key | Isi di Settings setelah deployment; simpan terenkripsi pada backend | Pengujian Gemini |
| Nanti melalui web | OpenRouter API account/key | Isi di Settings setelah deployment; simpan terenkripsi pada backend | Pengujian OpenRouter |
| Sudah diputuskan | Budget gratis | Model gratis saja; stop/antre saat kuota habis, tanpa fallback berbayar | Sepanjang operasi |
| Sudah diputuskan | Pemilik sebagai reviewer akhir + review AI | AI memberi temuan; pemilik mengoreksi/menyetujui publikasi | Pilot sampai go-live |
| Jika ada | Daftar pemasok/channel/wilayah dan kamus SKU | Berikan file master yang memang dipakai; bila belum ada dibentuk dari arsip | Tahap 0–3 |
| Jika ada | Format Excel final/contoh laporan | Pakai contoh hasil yang dianggap benar; bila belum ada disusun dari aturan percakapan | Tahap 3 |
| Opsional | Domain/subdomain | Misalnya harga.domain-perusahaan; bukan syarat build lokal | Sebelum domain produksi |
| Opsional | Logo/nama final | Default MIS Harga dapat dipakai dahulu | Penyempurnaan UI |

Sampel awal diambil dari arsip yang ada, bukan meminta pengguna menyiapkan ulang seluruh dataset. Hanya file tidak terbaca, periode konflik, atau metadata yang tak dapat disimpulkan yang dikembalikan sebagai pertanyaan.

### Kebutuhan yang masih tersisa
- Konfigurasi Worker, D1, dan penyimpanan dokumen pada akun Cloudflare.
- Status kerahasiaan pricelist sebelum pemrosesan AI eksternal.
- Key Gemini/OpenRouter nanti, melalui Settings, bukan lewat chat.
- Pemeriksaan hasil pilot oleh pemilik.

Domain ditunda dan dapat dipasang kemudian. Identitas/email pengguna tidak diperlukan untuk MVP password bersama.

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
- [ ] Login bersama, sesi, logout, pembatasan percobaan, dan akses langsung API/dokumen diuji.
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
Build lokal dapat dimulai dengan data sintetis tanpa akun/key tambahan. Audit arsip asli dapat berjalan setelah akses file dipastikan. Deployment staging menunggu konfigurasi Cloudflare dan secret login/enkripsi. Key provider dapat diisi sesudahnya melalui web. Pemrosesan AI dokumen asli menunggu klasifikasi data dan key yang lulus tes. Produksi menunggu audit data dan UAT.

Belum dilakukan: pembangunan aplikasi, instalasi Ponytail, akses Cloudflare, pengujian key/provider, pembacaan ulang arsip, atau deployment. Risiko utama yang belum ditutup adalah tanggal/angka pada sumber, kebijakan data AI gratis, dan batas runtime/kuota akun.

## Revisi keputusan 30 Oktober: setup Cloudflare dan Settings AI
Bagian ini memperjelas setup minimum sesuai gambar pemilik. Ini rencana konfigurasi, bukan bukti resource atau kode sudah dibuat.

### 1. Halaman Create an app pada gambar
Halaman yang ditunjukkan adalah koneksi GitHub ke Worker dan sudah berada pada jalur yang benar. Namun repo saat ini hanya berisi dokumentasi: tombol Deploy belum akan menghasilkan aplikasi siap pakai. Tunggu kode aplikasi, package.json, lockfile, dan wrangler.jsonc tersedia.

Isian target setelah kode siap:

| Isian | Nilai rencana |
|---|---|
| Repository | AhFu28/Project-MIS-Harga |
| Project name | project-mis-harga |
| Production branch | main |
| Build command | npm run build |
| Deploy command | npx wrangler deploy |
| Preview builds | OFF dahulu agar preview tidak menyentuh data/key produksi |
| Preview command | Default boleh dibiarkan; tidak dijalankan selama preview off |
| Protect with Cloudflare Access | OFF untuk MVP login aplikasi |
| Advanced settings → Path/root | Root repo, tidak perlu subfolder; gunakan / bila form memerlukannya |

Perintah tersebut harus dicocokkan dengan script dan konfigurasi final; build tidak diulang di deploy script. Dependency diinstal dari lockfile. Preview nanti memakai resource dan secret terpisah bila diaktifkan.

### 2. Resource minimum pada Cloudflare
1. **Workers & Pages**: satu Worker project-mis-harga pada Workers Free, terhubung ke repo ini. Gunakan URL workers.dev yang diberikan Cloudflare, tidak memerlukan custom domain.
2. **D1**: melalui menu penyimpanan/database, buat database mis-harga-db. Di konfigurasi Worker, binding bernama DB menunjuk database tersebut. Database ID dipakai pada wrangler.jsonc; ID bukan password. Nama menu dashboard dapat berubah; cari produk D1 bila susunannya berbeda.
3. **Dokumen**: pilihan utama bucket R2 Standard privat bernama mis-harga-documents, binding DOCUMENTS. Jangan aktifkan akses public/r2.dev. Penggunaan dari Worker melalui binding tidak memerlukan S3 access key terpisah.
4. **Secrets runtime**: siapkan APP_PASSWORD_HASH (verifier password bersalt, dihasilkan saat setup), SESSION_SECRET (acak), dan SETTINGS_ENCRYPTION_KEY (kunci AES-GCM acak 256 bit). Secret dipasang pada Worker runtime, bukan variabel build/frontend. Nilai password yang diberikan pemilik tidak ditulis dalam repo public.
5. **Migrasi**: skema D1 perlu diterapkan dari file migrasi setelah kode tersedia. Binding saja belum menciptakan tabel. Instruksi final akan memberi perintah migrasi sesuai konfigurasi yang benar.
6. **Domain**: tambahkan nanti melalui pengaturan domain Worker; sesi lama boleh perlu login ulang ketika host berubah.

Resource/binding perlu dicatat dalam Wrangler sebagai sumber konfigurasi agar deployment berikutnya tidak menghapus atau mengganti pengaturan dashboard. Tidak perlu Supabase, VPS, domain berbayar, atau token API Cloudflare yang dikirim lewat chat untuk alur GitHub–Workers Builds.

### 3. Budget gratis dan penyimpanan dokumen
Tidak mengaktifkan Workers Paid atau fallback model berbayar. Impor batch kecil, cache ekstraksi, retry terbatas, dan kuota aplikasi diberlakukan. Model OpenRouter yang diizinkan harus berharga nol saat dipakai; metadata harga diperiksa ulang, dan job dihentikan jika harga/kemampuan tidak dapat dipastikan. Gemini hanya memakai kuota gratis yang tersedia pada proyek yang dipilih; model/kuota harus dicek pada akun aktual, bukan diasumsikan dari nama model.

R2 mempunyai allowance gratis Standard, tetapi merupakan subscription dengan pemakaian di atas allowance yang dapat ditagih. Aktivasi akun mungkin meminta informasi pembayaran. Karena pemilik menetapkan budget gratis, jangan menyetujui biaya/upgrade secara otomatis. Batas upload dan pemantauan aplikasi mengurangi risiko, tetapi bukan hard spending cap seluruh akun Cloudflare.

Jika pemilik tidak ingin mengaktifkan layanan berbasis pemakaian seperti R2, mulai pilot dengan database harga/manual serta arsip asli disimpan pemilik. Alternatif arsip kecil di D1 dapat dipertimbangkan hanya setelah POC ukuran/limit; bukan pengganti skala penuh untuk file. Fitur upload/preview arsip online belum dinyatakan lengkap dalam mode tanpa object storage. Pilihan ini tidak menghalangi pembangunan inti.

### 4. Login password bersama
- Halaman depan hanya menampilkan form password, bukan nilai password atau petunjuknya.
- Password yang diminta pemilik dikonfigurasi sebagai verifier server; tidak ditanam pada JavaScript, localStorage, dokumentasi, atau response API.
- Session cookie HttpOnly, Secure, SameSite; masa berlaku, logout/revocation, pemeriksaan Origin/CSRF untuk aksi tulis, pembatasan percobaan login dan pesan gagal generik.
- Gunakan primitive/library autentikasi yang telah teruji dan hashing adaptif bersalt yang sesuai runtime; benchmark CPU Free sebelum memilih parameter. Jangan mengganti dengan hash cepat tanpa salt agar lolos batas CPU.
- Semua API dan dokumen memeriksa sesi; halaman login saja bukan perlindungan.
- Shared password berarti setiap pemegang password dapat mengubah key, mengunggah dokumen, dan menyetujui harga. Nama reviewer yang diisi manual bukan bukti identitas.
- Nilai password tidak dicantumkan pada plan public. Pemilik dapat menggantinya melalui prosedur secret dan membatalkan sesi lama.

### 5. Settings Gemini/OpenRouter dan tes koneksi
Key tidak diperlukan sekarang. Setelah web berjalan, menu **Settings → AI Connections** menyediakan:
- Dua kartu provider: Gemini dan OpenRouter.
- Input key bertipe password, pilihan model yang diizinkan, Simpan/Ganti/Hapus, serta Tes koneksi.
- Status terpisah: belum diatur, tersimpan belum dites, tersambung, key tidak valid, model tidak tersedia, kuota habis/429, atau gangguan jaringan.
- Waktu tes terakhir, model yang dites, dan hasil singkat tanpa nilai key.
- Pengujian memakai request kecil ke model aktual, bukan sekadar memeriksa panjang key atau mendapatkan daftar model.
- Tes dapat mengurangi kuota gratis; batasi frekuensi. “Tersambung” adalah hasil pada waktu tes, bukan jaminan kuota selalu tersedia.
- Jika key/model berubah, status tes direset. Kegagalan satu provider tidak disamarkan sebagai sukses provider lain.
- Aplikasi manual tetap berfungsi bila provider belum diatur.

**Penyimpanan minimum yang aman:** browser mengirim key melalui HTTPS ke endpoint sesi terautentikasi. Backend mengenkripsi dengan Web Crypto AES-GCM, nonce unik per enkripsi dan metadata provider/version; D1 hanya menyimpan ciphertext. Master key berada pada Worker Secret SETTINGS_ENCRYPTION_KEY dan tidak pernah dikembalikan ke browser. Endpoint baca Settings hanya mengembalikan status “key tersimpan”, bukan key penuh; tidak ada key pada localStorage, log, export, atau audit event. Key didekripsi di backend hanya untuk memanggil provider.

Tidak memberikan token administrasi Cloudflare kepada aplikasi hanya untuk mengubah Workers Secrets dari UI. Satu master secret saat setup + ciphertext D1 lebih kecil cakupannya. Backup D1 harus dapat dipasangkan dengan master key yang disimpan pemilik dengan aman; kehilangan master key mengharuskan input ulang key provider. Rotasi master key memerlukan re-enkripsi terkontrol.

Endpoint key dan test hanya menerima provider serta model allowlist, bukan URL arbitrary. Terapkan CSRF/Origin check, batas request, ukuran input, dan masking error. Key hanya disimpan setelah validasi format dasar; status connected hanya sesudah tes aktual lulus.

### 6. Reviewer pemilik + AI
Alur: **ekstraksi draft → validasi kode → pemeriksaan AI → koreksi/persetujuan pemilik → harga terbit**.
- Pemeriksaan AI mengecek harga, unit, tanggal, potensi baris hilang, serta konflik dan menyimpan temuan beserta referensi.
- Reviewer AI memakai tugas/prompt berbeda dari ekstraksi, dapat memakai provider/model yang sama bila hanya satu tersedia; sebutkan ini sebagai pemeriksaan ulang, bukan verifikasi independen.
- OpenRouter teks dapat memeriksa data terstruktur; hanya model vision yang mampu meninjau gambar. Jangan mengaku membaca ulang sumber visual jika model hanya menerima teks.
- Ringkasan pemeriksaan: perlu perhatian / tidak menemukan masalah / belum diperiksa. “Tidak menemukan masalah” tidak sama dengan bukti benar.
- AI tidak diberi tool publikasi atau pengubahan key. Dokumen merupakan data, bukan instruksi untuk agent.
- Jika kuota habis, tampilkan belum diperiksa AI. Pemilik tetap boleh melakukan review manual dan publikasi dengan alasan tercatat.
- Tidak memerlukan framework agent atau agent otonom tambahan; cukup satu langkah pemeriksaan terkontrol untuk menghemat kuota.

### 7. Tes tambahan sebelum siap pakai
- Password salah ditolak; akses API tanpa sesi ditolak; logout/revocation bekerja.
- Login throttling, CSRF, dan expiry diuji; hashing diverifikasi cocok CPU Free.
- Key ciphertext berbeda untuk enkripsi ulang; key tidak dapat dibaca dari Settings, log, export, atau bundle.
- Tes provider membedakan 401/403, 429, model salah, dan timeout; perubahan key menghapus status connected lama.
- Halaman provider tidak mengizinkan endpoint arbitrary atau model berbayar tanpa aturan.
- AI review tidak dapat mempublikasikan; kondisi AI mati tidak menghalangi review manual.
- Repo dan preview tidak memuat dokumen/secret produksi.

### Referensi teknis setup
Diperiksa 30 Oktober 2026:
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [D1 getting started](https://developers.cloudflare.com/d1/get-started/)
- [R2 getting started](https://developers.cloudflare.com/r2/get-started/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

Belum diperiksa pada akun pemilik: aktivasi R2, limit CPU/kuota nyata, resource binding, login, key provider, dan deployment. Plan telah disesuaikan; implementasi dan uji runtime belum dilakukan.
