/*
 * cipher.js
 * Logika Caesar Cipher berbasis aritmetika modular (m = 26).
 *
 *   Enkripsi : C = (P + k) mod 26
 *   Dekripsi : P = (C - k) mod 26
 *
 * Berkas ini tidak bergantung pada DOM sehingga dapat diuji di browser
 * maupun di Node.js (lihat test.js).
 */
(function (root) {
  'use strict';

  const M = 26;

  /** Sisa pembagian non-negatif: hasilnya selalu di rentang 0..m-1. */
  function mod(a, m) {
    return ((a % m) + m) % m;
  }

  /** Mengubah kunci sebarang bilangan bulat menjadi ekuivalennya di Z26. */
  function normalisasiKunci(k) {
    return mod(k, M);
  }

  /**
   * Mengubah teks masukan menjadi bilangan bulat kunci.
   * Melempar Error jika format tidak valid.
   */
  function parseKunci(masukan) {
    const teks = String(masukan).trim();
    if (!/^[+-]?\d+$/.test(teks)) {
      throw new Error('Kunci harus berupa bilangan bulat, misalnya 3, -5, atau 29.');
    }
    const n = Number(teks);
    if (!Number.isSafeInteger(n)) {
      throw new Error('Nilai kunci terlalu besar.');
    }
    return n;
  }

  /**
   * Mengembalikan { basis, p } untuk huruf A-Z (basis 65) atau a-z (basis 97),
   * dengan p = posisi 0..25. Mengembalikan null untuk karakter lain.
   */
  function infoHuruf(ch) {
    const kode = ch.charCodeAt(0);
    if (kode >= 65 && kode <= 90) return { basis: 65, p: kode - 65 };
    if (kode >= 97 && kode <= 122) return { basis: 97, p: kode - 97 };
    return null;
  }

  /** Menggeser satu karakter sebesar s (sudah ternormalisasi); karakter non-huruf dikembalikan apa adanya. */
  function geserKarakter(ch, s) {
    const info = infoHuruf(ch);
    if (!info) return ch;
    return String.fromCharCode(info.basis + ((info.p + s) % M));
  }

  /** Menerapkan pergeseran k ke seluruh teks. */
  function proses(teks, kunci) {
    const s = normalisasiKunci(kunci);
    return Array.from(teks, (ch) => geserKarakter(ch, s)).join('');
  }

  function enkripsi(teks, kunci) {
    return proses(teks, kunci);
  }

  function dekripsi(teks, kunci) {
    return proses(teks, -kunci);
  }

  /**
   * Rincian perhitungan per huruf (hanya huruf alfabet).
   * mode: 'enkripsi' menghitung (P + k) mod 26,
   *       'dekripsi' menghitung (C - k) mod 26.
   */
  function rincianPerhitungan(teks, kunci, mode) {
    const s = normalisasiKunci(kunci);
    const tanda = mode === 'dekripsi' ? -1 : 1;
    const baris = [];
    let no = 0;

    for (const ch of teks) {
      const info = infoHuruf(ch);
      if (!info) continue;
      no += 1;
      const mentah = info.p + tanda * s;
      const hasilPosisi = mod(mentah, M);
      const basis = info.basis;
      baris.push({
        no,
        masukan: ch,
        posisiMasukan: info.p,
        operasi: tanda === 1 ? `${info.p} + ${s}` : `${info.p} - ${s}`,
        mentah,
        posisiHasil: hasilPosisi,
        keluaran: String.fromCharCode(basis + hasilPosisi)
      });
    }
    return { kunciNormal: s, baris };
  }

  /** Kasus uji. "teks" adalah plaintext, "enkripsi" adalah ciphertext yang diharapkan. */
  const KASUS_UJI = [
    {
      id: 1,
      nama: 'Kasus normal (validasi manual)',
      teks: 'HALO',
      kunci: 3,
      enkripsi: 'KDOR'
    },
    {
      id: 2,
      nama: 'Huruf besar-kecil dan spasi',
      teks: 'Halo Dunia',
      kunci: 3,
      enkripsi: 'Kdor Gxqld'
    },
    {
      id: 3,
      nama: 'Batas pembungkusan alfabet (X, Y, Z)',
      teks: 'XYZ',
      kunci: 3,
      enkripsi: 'ABC'
    },
    {
      id: 4,
      nama: 'Karakter non-alfabet tetap utuh',
      teks: 'Pesan #1: aman!',
      kunci: 5,
      enkripsi: 'Ujxfs #1: frfs!'
    },
    {
      id: 5,
      nama: 'Kunci lebih besar dari 26 (29 ekuivalen 3)',
      teks: 'HALO',
      kunci: 29,
      enkripsi: 'KDOR'
    },
    {
      id: 6,
      nama: 'Kunci negatif (-3 ekuivalen 23)',
      teks: 'HALO',
      kunci: -3,
      enkripsi: 'EXIL'
    },
    {
      id: 7,
      nama: 'Kunci nol (teks tidak berubah)',
      teks: 'Halo',
      kunci: 0,
      enkripsi: 'Halo'
    },
    {
      id: 8,
      nama: 'Kunci negatif besar (-29 ekuivalen 23)',
      teks: 'ABC',
      kunci: -29,
      enkripsi: 'XYZ'
    }
  ];

  /** Menjalankan seluruh kasus uji dan mengembalikan hasilnya. */
  function jalankanUji() {
    return KASUS_UJI.map((kasus) => {
      const hasilEnkripsi = enkripsi(kasus.teks, kasus.kunci);
      const hasilDekripsi = dekripsi(hasilEnkripsi, kasus.kunci);
      const lulus = hasilEnkripsi === kasus.enkripsi && hasilDekripsi === kasus.teks;
      return {
        ...kasus,
        actual: hasilEnkripsi,
        dekripsi: hasilDekripsi,
        lulus
      };
    });
  }

  /**
   * Menjelaskan satu perhitungan (satu huruf) dalam kalimat yang mudah dipahami.
   * b       : satu baris dari rincianPerhitungan()
   * kunci   : kunci asli yang dimasukkan pengguna
   * mode    : 'enkripsi' atau 'dekripsi'
   */
  function jelaskanLangkah(b, kunci, mode) {
    const dekrip = mode === 'dekripsi';
    const s = normalisasiKunci(kunci);
    const labelMasukan = dekrip ? 'ciphertext (C)' : 'plaintext (P)';
    const labelHasil = dekrip ? 'plaintext (P)' : 'ciphertext (C)';
    const rumus = dekrip ? 'C − k' : 'P + k';

    const catatanKunci = kunci === s
      ? ''
      : ` Kunci ${kunci} diubah dulu menjadi ${s}, yaitu sisa baginya terhadap 26.`;

    return [
      `Ambil ${labelMasukan} huruf ke-${b.no}, yaitu '${b.masukan}'. Posisinya dalam alfabet adalah ${b.posisiMasukan} (A = 0, B = 1, ..., Z = 25).`,
      `Hitung ${rumus} = ${b.operasi} = ${b.mentah}.${catatanKunci}`,
      `Ambil sisa bagi terhadap 26: ${b.mentah} mod 26 = ${b.posisiHasil}.`,
      `Posisi ${b.posisiHasil} adalah huruf '${b.keluaran}'. Jadi '${b.masukan}' menjadi '${b.keluaran}' pada ${labelHasil}.`
    ];
  }

  const api = {
    M,
    mod,
    normalisasiKunci,
    parseKunci,
    enkripsi,
    dekripsi,
    rincianPerhitungan,
    KASUS_UJI,
    jalankanUji,
    jelaskanLangkah
  };

  root.Caesar = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);