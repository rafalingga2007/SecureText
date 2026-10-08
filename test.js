/*
 * test.js — menjalankan kasus uji Caesar Cipher di Node.js
 * Cara menjalankan: node test.js
 */
const Caesar = require('./cipher.js');

let gagal = 0;

function cek(kondisi, pesan) {
  if (kondisi) {
    console.log(`  LULUS  ${pesan}`);
  } else {
    console.log(`  GAGAL  ${pesan}`);
    gagal += 1;
  }
}

console.log('1. Kasus uji enkripsi dan dekripsi');
for (const hasil of Caesar.jalankanUji()) {
  const label = `#${hasil.id} ${hasil.nama}`;
  cek(hasil.lulus, `${label} | "${hasil.teks}" k=${hasil.kunci} -> "${hasil.actual}" -> "${hasil.dekripsi}"`);
}

console.log('\n2. Round-trip: dekripsi(enkripsi(P)) = P untuk berbagai kunci');
const sampel = 'Matematika Diskrit, Ilkom 2026! xyz XYZ';
let roundTripOk = true;
for (let k = -60; k <= 60; k++) {
  if (Caesar.dekripsi(Caesar.enkripsi(sampel, k), k) !== sampel) {
    roundTripOk = false;
    console.log(`     gagal pada k = ${k}`);
    break;
  }
}
cek(roundTripOk, 'Round-trip benar untuk k = -60 sampai 60');

console.log('\n3. Kunci k dan k + 26 menghasilkan keluaran yang sama');
let periodeOk = true;
for (let k = -30; k <= 30; k++) {
  if (Caesar.enkripsi(sampel, k) !== Caesar.enkripsi(sampel, k + 26)) {
    periodeOk = false;
    break;
  }
}
cek(periodeOk, 'enkripsi(P, k) = enkripsi(P, k + 26) untuk k = -30 sampai 30');

console.log('\n4. Validasi input kunci');
const kunciValid = [['3', 3], [' -5 ', -5], ['29', 29], ['+7', 7]];
for (const [masukan, harapan] of kunciValid) {
  cek(Caesar.parseKunci(masukan) === harapan, `parseKunci("${masukan}") = ${harapan}`);
}
const kunciTidakValid = ['', '3.5', 'abc', '1e3', '3 4'];
for (const masukan of kunciTidakValid) {
  let dilempar = false;
  try {
    Caesar.parseKunci(masukan);
  } catch (e) {
    dilempar = true;
  }
  cek(dilempar, `parseKunci("${masukan}") ditolak`);
}

console.log('\n5. Validasi manual HALO, k = 3 (Tabel 2.1 laporan)');
const rinc = Caesar.rincianPerhitungan('HALO', 3, 'enkripsi');
const cocokManual = rinc.baris.map((b) => b.keluaran).join('') === 'KDOR';
cek(cocokManual, 'Hasil per huruf H,A,L,O -> K,D,O,R');

console.log(`\nHasil: ${gagal === 0 ? 'SEMUA TES LULUS' : gagal + ' tes GAGAL'}`);
process.exit(gagal === 0 ? 0 : 1);