# Kana Reader

Latihan membaca Hiragana & Katakana dengan konsep seperti Iqro: pilih kelompok huruf, baca, klik untuk mendengar pelafalannya.

## Menjalankan

Aplikasi memakai ES Modules, jadi harus dibuka lewat server lokal (bukan `file://`):

```bash
# pilih salah satu
python -m http.server 8000
npx serve .
```

Lalu buka <http://localhost:8000>.

> Tailwind dimuat lewat Play CDN (`cdn.tailwindcss.com`) sehingga tidak perlu build step. Untuk produksi, sebaiknya ganti dengan Tailwind CLI agar CSS di-generate statis.

## Fitur

Ada dua jenis latihan: **Huruf** (Character Practice) dan **Kata** (Word Practice).

### Latihan Huruf

- **Huruf**: Hiragana / Katakana.
- **Kelompok**: A, KA, SA, TA, NA, HA, MA, YA, RA, WA + dakuten (GA, ZA, DA, BA, PA). Bisa pilih banyak sekaligus atau semua.
- **Mode**
  - *Grid* — semua huruf dalam kisi.
  - *Single* — satu huruf besar; navigasi tombol ← → (keyboard juga), Spasi untuk memutar audio.
  - *Kombinasi* — gabungan 2–3 huruf acak (ん tidak di awal).
- **Jumlah**: 10 / 20 / 30 / Unlimited.
  - Grid: Unlimited = semua huruf dari kelompok terpilih.
  - Single: Unlimited = acak terus tanpa batas.
  - Kombinasi: Unlimited = 30 kombinasi + tombol "Tambah kombinasi".
  - Jika jumlah > huruf yang tersedia, huruf diulang merata (tidak ada huruf sama yang bersebelahan di sambungan putaran).
- **Latihan**: klik huruf untuk audio, Shuffle, toggle Romaji (default tersembunyi), kembali ke kelompok (tombol Back browser/HP juga berfungsi).

### Latihan Kata

- Menampilkan kosakata Jepang asli yang **seluruh hurufnya** berasal dari kelompok terpilih (mis. pilih A + KA → かお, えき, あかい, …). Kata yang mengandung huruf lain tidak pernah ditampilkan.
- Hiragana memakai kosakata asli Jepang; Katakana memakai kata yang memang lazim ditulis dengan Katakana (kata serapan, nama negara, hewan). Saat ini 349 kata Hiragana + 90 kata Katakana.
- Kata yang membutuhkan ー atau huruf kecil (っ, ゃ, ァ, …) belum dimasukkan karena huruf tersebut tidak termasuk kelompok mana pun.
- Jumlah: 10 / 20 / 30 / Unlimited (= semua kata yang tersedia). Kata tidak diulang; bila jumlah melebihi kata yang tersedia, semuanya ditampilkan disertai pemberitahuan.
- Bila kosakata untuk kelompok terpilih sedikit (< 10), halaman pengaturan memberi tahu dan menyarankan kelompok yang paling banyak menambah kata (bisa diklik langsung).
- Klik kata untuk mendengar pelafalannya. Romaji dan arti disembunyikan secara default, masing-masing punya tombol sendiri.

### Preferensi

Jenis latihan, aksara, kelompok, mode, jumlah, romaji, dan arti disimpan di LocalStorage.

## Audio

Audio pelafalan **sudah disertakan di website**, jadi pengguna tidak perlu memasang suara apa pun di perangkatnya:

- `audio/<romaji>.mp3` — 69 suku kata (±840 KB)
- `audio/words/<romaji>.mp3` — satu file per kata (±5 MB; hanya kata yang sedang tampil yang dimuat)

- Diputar via Web Audio API; hening di awal/akhir tiap file dipotong otomatis sehingga mode Kombinasi terdengar menyambung (mis. か + さ → "kasa").
- Hiragana & Katakana memakai file yang sama (bunyinya sama); ぢ/づ memakai `ji`/`zu`.
- File audio dimuat lebih awal saat latihan dimulai, jadi klik pertama langsung berbunyi.
- Urutan cadangan: file bawaan → suara Jepang perangkat (Web Speech API, `ja-JP`) → untuk kata: gabungan audio per suku kata → bila semua gagal, romaji ditampilkan lewat notifikasi singkat.

### Membuat ulang file audio

File dibuat dengan `tools/generate-audio.py` (suara `ja-JP-NanamiNeural` via [edge-tts](https://github.com/rany2/edge-tts)). Daftar suku kata dan kata dibaca langsung dari `js/data/kana.js` dan `js/data/words.js`, jadi setelah menambah data cukup jalankan:

```bash
pip install edge-tts
python tools/generate-audio.py          # hanya membuat file yang belum ada
python tools/generate-audio.py --force  # buat ulang semua
```

> Catatan lisensi: edge-tts memakai layanan TTS online Microsoft. Untuk penggunaan komersial/publik, pertimbangkan mengganti file di `audio/` dengan rekaman sendiri atau engine berlisensi jelas (mis. VOICEVOX dengan kredit). Cukup pertahankan nama file `<romaji>.mp3`.

## Struktur

```
index.html            Kerangka halaman (setup & latihan)
audio/                File pelafalan per suku kata (<romaji>.mp3)
tools/                Skrip development (generate audio, validasi kosakata)
css/styles.css        Komponen kecil (segmented, chip, kartu, toast)
js/
  app.js              Entry point: state, navigasi, wiring modul
  config.js           Opsi mode/jumlah/script + default preferensi
  storage.js          Load/save preferensi (LocalStorage, tervalidasi)
  audio/index.js      Fasad audio: file bawaan → suara perangkat → pesan fallback
  audio/player.js     Pemutar file audio (Web Audio API, potong hening, urutan suku kata)
  audio/speech.js     Cadangan Web Speech API (ja-JP)
  randomizer.js       shuffle, sample, pickOne, makeCombinations (generik)
  data/kana.js        Data kelompok Kana + helper (getKanaPool, joinRomaji)
  data/words.js       Database kosakata (kana, romaji, arti, kategori)
  words.js            Logic Word Practice: filter kata per kelompok, saran kelompok
  views/setup.js      Halaman pengaturan
  views/practice.js   Halaman latihan (Grid / Single / Kombinasi / Kata)
  ui/toast.js         Notifikasi singkat
```

Menambah kelompok baru (mis. yōon きゃ/キャ): tambahkan entri di `KANA_GROUPS` dan, bila perlu, kategori baru di `CATEGORIES` pada `js/data/kana.js`. UI akan otomatis menampilkannya.

## Menambah kosakata

1. Tambahkan entri di `js/data/words.js` (bagian `hiragana` atau `katakana`):
   ```js
   { kana: 'ねこ', romaji: 'neko', meaning: 'kucing', category: 'hewan' },
   ```
2. Validasi: `node tools/validate-words.mjs` — memeriksa huruf (harus ada di data Kana), kecocokan romaji, kata ganda, dan nama file audio.
3. Buat audionya: `python tools/generate-audio.py`.

Kata otomatis muncul untuk kombinasi kelompok yang sesuai; tidak perlu mengubah kode lain.

