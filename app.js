/*
 * app.js — menghubungkan Caesar (cipher.js) dengan halaman index.html.
 * Semua isi dibuat dengan textContent agar aman dari injeksi HTML.
 */
(function () {
  'use strict';

  const C = window.Caesar;
  const $ = (id) => document.getElementById(id);

  const formCipher = $('formCipher');
  const inputTeks = $('inputTeks');
  const inputKunci = $('inputKunci');
  const pesanError = $('pesanError');
  const hasil = $('hasil');
  const outputCipher = $('outputCipher');
  const outputPlain = $('outputPlain');
  const statusDekripsi = $('statusDekripsi');
  const infoKunci = $('infoKunci');
  const btnSalin = $('btnSalin');
  const pesanSalin = $('pesanSalin');
  const pemandu = $('pemandu');
  const progressBar = $('progressBar');
  const posisiLangkah = $('posisiLangkah');
  const faseLangkah = $('faseLangkah');
  const judulLangkah = $('judulLangkah');
  const penjelasanLangkah = $('penjelasanLangkah');
  const stripAlfabet = $('stripAlfabet');
  const keteranganStrip = $('keteranganStrip');
  const btnSebelum = $('btnSebelum');
  const btnBerikut = $('btnBerikut');
  const btnUlang = $('btnUlang');
  const tbodyEnkripsi = $('tbodyEnkripsi');
  const tbodyDekripsi = $('tbodyDekripsi');
  const btnUji = $('btnUji');
  const ringkasanUji = $('ringkasanUji');
  const tbodyUji = $('tbodyUji');

  let langkahList = [];
  let indeks = 0;

  /* ---------- Utilitas ---------- */

  function tampilkanError(pesan) {
    pesanError.textContent = pesan;
    pesanError.hidden = !pesan;
  }

  function tampilkanStatus(elemen, teks, ok) {
    elemen.textContent = teks;
    elemen.className = 'status ' + (ok ? 'ok' : 'gagal');
  }

  function isiTabel(tbody, baris, kolom) {
    tbody.textContent = '';
    for (const b of baris) {
      const tr = document.createElement('tr');
      for (const nilai of kolom(b)) {
        const td = document.createElement('td');
        td.textContent = nilai;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  /** Nama karakter yang ramah dibaca pengguna. */
  function namaKarakter(ch) {
    if (ch === ' ') return 'spasi';
    if (ch === '\n') return 'baris baru';
    return `'${ch}'`;
  }

  function apakahHuruf(ch) {
    return /^[A-Za-z]$/.test(ch);
  }

  /** Membuat satu sel huruf A–Z dengan posisinya. */
  function buatSelAlfabet(i) {
    const sel = document.createElement('div');
    sel.className = 'sel-alfabet';
    const huruf = document.createElement('strong');
    huruf.textContent = String.fromCharCode(65 + i);
    const angka = document.createElement('span');
    angka.textContent = i;
    sel.append(huruf, angka);
    return sel;
  }

  /* ---------- Tabel alfabet statis ---------- */

  function buatTabelAlfabet() {
    const wrap = $('tabelAlfabet');
    wrap.textContent = '';
    for (let i = 0; i < 26; i++) {
      wrap.appendChild(buatSelAlfabet(i));
    }
  }

  /* ---------- Strip alfabet pada pemandu ---------- */

  function gambarStrip(posAsal, posHasil) {
    stripAlfabet.textContent = '';
    if (posAsal === null) {
      stripAlfabet.hidden = true;
      keteranganStrip.textContent = '';
      return;
    }
    stripAlfabet.hidden = false;
    for (let i = 0; i < 26; i++) {
      const sel = buatSelAlfabet(i);
      const adalahAsal = i === posAsal;
      const adalahHasil = i === posHasil;
      if (adalahAsal && adalahHasil) sel.classList.add('sama');
      else if (adalahAsal) sel.classList.add('asal');
      else if (adalahHasil) sel.classList.add('tujuan');
      stripAlfabet.appendChild(sel);
    }
    keteranganStrip.textContent = posAsal === posHasil
      ? `Posisi awal dan posisi hasil sama, yaitu ${posAsal}. Ini terjadi karena pergeseran efektifnya nol.`
      : `Biru: posisi awal ${posAsal}. Hijau: posisi hasil ${posHasil}.`;
  }

  /* ---------- Penyusunan langkah pemandu ---------- */

  /**
   * Menyusun seluruh langkah untuk satu tahap (enkripsi atau dekripsi).
   * teksSumber: plaintext untuk enkripsi, ciphertext untuk dekripsi.
   */
  function buatLangkahTahap(teksSumber, kunci, mode) {
    const fase = mode === 'enkripsi' ? 'Enkripsi' : 'Dekripsi';
    const { baris } = C.rincianPerhitungan(teksSumber, kunci, mode);
    const langkah = [];
    let idx = 0;

    for (const ch of teksSumber) {
      if (apakahHuruf(ch)) {
        const b = baris[idx];
        idx += 1;
        const kata = mode === 'enkripsi' ? 'menjadi' : 'kembali menjadi';
        langkah.push({
          fase,
          judul: `Huruf ${namaKarakter(ch)} ${kata} '${b.keluaran}'`,
          penjelasan: C.jelaskanLangkah(b, kunci, mode),
          posAsal: b.posisiMasukan,
          posHasil: b.posisiHasil
        });
      } else {
        langkah.push({
          fase,
          judul: `Karakter ${namaKarakter(ch)} tidak diubah`,
          penjelasan: [
            `${namaKarakter(ch)} bukan huruf A–Z, jadi tidak ikut dihitung.`,
            `Karakter ini tetap ${namaKarakter(ch)} pada hasil ${mode === 'enkripsi' ? 'enkripsi' : 'dekripsi'}.`
          ],
          posAsal: null,
          posHasil: null
        });
      }
    }
    return langkah;
  }

  /** Seluruh alur: persiapan, enkripsi per huruf, ringkasan, dekripsi per huruf, dan kesimpulan. */
  function buatSemuaLangkah(teks, kunci, ciphertext, plaintext) {
    const kunciNormal = C.normalisasiKunci(kunci);
    const catatanKunci = kunci === kunciNormal
      ? ''
      : ` Kunci ${kunci} setara dengan ${kunciNormal} (sisa bagi terhadap 26).`;

    const semua = [];

    semua.push({
      fase: 'Persiapan',
      judul: 'Persiapan',
      penjelasan: [
        `Pesan awal: "${teks}".`,
        `Kunci yang digunakan: ${kunci}.${catatanKunci}`,
        'Program akan mengenkripsi setiap huruf, lalu mendekripsi hasilnya dengan kunci yang sama.',
        'Karakter selain huruf A–Z tidak diubah.'
      ],
      posAsal: null,
      posHasil: null
    });

    semua.push(...buatLangkahTahap(teks, kunci, 'enkripsi'));

    semua.push({
      fase: 'Ringkasan enkripsi',
      judul: `Ciphertext: "${ciphertext}"`,
      penjelasan: [
        'Semua huruf sudah dienkripsi. Hasilnya adalah ciphertext di atas.',
        'Selanjutnya, ciphertext ini akan didekripsi dengan kunci yang sama.'
      ],
      posAsal: null,
      posHasil: null
    });

    semua.push(...buatLangkahTahap(ciphertext, kunci, 'dekripsi'));

    const sama = plaintext === teks;
    semua.push({
      fase: 'Kesimpulan',
      judul: sama ? 'Dekripsi berhasil' : 'Dekripsi tidak sama dengan pesan awal',
      penjelasan: [
        `Plaintext hasil dekripsi: "${plaintext}".`,
        sama
          ? 'Hasil ini sama dengan pesan awal, sehingga dekripsi dengan kunci yang sama berhasil mengembalikan pesan.'
          : 'Hasil ini berbeda dengan pesan awal. Periksa kembali input dan kunci.'
      ],
      posAsal: null,
      posHasil: null
    });

    return semua;
  }

  /* ---------- Render pemandu ---------- */

  function tampilkanLangkah() {
    const L = langkahList[indeks];
    const total = langkahList.length;

    progressBar.style.width = `${((indeks + 1) / total) * 100}%`;
    posisiLangkah.textContent = `Langkah ${indeks + 1} dari ${total}`;
    faseLangkah.textContent = L.fase;
    judulLangkah.textContent = L.judul;

    penjelasanLangkah.textContent = '';
    for (const teks of L.penjelasan) {
      const li = document.createElement('li');
      li.textContent = teks;
      penjelasanLangkah.appendChild(li);
    }

    gambarStrip(L.posAsal, L.posHasil);

    btnSebelum.disabled = indeks === 0;
    btnBerikut.disabled = indeks === total - 1;
    btnBerikut.textContent = indeks === total - 1 ? 'Selesai ✓' : 'Berikutnya →';
  }

  /* ---------- Form ---------- */

  formCipher.addEventListener('submit', function (event) {
    event.preventDefault();
    tampilkanError('');
    pesanSalin.textContent = '';

    const teks = inputTeks.value;
    if (teks.trim() === '') {
      tampilkanError('Silakan masukkan pesan teks terlebih dahulu.');
      hasil.hidden = true;
      pemandu.hidden = true;
      return;
    }

    let kunci;
    try {
      kunci = C.parseKunci(inputKunci.value);
    } catch (err) {
      tampilkanError(err.message + ' Contoh kunci yang benar: 3, -5, atau 29.');
      hasil.hidden = true;
      pemandu.hidden = true;
      return;
    }

    const ciphertext = C.enkripsi(teks, kunci);
    const plaintext = C.dekripsi(ciphertext, kunci);

    outputCipher.textContent = ciphertext;
    outputPlain.textContent = plaintext;

    tampilkanStatus(
      statusDekripsi,
      plaintext === teks
        ? 'Dekripsi sama dengan pesan awal.'
        : 'Dekripsi berbeda dengan pesan awal.',
      plaintext === teks
    );

    const kunciNormal = C.normalisasiKunci(kunci);
    infoKunci.textContent = kunci === kunciNormal
      ? `Kunci k = ${kunci}.`
      : `Kunci k = ${kunci}, setara dengan ${kunciNormal} (sisa bagi terhadap 26).`;

    const rincEnkripsi = C.rincianPerhitungan(teks, kunci, 'enkripsi');
    isiTabel(tbodyEnkripsi, rincEnkripsi.baris, (b) => [
      b.no, b.masukan, b.posisiMasukan, b.mentah, b.posisiHasil, b.keluaran
    ]);

    const rincDekripsi = C.rincianPerhitungan(ciphertext, kunci, 'dekripsi');
    isiTabel(tbodyDekripsi, rincDekripsi.baris, (b) => [
      b.no, b.masukan, b.posisiMasukan, b.mentah, b.posisiHasil, b.keluaran
    ]);

    langkahList = buatSemuaLangkah(teks, kunci, ciphertext, plaintext);
    indeks = 0;
    tampilkanLangkah();

    hasil.hidden = false;
    pemandu.hidden = false;
  });

  /* ---------- Contoh cepat ---------- */

  document.querySelectorAll('[data-teks]').forEach((tombol) => {
    tombol.addEventListener('click', function () {
      inputTeks.value = tombol.dataset.teks;
      inputKunci.value = tombol.dataset.kunci;
      formCipher.requestSubmit();
    });
  });

  /* ---------- Navigasi pemandu ---------- */

  btnBerikut.addEventListener('click', function () {
    if (indeks < langkahList.length - 1) {
      indeks += 1;
      tampilkanLangkah();
    }
  });

  btnSebelum.addEventListener('click', function () {
    if (indeks > 0) {
      indeks -= 1;
      tampilkanLangkah();
    }
  });

  btnUlang.addEventListener('click', function () {
    indeks = 0;
    tampilkanLangkah();
  });

  /* ---------- Salin ciphertext ---------- */

  btnSalin.addEventListener('click', function () {
    const teks = outputCipher.textContent;
    if (!teks) return;

    const berhasil = () => { pesanSalin.textContent = 'Tersalin.'; };
    const gagal = () => { pesanSalin.textContent = 'Gagal menyalin. Salin secara manual.'; };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(teks).then(berhasil).catch(gagal);
    } else {
      gagal();
    }
  });

  /* ---------- Pengujian bawaan ---------- */

  btnUji.addEventListener('click', function () {
    const hasilUji = C.jalankanUji();
    const jumlahLulus = hasilUji.filter((h) => h.lulus).length;

    isiTabel(tbodyUji, hasilUji, (h) => [
      h.id,
      `${h.nama} | "${h.teks}"`,
      h.kunci,
      h.enkripsi,
      h.actual,
      h.lulus ? 'Sesuai' : 'Tidak sesuai'
    ]);

    tbodyUji.querySelectorAll('tr').forEach((tr, i) => {
      tr.lastElementChild.className = hasilUji[i].lulus ? 'lulus' : 'tidak-lulus';
    });

    tampilkanStatus(
      ringkasanUji,
      `${jumlahLulus} dari ${hasilUji.length} kasus uji sesuai.`,
      jumlahLulus === hasilUji.length
    );
  });

  /* ---------- Inisialisasi ---------- */

  buatTabelAlfabet();
})();