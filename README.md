# Bot-WhatsApp

Starter project Web Bot WhatsApp menggunakan Node.js, Express, dan Baileys.

## Menjalankan di komputer sendiri
1. Install Node.js versi LTS.
2. Buka terminal pada folder proyek.
3. Jalankan `npm install`.
4. Jalankan `npm start`.
5. Buka `http://localhost:3000`.
6. Scan QR yang muncul di terminal melalui WhatsApp > Perangkat tertaut > Tautkan perangkat.

## Perintah yang sudah aktif
- `.menu` / `.help`
- `.ping`
- `.botinfo`

Perintah lain di daftar menu adalah kerangka tampilan dan belum diimplementasikan.

## Keamanan
Jangan unggah folder `auth_info/` ke GitHub. Jangan bagikan QR atau kredensial sesi. Koneksi Baileys adalah integrasi WhatsApp Web tidak resmi dan dapat berubah sewaktu-waktu.
