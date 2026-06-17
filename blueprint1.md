Tolong perbarui struktur logika smart contract KineticMining.sol untuk mengimplementasikan Cetak Biru Fase 1 (Era Akumulasi Poin sebelum TGE). Struktur harus berbasis Poin Virtual (Credits), bukan token ERC20 langsung. Implementasikan poin-poin berikut:

Definisikan Peringkat & Kuota Global:
Buat variabel global pelacak poin: uint256 public totalPointsMinted;
Buat konstanta batas kuota:
uint256 public constant RANK_1_LIMIT = 500_000_000_000(500B)
uint256 public constant RANK_2_LIMIT = 750_000_000_000(500B + 250B)
uint256 public constant RANK_3_LIMIT = 875_000_000_000(750B + 125B)

Logika Otomatis Halving Berdasarkan Kuota:
Di dalam fungsi calculateGachaReward(), tambahkan pengecekan kondisi totalPointsMinted.
Jika di bawah RANK_1_LIMIT, gunakan basis gacha normal (Basic = 100,000 Poin).
Jika berada di antara RANK_1_LIMIT dan RANK_2_LIMIT, potong hasil gacha sebesar 50% (Halving 1).
Jika berada di antara RANK_2_LIMIT dan RANK_3_LIMIT, potong hasil gacha sebesar 75% dari basis awal (Halving 2).

Implementasikan Sistem Inaktif Burn (Peringkat 3):
Jika status kontrak sudah memasuki Peringkat 3, tambahkan pengecekan di awal fungsi triggerMining().
Jika block.timestamp > user.lastMiningTime + 72 hours dan user sudah pernah menambang sebelumnya, potong saldo user.totalMined sebanyak 10% sebagai hukuman inaktif sebelum memproses siklus baru.

Sinkronisasi Tampilan Aplikasi (Web Explorer):
Ekspos fungsi read-only getCurrentRank() yang mengembalikan angka pilar peringkat aktif (1, 2, atau 3) dan persentase sisa kuota global agar bisa ditampilkan secara visual di halaman analitik on-chain web.
Jalankan modifikasi arsitektur ini sekarang agar kontrak siap menangani jutaan transaksi akumulasi poin secara aman.