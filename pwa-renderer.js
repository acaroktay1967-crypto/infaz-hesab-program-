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
// Gün farkı yardımcısı (tarayıcı tarafında)
// ---------------------------------------------------------------------------

function gunFarkiLocal(tarih1Str, tarih2Str) {
  if (!tarih1Str || !tarih2Str) return 0;
  const t1 = new Date(tarih1Str);
  const t2 = new Date(tarih2Str);
  const ms = Date.UTC(t2.getFullYear(), t2.getMonth(), t2.getDate()) -
             Date.UTC(t1.getFullYear(), t1.getMonth(), t1.getDate());
  return Math.round(ms / 86400000);
}

// ---------------------------------------------------------------------------
// Sekme 1: Suç Tarihi → Dönem badge + mükerrer alanı
// ---------------------------------------------------------------------------

const DONEM_ETIKETLER = {
  1: '30.03.2020 Öncesi',
  2: '30.03.2020 – 31.07.2023 Arası',
  3: '31.07.2023 – 01.06.2024 Arası',
  4: '01.06.2024 – 04.06.2025 Arası',
  5: '04.06.2025 Sonrası'
};

function sucTarihiDonemBelirleLocal(tarihStr) {
  if (!tarihStr) return null;
  const d = new Date(tarihStr);
  if (d < new Date('2020-03-30')) return 1;
  if (d < new Date('2023-07-31')) return 2;
  if (d < new Date('2024-06-01')) return 3;
  if (d < new Date('2025-06-04')) return 4;
  return 5;
}

document.getElementById('suc-tarihi').addEventListener('change', () => {
  const tarih = document.getElementById('suc-tarihi').value;
  const donem = sucTarihiDonemBelirleLocal(tarih);
  const badge = document.getElementById('donem-badge');
  const mukerrerAlani = document.getElementById('mukerrer-alani');

  if (donem) {
    badge.style.display = 'block';
    document.getElementById('donem-badge-metin').textContent =
      `Dönem ${donem}: ${DONEM_ETIKETLER[donem]}`;
    // Mükerrer alanı yalnızca Dönem 4'te görünür
    mukerrerAlani.style.display = donem === 4 ? 'flex' : 'none';
    if (donem !== 4) document.getElementById('mukerrer').checked = false;
  } else {
    badge.style.display = 'none';
    mukerrerAlani.style.display = 'none';
  }
});

// ---------------------------------------------------------------------------
// Sekme 1: Tutuklu Toggle → alan göster/gizle + mahsup otomatik hesapla
// ---------------------------------------------------------------------------

document.getElementById('tutuklu-toggle').addEventListener('change', () => {
  const evet = document.getElementById('tutuklu-toggle').value === 'evet';
  document.getElementById('tutuklu-alan').style.display = evet ? 'block' : 'none';
  if (!evet) {
    document.getElementById('mahsup-bilgisi').style.display = 'none';
  }
});

function mahsupGuncelle() {
  const baslangic = document.getElementById('tutuklu-baslangic').value;
  const bitis     = document.getElementById('tutuklu-bitis').value;
  const bilgiDiv  = document.getElementById('mahsup-bilgisi');
  const gunSayisiInput = document.getElementById('tutuklu-gun-sayisi');

  if (baslangic && bitis) {
    const gun = gunFarkiLocal(baslangic, bitis);
    if (gun >= 0) {
      // Gün sayısını yanındaki kutuya yaz
      if (gunSayisiInput) {
        gunSayisiInput.value = gun;
      }
      const yil  = Math.floor(gun / 365);
      const kalan = gun % 365;
      const ay   = Math.floor(kalan / 30);
      const g    = kalan % 30;
      const parcalar = [];
      if (yil > 0)  parcalar.push(`${yil} yıl`);
      if (ay > 0)   parcalar.push(`${ay} ay`);
      if (g > 0)    parcalar.push(`${g} gün`);
      const sure = parcalar.length ? parcalar.join(' ') : '0 gün';
      document.getElementById('mahsup-bilgisi-metin').textContent =
        `Mahsup süresi: ${gun} gün (${sure}) – bu süre hüküm süresinden düşülür.`;
      bilgiDiv.style.display = 'flex';
    } else {
      if (gunSayisiInput) {
        gunSayisiInput.value = '0';
      }
      document.getElementById('mahsup-bilgisi-metin').textContent =
        '⚠ Salıverme tarihi tutuklama tarihinden önce olamaz.';
      bilgiDiv.style.display = 'flex';
    }
  } else {
    if (gunSayisiInput) {
      gunSayisiInput.value = '0';
    }
    bilgiDiv.style.display = 'none';
  }
}

