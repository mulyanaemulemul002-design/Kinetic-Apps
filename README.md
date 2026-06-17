# KineticDAO
# Proyek: Ad-to-Earn DAO (X1T Ecochain)

## Deskripsi
Protokol DeFi yang memfasilitasi 'Ad-to-Earn'. Sistem mencatat setiap impresi iklan sebagai *on-chain event* untuk transparansi data tanpa database terpusat.

## Spesifikasi Jaringan: X1T Ecochain (Maculatus Testnet)
- **Network Name:** Maculatus Testnet
- **RPC URL:** https://maculatus-rpc.x1eco.com
- **Chain ID:**10778
- **Currency Symbol:** X1T

## Arsitektur Teknis
1. **Smart Contract (Solidity):**
   - Emit event `AdWatched(address indexed user, uint256 timestamp, uint256 reward)`.
   - Menggunakan OpenZeppelin `Ownable` dan `ReentrancyGuard`.
   - Kontrak harus diverifikasi di explorer X1T.

2. **Data Tracking:**
   - Tidak ada database terpusat (Supabase dilarang).
   - Seluruh aktivitas diambil langsung dari *event logs* blockchain menggunakan The Graph atau *fetching* via Web3 library.

3. **Frontend (Vercel Ready):**
   - React (Vite) + Tailwind CSS.
   - Menggunakan `viem` atau `ethers.js` untuk interaksi *on-chain*.
   - Konfigurasi `vercel.json` untuk *build output* `dist/`.

## Instruksi untuk AI Agent:
- Buat struktur folder: `/contracts`, `/src` (React), `/docs`.
- Jangan gunakan database lokal. Gunakan blockchain sebagai *database*.
- Pastikan konfigurasi `.env.example` mencakup semua variabel yang dibutuhkan untuk Vercel.
- Fokus pada *clean code* untuk memudahkan tim penilai *grant* X1T melakukan audit kode.
