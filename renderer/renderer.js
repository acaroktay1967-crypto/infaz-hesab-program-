'use strict';

/* ============================================================
   İnfaz Hesaplama Programı – Arayüz Mantığı
   ============================================================ */

// ---------------------------------------------------------------------------
// Sekme Yönetimi
// ---------------------------------------------------------------------------

document.querySelectorAll('.sekme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const hedef = btn.dataset.sekme;
    document.querySelectorAll('.sekme-btn').forEach(b => b.classList.remove('aktif'));
    document.querySelectorAll('.sekme-panel').forEach(p => p.classList.remove('aktif'));
    btn.classList.add('aktif');
    document.getElementById('panel-' + hedef).classList.add('aktif');
  });
});

// ---------------------------------------------------------------------------
// Yardımcı: Sayı Alanı Varsayılanı
// ---------------------------------------------------------------------------

function sayiAl(id, varsayilan = 0) {
  const v = parseInt(document.getElementById(id).value, 10);
  return isNaN(v) || v < 0 ? varsayilan : v;
}

function ondalikAl(id, varsayilan = 0) {
  const v = parseFloat(document.getElementById(id).value);
  return isNaN(v) ? varsayilan : v;
}

// ---------------------------------------------------------------------------
// Sekme 1: Müebbet kategorisi seçince ceza süresi alanını gizle
// ---------------------------------------------------------------------------

const kategoriSec = document.getElementById('kategori');

kategoriSec.addEventListener('change', () => {
  const isMuzebbet = kategoriSec.value === 'MUZEBBET' || kategoriSec.value === 'AGIR_MUZEBBET';
  document.getElementById('sure-alani').style.display = isMuzebbet ? 'none' : 'block';
});

// ---------------------------------------------------------------------------
// Sekme 1: Hesapla
// ---------------------------------------------------------------------------

document.getElementById('hesapla-btn').addEventListener('click', async () => {
  hataMesajiGizle();
  const kategori = kategoriSec.value;
  const isMuzebbet = kategori === 'MUZEBBET' || kategori === 'AGIR_MUZEBBET';

  const params = {
    kategoriId: kategori,
    cezaYil: isMuzebbet ? 0 : sayiAl('ceza-yil'),
    cezaAy: isMuzebbet ? 0 : sayiAl('ceza-ay'),
    cezaGun: isMuzebbet ? 0 : sayiAl('ceza-gun'),
    sucTarihi: document.getElementById('suc-tarihi').value,
    cocukMu: document.getElementById('fail-statu').value === 'COCUK',
    mukerrirMi: document.getElementById('mukerrir-mi').checked,
    ikinciKezMukerrirMi: document.getElementById('ikinci-kez-mukerrir-mi').checked,
    gecici6Uygula: document.getElementById('gecici6-ucyil').checked,
    ilkGirisTarihi: document.getElementById('ilk-giris').value,
    mahsupYil: sayiAl('mahsup-yil'),
    mahsupAy: sayiAl('mahsup-ay'),
    mahsupGun: sayiAl('mahsup-gun')
  };

  if (!params.ilkGirisTarihi) {
    hataMesajiGoster('Lütfen cezaevine ilk giriş tarihini giriniz.');
    return;
  }

  if (!isMuzebbet && params.cezaYil === 0 && params.cezaAy === 0 && params.cezaGun === 0) {
    hataMesajiGoster('Lütfen ceza süresini giriniz (en az 1 gün).');
    return;
  }

  const yanit = await window.infazAPI.hesapla(params);

  if (!yanit.success) {
    hataMesajiGoster('Hesaplama hatası: ' + yanit.error);
    return;
  }

  sonuclariGoster(yanit.data);
});

// ---------------------------------------------------------------------------
// Sekme 1: Temizle
// ---------------------------------------------------------------------------