document.getElementById('tutuklu-baslangic').addEventListener('change', mahsupGuncelle);
document.getElementById('tutuklu-bitis').addEventListener('change', mahsupGuncelle);

// ---------------------------------------------------------------------------
// Sekme 1: Hesapla
// ---------------------------------------------------------------------------

function hesaplaIsleminiCalistir() {
  try {
    hataMesajiGizle();

    var sucTarihi = document.getElementById('suc-tarihi').value;
    var cezaYil = sayiAl('ceza-yil');
    var cezaAy = sayiAl('ceza-ay');
    var cezaGun = sayiAl('ceza-gun');
    var ilkGiris = document.getElementById('ilk-giris').value;
    var cikisTarihi = document.getElementById('cikis-tarihi').value || null;
    var tutukluEvet = document.getElementById('tutuklu-toggle').value === 'evet';
    var tutuklulukBaslangic = tutukluEvet
      ? (document.getElementById('tutuklu-baslangic').value || null)
      : null;
    var tutuklulukBitis = tutukluEvet
      ? (document.getElementById('tutuklu-bitis').value || null)
      : null;
    var istisnaSuc = document.getElementById('istisna-suc').value;
    var isMukerrer = document.getElementById('mukerrer').checked;

    if (!sucTarihi) {
      hataMesajiGoster('Lütfen suç tarihini giriniz.');
      return;
    }
    if (!ilkGiris) {
      hataMesajiGoster('Lütfen cezaevine giriş tarihini giriniz.');
      return;
    }
    if (cezaYil === 0 && cezaAy === 0 && cezaGun === 0) {
      hataMesajiGoster('Lütfen hüküm süresini giriniz (en az 1 gün).');
      return;
    }

    var params = {
      sucTarihi: sucTarihi,
      cezaYil: cezaYil,
      cezaAy: cezaAy,
      cezaGun: cezaGun,
      cezaeviGirisTarihi: ilkGiris,
      cezaeviCikisTarihi: cikisTarihi,
      tutuklulukBaslangic: tutuklulukBaslangic,
      tutuklulukBitis: tutuklulukBitis,
      istisnaSuc: istisnaSuc,
      isMukerrer: isMukerrer
    };

    if (!window.infazAPI) {
      hataMesajiGoster('Hesaplama modülü yüklenemedi. Sayfayı yenileyin.');
      console.error('window.infazAPI bulunamadı');
      return;
    }

    console.log('Hesaplama parametreleri:', params);
    
    var yanit = window.infazAPI.yeniHesapla(params);
    
    // Promise veya doğrudan değer olabilir
    if (yanit && typeof yanit.then === 'function') {
      yanit.then(function(sonuc) {
        if (!sonuc.success) {
          hataMesajiGoster('Hesaplama hatası: ' + sonuc.error);
          return;
        }
        yeniSonuclariGoster(sonuc.data);
      }).catch(function(err) {
        hataMesajiGoster('Hesaplama hatası: ' + err.message);
      });
    } else {
      // Doğrudan sonuç döndüyse
      if (!yanit.success) {
        hataMesajiGoster('Hesaplama hatası: ' + yanit.error);
        return;
      }
      yeniSonuclariGoster(yanit.data);
    }
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
    hataMesajiGoster('Beklenmeyen hata: ' + err.message);
  }
}

// Hesapla butonuna tıklama olayı
document.getElementById('hesapla-btn').onclick = hesaplaIsleminiCalistir;

// ---------------------------------------------------------------------------
// Sekme 1: Temizle
// ---------------------------------------------------------------------------

