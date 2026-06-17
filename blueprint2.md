Tolong ubah arsitektur klaim di KineticMining.sol dan visualisasinya di frontend agar menggunakan mekanisme Mining Per Hour (Linear On-Chain Calculation) tanpa menggunakan database, persis seperti mekanisme pada gambar 1000213938.jpg.
​Modifikasi Kontrak (KineticMining.sol):
​Ubah UserInfo agar menyimpan accumulatedPoints, lastMiningTime, dan currentRatePerHour.
​Ubah fungsi gacha agar tidak mengembalikan jumlah poin instan, melainkan menentukan Kecepatan Tambang per Jam (Mining Rate/h) untuk sesi tersebut (Apes = 10.000/jam, Basic = 50.000/jam, Hoki = 200.000/jam).
​Set durasi masa aktif siklus tambang menjadi maksimal 24 jam

Modifikasi Frontend (MiningDashboard.jsx):
Buat fungsi interval JavaScript (setInterval) yang berjalan setiap 1 detik.
Fungsi ini bertugas mengambil data lastMiningTime dan currentRatePerHour dari kontrak, lalu menghitung secara linear angka poin yang bertambah secara real-time di layar user.
Sesuaikan UI untuk menampilkan kartu informasi baru: 'Current mining rate' (menampilkan nilai rate/h aktif) dan 'Mining time left' (hitung mundur dari 24 jam menuju nol).
Pastikan seluruh sinkronisasi data murni menggunakan kalkulasi waktu on-chain block timestamp.