document.getElementById('temizle-btn').addEventListener('click', () => {
  ['ceza-yil', 'ceza-ay', 'ceza-gun', 'mahsup-yil', 'mahsup-ay', 'mahsup-gun']
    .forEach(id => { document.getElementById(id).value = '0'; });
  document.getElementById('ilk-giris').value = '';
  document.getElementById('suc-tarihi').value = '';
  document.getElementById('fail-statu').value = 'YETISKIN';
  document.getElementById('mukerrir-mi').checked = false;
  document.getElementById('ikinci-kez-mukerrir-mi').checked = false;
  document.getElementById('gecici6-ucyil').checked = false;
  hataMesajiGizle();
  document.getElementById('sonuclar-kart').style.display = 'none';
});

// ---------------------------------------------------------------------------
// Hata Mesajı Yardımcıları
// ---------------------------------------------------------------------------

function hataMesajiGoster(msg) {
  const div = document.getElementById('hata-mesaji');
  document.getElementById('hata-metin').textContent = msg;
  div.style.display = 'flex';
}

function hataMesajiGizle() {
  document.getElementById('hata-mesaji').style.display = 'none';
}

// ---------------------------------------------------------------------------
// Sonuçları Göster
// ---------------------------------------------------------------------------

function sonuclariGoster(d) {
  const kart = document.getElementById('sonuclar-kart');
  kart.style.display = 'block';

  // Özet kutu
  document.getElementById('ozet-kategori').textContent = d.kategori;
  document.getElementById('ozet-baslangic').textContent = d.efektifBaslangic;
  document.getElementById('ozet-toplam').textContent = d.toplamCezaYMG;
  document.getElementById('ozet-ks').textContent = d.ksTarihi;

  // Zaman çubuğu (yalnızca süreli ceza)
  if (!d.muzebbet && d.toplamCezaGun > 0) {
    const kapaliYüz = Math.round((d.kapaliGun / d.toplamCezaGun) * 100);
    const acikYüz = Math.round((d.acikGun / d.toplamCezaGun) * 100);
    document.getElementById('bar-kapali').style.width = kapaliYüz + '%';
    document.getElementById('bar-acik').style.width = acikYüz + '%';
    document.getElementById('zaman-cubugu-alani').style.display = 'block';
  } else {
    document.getElementById('zaman-cubugu-alani').style.display = 'none';
  }

  // Detay tablosu
  const tbody = document.getElementById('sonuc-tablo-govde');
  tbody.innerHTML = '';

  const satirlar = [];

  satirlar.push({ etiket: 'Efektif İnfaz Başlangıcı', deger: d.efektifBaslangic, sinif: 'onemli' });

  if (d.mahsupToplamGun > 0) {
    satirlar.push({ etiket: 'Mahsup Edilen Süre', deger: `${d.mahsupYMG} (${d.mahsupToplamGun} gün)` });
  }

  if (!d.muzebbet) {
    satirlar.push({ etiket: 'Toplam Ceza Süresi', deger: `${d.toplamCezaYMG} (${d.toplamCezaGun} gün)` });
    satirlar.push({ etiket: 'Tam Tahliye Tarihi', deger: d.tahlieTarihi });
  }

  satirlar.push({ tip: 'ayrac' });

  satirlar.push({ etiket: `Kapalı Ceza Süresi (${d.kapaliOran})`, deger: `${d.kapaliYMG} (${d.kapaliGun} gün)`, sinif: 'oran-satir' });
  satirlar.push({ etiket: '→ Açığa Geçiş Tarihi', deger: d.kapaliSon, sinif: 'vurgu' });

  satirlar.push({ tip: 'ayrac' });

  satirlar.push({ etiket: 'Açık Ceza Süresi', deger: `${d.acikYMG} (${d.acikGun} gün)`, sinif: 'oran-satir' });

  satirlar.push({ tip: 'ayrac' });

  satirlar.push({ etiket: `Koşullu Salıverme Süresi (${d.ksOran})`, deger: `${d.ksYMG} (${d.ksGun} gün)`, sinif: 'oran-satir' });
  satirlar.push({ etiket: '→ Koşullu Salıverme Tarihi (KS)', deger: d.ksTarihi, sinif: 'basari' });
  if (d.kuralAciklama) {
    satirlar.push({ etiket: 'Uygulanan Kural', deger: d.kuralAciklama, sinif: 'vurgu' });
  }

  satirlar.push({ tip: 'ayrac' });

  if (d.dsEligible) {
    if (d.dsTarihi) {
      satirlar.push({
        etiket: '→ Denetimli Serbestlik Tarihi (DS)',
        deger: d.dsTarihi + (d.dsAciklama ? ` ${d.dsAciklama}` : ''),
        sinif: 'basari'
      });
    } else {
      satirlar.push({ etiket: 'Denetimli Serbestlik', deger: 'Süre çok kısa – DS uygulanamaz' });
    }
  } else {
    satirlar.push({ etiket: 'Denetimli Serbestlik', deger: '❌ Bu kategori için DS uygulanmaz' });
  }

  if (!d.muzebbet && d.tahlieTarihi) {
    satirlar.push({ tip: 'ayrac' });
    satirlar.push({ etiket: '→ Tam Tahliye Tarihi', deger: d.tahlieTarihi, sinif: 'onemli' });
  }

  satirlar.forEach(s => {
    if (s.tip === 'ayrac') {
      tbody.innerHTML += `<tr><td colspan="2" style="padding:4px 0; background:transparent;"></td></tr>`;
      return;
    }
    const tr = document.createElement('tr');
    if (s.sinif) tr.className = s.sinif;
    tr.innerHTML = `<td>${s.etiket}</td><td>${s.deger || '—'}</td>`;
    tbody.appendChild(tr);
  });

  // Sayfayı sonuçlara kaydır
  kart.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------------------------------------------------------------------------
// Sekme 2: Dönem Yönetimi
// ---------------------------------------------------------------------------

let donemSayaci = 0;
let excludedDonemIdx = -1;

function donemEkle() {
  const idx = donemSayaci++;
  const liste = document.getElementById('donemler-listesi');

  const div = document.createElement('div');
  div.className = 'donem-satir';
  div.id = `donem-${idx}`;
  div.dataset.idx = idx;

  div.innerHTML = `
    <div class="donem-no">${idx + 1}</div>
    <div class="form-grup" style="min-width:140px;">
      <label>Giriş Tarihi</label>
      <input type="date" class="donem-giris" id="donem-giris-${idx}" />
    </div>
    <div class="form-grup" style="min-width:140px;">
      <label>Çıkış Tarihi</label>
      <input type="date" class="donem-cikis" id="donem-cikis-${idx}" />
    </div>
    <div class="donem-sure" id="donem-sure-${idx}">—</div>
    <label style="display:flex; align-items:center; gap:5px; cursor:pointer; font-size:12px; text-transform:none; color:var(--renk-metin); letter-spacing:0;">
      <input type="radio" name="haric-donem" value="${idx}" />
      <span class="haric-etiket">Hesaba Katılmayacak</span>
    </label>
    <button class="btn btn-tehlike btn-kucuk" onclick="donemSil(${idx})" title="Dönemi sil">✖</button>
  `;

  liste.appendChild(div);

  // Tarih değişince süreyi hesapla
  div.querySelector('.donem-giris').addEventListener('change', () => donemSuresiGuncelle(idx));
  div.querySelector('.donem-cikis').addEventListener('change', () => donemSuresiGuncelle(idx));

  // Radio değişince
  div.querySelector('input[type="radio"]').addEventListener('change', () => {
    excludedDonemIdx = idx;
    tumDonemlerHesapla();
  });

  // İlk radio seçiliyse sıfırla
  tumDonemlerHesapla();
}

function donemSil(idx) {
  const el = document.getElementById(`donem-${idx}`);
  if (el) el.remove();
  if (excludedDonemIdx === idx) {
    excludedDonemIdx = -1;
    // Radio'ları temizle
    document.querySelectorAll('input[name="haric-donem"]').forEach(r => r.checked = false);
  }
  tumDonemlerHesapla();
}

function donemSuresiGuncelle(idx) {
  const girisEl = document.getElementById(`donem-giris-${idx}`);
  const cikisEl = document.getElementById(`donem-cikis-${idx}`);
  const sureEl = document.getElementById(`donem-sure-${idx}`);

  if (girisEl && girisEl.value && cikisEl && cikisEl.value) {
    const giris = new Date(girisEl.value);
    const cikis = new Date(cikisEl.value);
    const ms = cikis - giris;
    if (ms >= 0) {
      const gunler = Math.round(ms / 86400000);
      sureEl.textContent = `${gunler} gün`;
    } else {
      sureEl.textContent = '⚠ Hata';
    }
  } else {
    sureEl.textContent = '—';
  }
  tumDonemlerHesapla();
}

async function tumDonemlerHesapla() {
  const donemler = [];
  document.querySelectorAll('.donem-satir').forEach(satir => {
    const idx = parseInt(satir.dataset.idx, 10);
    const girisEl = document.getElementById(`donem-giris-${idx}`);
    const cikisEl = document.getElementById(`donem-cikis-${idx}`);
    if (girisEl && cikisEl) {
      donemler.push({ giris: girisEl.value, cikis: cikisEl.value });
    }
  });

  if (donemler.length === 0) {
    document.getElementById('donem-sonuc-alani').style.display = 'none';
    return;
  }

  const yanit = await window.infazAPI.donemHesapla({ donemler, excludeIndex: excludedDonemIdx });
  if (!yanit.success) return;

  const d = yanit.data;
  document.getElementById('donem-sonuc-alani').style.display = 'block';

  // Toplam (tümü)
  const tumToplamGun = d.donemDetay.reduce((acc, dd) => acc + (dd.gun || 0), 0);
  document.getElementById('donem-toplam-tumü').textContent = `${tumToplamGun} gün`;

  // Hesaba katılan
  document.getElementById('donem-toplam-dahil').textContent =
    `${d.toplamGun} gün (${d.toplamYMG})`;
}

document.getElementById('donem-ekle-btn').addEventListener('click', donemEkle);

// ---------------------------------------------------------------------------
// Sekme 3: Lehe Yasa Karşılaştırması
// ---------------------------------------------------------------------------

document.getElementById('lehe-hesapla-btn').addEventListener('click', async () => {
  const leheHata = document.getElementById('lehe-hata');
  const leheHataMetin = document.getElementById('lehe-hata-metin');
  leheHata.style.display = 'none';
  document.getElementById('lehe-sonuc-alani').style.display = 'none';

  const params = {
    ilkGirisTarihi: document.getElementById('lehe-giris').value,
    mahsupYil: sayiAl('lehe-mahsup-yil'),
    mahsupAy: sayiAl('lehe-mahsup-ay'),
    mahsupGun: sayiAl('lehe-mahsup-gun'),
    yasa5237Yil: sayiAl('l5237-yil'),
    yasa5237Ay: sayiAl('l5237-ay'),
    yasa5237Gun: sayiAl('l5237-gun'),
    yasa5237Kategori: document.getElementById('l5237-kategori').value,
    yasa765Yil: sayiAl('l765-yil'),
    yasa765Ay: sayiAl('l765-ay'),
    yasa765Gun: sayiAl('l765-gun'),
    yasa765KsOran: ondalikAl('l765-ks-oran', 2 / 3),
    yasa765KapaliOran: ondalikAl('l765-kapali-oran', 0.5)
  };

  if (!params.ilkGirisTarihi) {
    leheHataMetin.textContent = 'Lütfen giriş tarihini giriniz.';
    leheHata.style.display = 'flex';
    return;
  }

  const yanit = await window.infazAPI.leheKarsilastir(params);

  if (!yanit.success) {
    leheHataMetin.textContent = 'Hata: ' + yanit.error;
    leheHata.style.display = 'flex';
    return;
  }

  const d = yanit.data;
  document.getElementById('lehe-sonuc-alani').style.display = 'block';
  document.getElementById('lehe-sonuc-metin').textContent = '⚖️ ' + d.leheYasa;

  leheTabloOlustur('lehe-5237-tablo', d.tck5237);
  leheTabloOlustur('lehe-765-tablo', d.tck765);
});

function leheTabloOlustur(tbodyId, veri) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';

  const satirlar = [
    { etiket: 'Ceza', deger: veri.ceza },
    { etiket: 'Toplam Ceza (gün)', deger: `${veri.toplamYMG} (${veri.toplamGun} gün)` },
    { etiket: 'Kapalı Süre', deger: `${veri.kapaliYMG} (${veri.kapaliGun} gün)` },
    { etiket: '→ Açığa Geçiş', deger: veri.kapaliSon, sinif: 'vurgu' },
    { etiket: 'KS Süresi', deger: `${veri.ksYMG} (${veri.ksGun} gün)` },
    { etiket: '→ Koşullu Salıverme', deger: veri.ksTarihi, sinif: 'basari' },
    { etiket: '→ Denetimli Serbestlik', deger: veri.dsTarihi || '—' }
  ];

  satirlar.forEach(s => {
    const tr = document.createElement('tr');
    if (s.sinif) tr.className = s.sinif;
    tr.innerHTML = `<td>${s.etiket}</td><td>${s.deger}</td>`;
    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------------------------
// Sekme 4: Adli para / tekerrür analizi
// ---------------------------------------------------------------------------

document.getElementById('ap-analiz-btn').addEventListener('click', async () => {
  const hata = document.getElementById('ap-hata');
  const hataMetin = document.getElementById('ap-hata-metin');
  const sonucAlani = document.getElementById('ap-sonuc-alani');
  const sonucTablo = document.getElementById('ap-sonuc-tablo');
  hata.style.display = 'none';
  sonucAlani.style.display = 'none';

  const params = {
    kararTarihi: document.getElementById('ap-karar-tarihi').value,
    sucTarihi: document.getElementById('ap-suc-tarihi').value,
    cezaTuru: document.getElementById('ap-ceza-turu').value,
    toplamAdliPara: sayiAl('ap-toplam-para'),
    eski765Lehe6474: document.getElementById('ap-eski-765-istisna').checked,
    ikinciSucTarihi: document.getElementById('ap-ikinci-suc').value,
    oncekiHukmunKesinlesmeTarihi: document.getElementById('ap-onceki-kesin').value
  };

  if (!params.kararTarihi) {
    hataMetin.textContent = 'Lütfen karar tarihini giriniz.';
    hata.style.display = 'flex';
    return;
  }

  const yanit = await window.infazAPI.adliParaTekerrur(params);
  if (!yanit.success) {
    hataMetin.textContent = 'Hata: ' + yanit.error;
    hata.style.display = 'flex';
    return;
  }

  const d = yanit.data;
  sonucTablo.innerHTML = '';
  [
    ['Karar Tarihi', d.kararTarihi],
    ['Suç Tarihi', d.sucTarihi],
    ['Ceza Türü', d.cezaTuru === 'DOGRUDAN' ? 'Doğrudan adli para' : 'Hapisten çevrilen adli para'],
    ['Toplam Adli Para', `${Number(d.toplamAdliPara || 0).toLocaleString('tr-TR')} TL`],
    ['Kesinlik', d.kesinDurumu],
    ['Kanun Yolu', d.kanunYolu],
    ['Tekerrür Sonucu', d.tekerrurEsas],
    ['Uyarlama', d.uyarlama],
    ['Açıklama', d.aciklama]
  ].forEach(([etiket, deger]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${etiket}</td><td>${deger || '—'}</td>`;
    sonucTablo.appendChild(tr);
  });

  sonucAlani.style.display = 'block';
});