document.getElementById('temizle-btn').addEventListener('click', () => {
  document.getElementById('suc-tarihi').value  = '';
  document.getElementById('ceza-yil').value    = '0';
  document.getElementById('ceza-ay').value     = '0';
  document.getElementById('ceza-gun').value    = '0';
  document.getElementById('ilk-giris').value   = '';
  document.getElementById('cikis-tarihi').value = '';
  document.getElementById('tutuklu-toggle').value = 'hayir';
  document.getElementById('tutuklu-baslangic').value = '';
  document.getElementById('tutuklu-bitis').value     = '';
  document.getElementById('mukerrer').checked  = false;
  document.getElementById('istisna-suc').value = 'NORMAL';
  document.getElementById('tutuklu-alan').style.display    = 'none';
  document.getElementById('mahsup-bilgisi').style.display  = 'none';
  document.getElementById('donem-badge').style.display     = 'none';
  document.getElementById('mukerrer-alani').style.display  = 'none';
  hataMesajiGizle();
  document.getElementById('sonuclar-kart').style.display   = 'none';
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
// Yeni Sonuçları Göster
// ---------------------------------------------------------------------------

function yeniSonuclariGoster(d) {
  const kart = document.getElementById('sonuclar-kart');
  kart.style.display = 'block';

  // Özet kutu
  document.getElementById('ozet-donem').textContent    = `Dönem ${d.donemNo}: ${d.donemLabel}`;
  document.getElementById('ozet-baslangic').textContent = d.efektifBaslangic;
  document.getElementById('ozet-ks-oran').textContent  = `${d.ksOranKesir} (${d.ksOran})`;
  document.getElementById('ozet-ks').textContent       = d.ksTarihi;

  // Detay tablosu
  const tbody = document.getElementById('sonuc-tablo-govde');
  tbody.innerHTML = '';

  const satirlar = [];

  // Dönem bilgisi
  satirlar.push({ etiket: 'Suç Tarihi Dönemi', deger: `Dönem ${d.donemNo} – ${d.donemLabel}`, sinif: 'onemli' });
  satirlar.push({ etiket: 'Suç Tarihi', deger: d.sucTarihi });
  satirlar.push({ etiket: 'Cezaevine Giriş', deger: d.cezaeviGirisTarihi });

  // Mahsup
  if (d.mahsupGunSayisi > 0) {
    satirlar.push({ tip: 'ayrac' });
    satirlar.push({ etiket: 'Mahsup Süresi (tutukluluk)', deger: `${d.mahsupYMG} (${d.mahsupGunSayisi} gün)`, sinif: 'vurgu' });
    satirlar.push({ etiket: 'Efektif İnfaz Başlangıcı', deger: d.efektifBaslangic, sinif: 'onemli' });
  } else {
    satirlar.push({ etiket: 'Efektif İnfaz Başlangıcı', deger: d.efektifBaslangic });
  }

  // Ceza süresi
  satirlar.push({ tip: 'ayrac' });
  satirlar.push({ etiket: 'Toplam Ceza Süresi', deger: `${d.toplamCezaYMG} (${d.toplamCezaGun} gün)` });
  satirlar.push({ etiket: 'Tam Tahliye Tarihi', deger: d.tahlieTarihi });

  // KS
  satirlar.push({ tip: 'ayrac' });
  satirlar.push({ etiket: `Koşullu Salıverme Oranı (${d.ksOranKesir})`, deger: d.ksOran, sinif: 'oran-satir' });
  satirlar.push({ etiket: 'KS Süresi', deger: `${d.ksYMG} (${d.ksGun} gün)` });
  satirlar.push({ etiket: '→ Koşullu Salıverme Tarihi (KS)', deger: d.ksTarihi, sinif: 'basari' });

  // DS
  satirlar.push({ tip: 'ayrac' });
  if (d.dsEligible) {
    if (d.dsBaslangic) {
      satirlar.push({ etiket: '→ DS Başlangıç Tarihi', deger: d.dsBaslangic, sinif: 'basari' });
      satirlar.push({ etiket: '→ DS Bitiş Tarihi', deger: d.dsBitis });
    }
    satirlar.push({ etiket: 'DS Süresi / Kural', deger: d.dsSuresiAciklama });
    if (d.erkenDsTarihi) {
      satirlar.push({ etiket: '→ Geçici 10/6 Erken DS Tarihi', deger: d.erkenDsTarihi, sinif: 'vurgu' });
    }
  } else {
    satirlar.push({ etiket: 'Denetimli Serbestlik (DS)', deger: '❌ ' + d.dsSuresiAciklama });
  }

  // Erken Açık
  if (d.erkenAcikTarihi) {
    satirlar.push({ tip: 'ayrac' });
    const yil = d.donemNo <= 3 ? '3' : '5';
    satirlar.push({
      etiket: `→ Geçici 10/6 Erken Açık Cezaevi (+${yil} yıl)`,
      deger: d.erkenAcikTarihi,
      sinif: 'vurgu'
    });
  }

  // Cezaevinde gerçek kalış (çıkış tarihi girildiyse)
  if (d.cezaeviGercekSure) {
    satirlar.push({ tip: 'ayrac' });
    satirlar.push({ etiket: 'Cezaevinde Kalış (giriş→çıkış)', deger: `${d.cezaeviGercekSure.toplamYMG} (${d.cezaeviGercekSure.toplamGun} gün)` });
    satirlar.push({ etiket: 'Efektif Kalış (mahsup sonrası)', deger: `${d.cezaeviGercekSure.efektifYMG} (${d.cezaeviGercekSure.efektifGun} gün)` });
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

  // Dönem notu
  const notAlani = document.getElementById('donem-not-alani');
  if (d.donemNot) {
    document.getElementById('donem-not-metin').textContent = d.donemNot;
    notAlani.style.display = 'flex';
  } else {
    notAlani.style.display = 'none';
  }

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

  div.querySelector('.donem-giris').addEventListener('change', () => donemSuresiGuncelle(idx));
  div.querySelector('.donem-cikis').addEventListener('change', () => donemSuresiGuncelle(idx));

  div.querySelector('input[type="radio"]').addEventListener('change', () => {
    excludedDonemIdx = idx;
    tumDonemlerHesapla();
  });

  tumDonemlerHesapla();
}

function donemSil(idx) {
  const el = document.getElementById(`donem-${idx}`);
  if (el) el.remove();
  if (excludedDonemIdx === idx) {
    excludedDonemIdx = -1;
    document.querySelectorAll('input[name="haric-donem"]').forEach(r => r.checked = false);
  }
  tumDonemlerHesapla();
}

function donemSuresiGuncelle(idx) {
  const girisEl = document.getElementById(`donem-giris-${idx}`);
  const cikisEl = document.getElementById(`donem-cikis-${idx}`);
  const sureEl  = document.getElementById(`donem-sure-${idx}`);

  if (girisEl && girisEl.value && cikisEl && cikisEl.value) {
    const ms = new Date(cikisEl.value) - new Date(girisEl.value);
    if (ms >= 0) {
      sureEl.textContent = `${Math.round(ms / 86400000)} gün`;
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
    const idx     = parseInt(satir.dataset.idx, 10);
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

  const tumToplamGun = d.donemDetay.reduce((acc, dd) => acc + (dd.gun || 0), 0);
  document.getElementById('donem-toplam-tumü').textContent = `${tumToplamGun} gün`;
  document.getElementById('donem-toplam-dahil').textContent =
    `${d.toplamGun} gün (${d.toplamYMG})`;
}

document.getElementById('donem-ekle-btn').addEventListener('click', donemEkle);

// ---------------------------------------------------------------------------
// Sekme 3: Lehe Yasa Karşılaştırması
// ---------------------------------------------------------------------------

document.getElementById('lehe-hesapla-btn').addEventListener('click', async () => {
  const leheHata      = document.getElementById('lehe-hata');
  const leheHataMetin = document.getElementById('lehe-hata-metin');
  leheHata.style.display = 'none';
  document.getElementById('lehe-sonuc-alani').style.display = 'none';

  const params = {
    ilkGirisTarihi:   document.getElementById('lehe-giris').value,
    mahsupYil:        sayiAl('lehe-mahsup-yil'),
    mahsupAy:         sayiAl('lehe-mahsup-ay'),
    mahsupGun:        sayiAl('lehe-mahsup-gun'),
    yasa5237Yil:      sayiAl('l5237-yil'),
    yasa5237Ay:       sayiAl('l5237-ay'),
    yasa5237Gun:      sayiAl('l5237-gun'),
    yasa5237Kategori: document.getElementById('l5237-kategori').value,
    yasa765Yil:       sayiAl('l765-yil'),
    yasa765Ay:        sayiAl('l765-ay'),
    yasa765Gun:       sayiAl('l765-gun'),
    yasa765KsOran:    ondalikAl('l765-ks-oran', 2 / 3),
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
    { etiket: 'Ceza',                    deger: veri.ceza },
    { etiket: 'Toplam Ceza (gün)',       deger: `${veri.toplamYMG} (${veri.toplamGun} gün)` },
    { etiket: 'Kapalı Süre',             deger: `${veri.kapaliYMG} (${veri.kapaliGun} gün)` },
    { etiket: '→ Açığa Geçiş',          deger: veri.kapaliSon, sinif: 'vurgu' },
    { etiket: 'KS Süresi',              deger: `${veri.ksYMG} (${veri.ksGun} gün)` },
    { etiket: '→ Koşullu Salıverme',    deger: veri.ksTarihi, sinif: 'basari' },
    { etiket: '→ Denetimli Serbestlik', deger: veri.dsTarihi || '—' }
  ];

  satirlar.forEach(s => {
    const tr = document.createElement('tr');
    if (s.sinif) tr.className = s.sinif;
    tr.innerHTML = `<td>${s.etiket}</td><td>${s.deger}</td>`;
    tbody.appendChild(tr);
  });
}
