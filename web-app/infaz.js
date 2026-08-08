'use strict';

/**
 * İnfaz Hesaplama Motoru - PWA/Web Versiyonu
 * 5275 Sayılı Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun
 *
 * Tarih hesabı: Resmi takvime göre – 1 yıl takvim yılı (artık yıllar dahil),
 * 1 ay gerçek ay uzunluğu (28-31 gün).
 */

// ---------------------------------------------------------------------------
// İnfaz Kategorileri (5275 s. Kanun m. 107)
// ---------------------------------------------------------------------------

const KATEGORILER = {
  GENEL: {
    id: 'GENEL',
    label: 'Genel Suç (2/3 KS)',
    aciklama: 'TCK kapsamındaki genel suçlar – kapalı 1/2, KS 2/3',
    kapali_oran: 1 / 2,
    ks_oran: 2 / 3,
    ds_gun: 365,
    ds_eligible: true,
    muzebbet: false
  },
  AGIR: {
    id: 'AGIR',
    label: 'Ağır Suç (3/4 KS) – TCK 81, 94, 102/2, 103, 109/3, 188',
    aciklama: 'Kasten öldürme, işkence, nitelikli cinsel suç, uyuşturucu ticareti vb.',
    kapali_oran: 3 / 4,
    ks_oran: 3 / 4,
    ds_gun: 365,
    ds_eligible: true,
    muzebbet: false
  },
  TEROR: {
    id: 'TEROR',
    label: 'Terör Suçu (3/4 KS) – TMK 1-17',
    aciklama: 'Terörle mücadele kanunu kapsamındaki suçlar – DS uygulanmaz',
    kapali_oran: 3 / 4,
    ks_oran: 3 / 4,
    ds_gun: 0,
    ds_eligible: false,
    muzebbet: false
  },
  CINSEL_COCUK: {
    id: 'CINSEL_COCUK',
    label: 'Çocuğa Karşı Cinsel Suç (TCK 103) – DS uygulanmaz',
    aciklama: 'Reşit olmayan mağdura karşı cinsel suçlar – denetimli serbestlik uygulanmaz',
    kapali_oran: 3 / 4,
    ks_oran: 3 / 4,
    ds_gun: 0,
    ds_eligible: false,
    muzebbet: false
  },
  ORGUTSUZ_CINSEL: {
    id: 'ORGUTSUZ_CINSEL',
    label: 'Örgütsüz Cinsel Saldırı / TCK 102/1',
    aciklama: 'Örgütsüz cinsel saldırı – kapalı 2/3, KS 2/3',
    kapali_oran: 2 / 3,
    ks_oran: 2 / 3,
    ds_gun: 365,
    ds_eligible: true,
    muzebbet: false
  },
  MUZEBBET: {
    id: 'MUZEBBET',
    label: 'Müebbet Hapis Cezası (30 yıl KS)',
    aciklama: 'Müebbet hapis – 24 yıl kapalı, 6 yıl açık, 30 yılda KS',
    kapali_gun: 24 * 365,
    acik_gun: 6 * 365,
    ks_gun: 30 * 365,
    ds_gun: 365,
    ds_eligible: true,
    muzebbet: true
  },
  AGIR_MUZEBBET: {
    id: 'AGIR_MUZEBBET',
    label: 'Ağırlaştırılmış Müebbet Hapis (36 yıl KS)',
    aciklama: 'Ağırlaştırılmış müebbet – 30 yıl kapalı, 6 yıl açık, 36 yılda KS',
    kapali_gun: 30 * 365,
    acik_gun: 6 * 365,
    ks_gun: 36 * 365,
    ds_gun: 0,
    ds_eligible: false,
    muzebbet: true
  }
};

// ---------------------------------------------------------------------------
// Tarih yardımcı fonksiyonları
// ---------------------------------------------------------------------------

function toDate(d) {
  if (d instanceof Date) return new Date(d);
  return new Date(d);
}

function ayEkle(tarih, ay) {
  const d = toDate(tarih);
  const gunOriginal = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + ay);
  const sonGun = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(gunOriginal, sonGun));
  return d;
}

function yilEkle(tarih, yil) {
  const d = toDate(tarih);
  const gun = d.getDate();
  const ay = d.getMonth();
  d.setFullYear(d.getFullYear() + yil);
  if (d.getMonth() !== ay) {
    d.setDate(0);
  } else {
    d.setDate(gun);
  }
  return d;
}

function gunEkle(tarih, gun) {
  const d = toDate(tarih);
  d.setDate(d.getDate() + gun);
  return d;
}

function cezaEkle(tarih, yil, ay, gun) {
  let d = toDate(tarih);
  if (yil > 0) d = yilEkle(d, yil);
  if (ay > 0) d = ayEkle(d, ay);
  if (gun > 0) d = gunEkle(d, gun);
  return d;
}

function gunFarki(tarih1, tarih2) {
  const t1 = toDate(tarih1);
  const t2 = toDate(tarih2);
  const ms = Date.UTC(t2.getFullYear(), t2.getMonth(), t2.getDate()) -
             Date.UTC(t1.getFullYear(), t1.getMonth(), t1.getDate());
  return Math.round(ms / 86400000);
}

function cezayiGuneCevir(baslangic, yil, ay, gun) {
  const bitis = cezaEkle(baslangic, yil, ay, gun);
  return gunFarki(baslangic, bitis);
}

// ---------------------------------------------------------------------------
// Biçimlendirme yardımcıları
// ---------------------------------------------------------------------------

function tarihFormat(tarih) {
  if (!tarih) return '—';
  const d = toDate(tarih);
  const g = String(d.getDate()).padStart(2, '0');
  const a = String(d.getMonth() + 1).padStart(2, '0');
  return `${g}.${a}.${d.getFullYear()}`;
}

function gunYMGFormat(toplamGun) {
  if (toplamGun <= 0) return '0 gün';
  const yil = Math.floor(toplamGun / 365);
  const kalan = toplamGun % 365;
  const ay = Math.floor(kalan / 30);
  const gun = kalan % 30;
  const parcalar = [];
  if (yil > 0) parcalar.push(`${yil} yıl`);
  if (ay > 0) parcalar.push(`${ay} ay`);
  if (gun > 0) parcalar.push(`${gun} gün`);
  return parcalar.join(' ') || '0 gün';
}

// ---------------------------------------------------------------------------
// Dönem hesaplama
// ---------------------------------------------------------------------------

function donemHesapla(donemler = [], excludeIndex = -1) {
  let toplamGun = 0;
  const donemDetay = donemler.map((donem, idx) => {
    if (!donem.giris || !donem.cikis) {
      return { idx, gun: 0, dahil: false, eksik: true };
    }
    const giris = toDate(donem.giris);
    const cikis = toDate(donem.cikis);
    const gun = Math.max(0, gunFarki(giris, cikis));
    const dahil = idx !== excludeIndex;
    if (dahil) toplamGun += gun;
    return {
      idx,
      girisFormat: tarihFormat(giris),
      cikisFormat: tarihFormat(cikis),
      gun,
      gunYMG: gunYMGFormat(gun),
      dahil,
      eksik: false
    };
  });
  return { toplamGun, toplamYMG: gunYMGFormat(toplamGun), donemDetay };
}

// ---------------------------------------------------------------------------
// Ana infaz hesaplama
// ---------------------------------------------------------------------------

function infazHesapla(params) {
  const {
    kategoriId,
    cezaYil = 0,
    cezaAy = 0,
    cezaGun = 0,
    ilkGirisTarihi,
    mahsupYil = 0,
    mahsupAy = 0,
    mahsupGun: mahsupGunParam = 0
  } = params;

  const kategori = KATEGORILER[kategoriId];
  if (!kategori) throw new Error('Geçersiz kategori: ' + kategoriId);
  if (!ilkGirisTarihi) throw new Error('İlk giriş tarihi girilmedi.');

  const ilkGiris = toDate(ilkGirisTarihi);
  const mahsupToplamGun = cezayiGuneCevir(
    new Date(2000, 0, 1), mahsupYil, mahsupAy, mahsupGunParam
  );
  const efektifBaslangic = gunEkle(ilkGiris, -mahsupToplamGun);

  if (kategori.muzebbet) {
    return _muebbetHesapla(efektifBaslangic, kategori, mahsupToplamGun, ilkGiris);
  }

  const toplamCezaGun = cezayiGuneCevir(efektifBaslangic, cezaYil, cezaAy, cezaGun);
  if (toplamCezaGun <= 0) throw new Error('Ceza süresi 0 gün veya negatif olamaz.');

  const tahlieTarihi = cezaEkle(efektifBaslangic, cezaYil, cezaAy, cezaGun);
  const kapaliGun = Math.floor(toplamCezaGun * kategori.kapali_oran);
  const kapaliSon = gunEkle(efektifBaslangic, kapaliGun);
  const ksGun = Math.floor(toplamCezaGun * kategori.ks_oran);
  const ksTarihi = gunEkle(efektifBaslangic, ksGun);
  const acikBaslangic = kapaliSon;
  const acikGun = Math.max(0, gunFarki(acikBaslangic, ksTarihi));

  let dsTarihi = null;
  let dsAciklama = '';
  if (kategori.ds_eligible && kategori.ds_gun > 0) {
    const adayTarih = gunEkle(ksTarihi, -kategori.ds_gun);
    if (adayTarih >= kapaliSon) {
      dsTarihi = adayTarih;
    } else {
      dsTarihi = acikBaslangic;
      dsAciklama = '(Açık ceza süresi kısa – DS tarihi açığa geçiş tarihiyle örtüşüyor)';
    }
  }

  return {
    kategori: kategori.label,
    efektifBaslangic: tarihFormat(efektifBaslangic),
    mahsupToplamGun,
    mahsupYMG: gunYMGFormat(mahsupToplamGun),
    toplamCezaGun,
    toplamCezaYMG: gunYMGFormat(toplamCezaGun),
    tahlieTarihi: tarihFormat(tahlieTarihi),
    kapaliGun,
    kapaliYMG: gunYMGFormat(kapaliGun),
    kapaliSon: tarihFormat(kapaliSon),
    kapaliOran: Math.round(kategori.kapali_oran * 100) + '%',
    acikBaslangic: tarihFormat(acikBaslangic),
    acikGun,
    acikYMG: gunYMGFormat(acikGun),
    ksGun,
    ksYMG: gunYMGFormat(ksGun),
    ksTarihi: tarihFormat(ksTarihi),
    ksOran: Math.round(kategori.ks_oran * 100) + '%',
    dsEligible: kategori.ds_eligible,
    dsTarihi: dsTarihi ? tarihFormat(dsTarihi) : null,
    dsAciklama,
    muzebbet: false
  };
}

function _muebbetHesapla(efektifBaslangic, kategori, mahsupToplamGun, ilkGiris) {
  const kapaliSon = gunEkle(efektifBaslangic, kategori.kapali_gun);
  const ksTarihi = gunEkle(efektifBaslangic, kategori.ks_gun);
  const acikGun = kategori.acik_gun;

  let dsTarihi = null;
  if (kategori.ds_eligible && kategori.ds_gun > 0) {
    const aday = gunEkle(ksTarihi, -kategori.ds_gun);
    dsTarihi = aday >= kapaliSon ? aday : kapaliSon;
  }

  return {
    kategori: kategori.label,
    efektifBaslangic: tarihFormat(efektifBaslangic),
    mahsupToplamGun,
    mahsupYMG: gunYMGFormat(mahsupToplamGun),
    toplamCezaGun: null,
    toplamCezaYMG: kategori.label,
    tahlieTarihi: null,
    kapaliGun: kategori.kapali_gun,
    kapaliYMG: gunYMGFormat(kategori.kapali_gun),
    kapaliSon: tarihFormat(kapaliSon),
    kapaliOran: '—',
    acikBaslangic: tarihFormat(kapaliSon),
    acikGun,
    acikYMG: gunYMGFormat(acikGun),
    ksGun: kategori.ks_gun,
    ksYMG: gunYMGFormat(kategori.ks_gun),
    ksTarihi: tarihFormat(ksTarihi),
    ksOran: '—',
    dsEligible: kategori.ds_eligible,
    dsTarihi: dsTarihi ? tarihFormat(dsTarihi) : null,
    dsAciklama: '',
    muzebbet: true
  };
}

// ---------------------------------------------------------------------------
// Lehe yasa karşılaştırması (765 TCK ↔ 5237 TCK)
// ---------------------------------------------------------------------------

function leheKarsilastirma(params) {
  const {
    ilkGirisTarihi,
    mahsupYil = 0,
    mahsupAy = 0,
    mahsupGun: mahsupGunParam = 0,
    yasa5237Yil = 0,
    yasa5237Ay = 0,
    yasa5237Gun = 0,
    yasa5237Kategori = 'GENEL',
    yasa765Yil = 0,
    yasa765Ay = 0,
    yasa765Gun = 0,
    yasa765KsOran = 2 / 3,
    yasa765KapaliOran = 1 / 2
  } = params;

  if (!ilkGirisTarihi) throw new Error('İlk giriş tarihi girilmedi.');

  const ilkGiris = toDate(ilkGirisTarihi);
  const mahsupToplamGun = cezayiGuneCevir(
    new Date(2000, 0, 1), mahsupYil, mahsupAy, mahsupGunParam
  );
  const efektifBaslangic = gunEkle(ilkGiris, -mahsupToplamGun);

  const kat5237 = KATEGORILER[yasa5237Kategori] || KATEGORILER.GENEL;
  const gun5237 = cezayiGuneCevir(efektifBaslangic, yasa5237Yil, yasa5237Ay, yasa5237Gun);
  const ks5237Gun = Math.floor(gun5237 * kat5237.ks_oran);
  const ks5237Tarihi = gunEkle(efektifBaslangic, ks5237Gun);
  const kapali5237Gun = Math.floor(gun5237 * kat5237.kapali_oran);
  const kapali5237Son = gunEkle(efektifBaslangic, kapali5237Gun);
  let ds5237 = null;
  if (kat5237.ds_eligible && kat5237.ds_gun > 0) {
    const a = gunEkle(ks5237Tarihi, -kat5237.ds_gun);
    ds5237 = a >= kapali5237Son ? a : kapali5237Son;
  }

  const gun765 = cezayiGuneCevir(efektifBaslangic, yasa765Yil, yasa765Ay, yasa765Gun);
  const ks765Gun = Math.floor(gun765 * yasa765KsOran);
  const ks765Tarihi = gunEkle(efektifBaslangic, ks765Gun);
  const kapali765Gun = Math.floor(gun765 * yasa765KapaliOran);
  const kapali765Son = gunEkle(efektifBaslangic, kapali765Gun);
  let ds765 = null;
  if (kat5237.ds_eligible && kat5237.ds_gun > 0) {
    const a = gunEkle(ks765Tarihi, -365);
    ds765 = a >= kapali765Son ? a : kapali765Son;
  }

  let leheYasa = '';
  if (ks5237Gun < ks765Gun) leheYasa = '5237 TCK daha lehe (daha erken koşullu salıverme)';
  else if (ks765Gun < ks5237Gun) leheYasa = '765 TCK daha lehe (daha erken koşullu salıverme)';
  else leheYasa = 'Her iki yasa için koşullu salıverme tarihi aynı';

  return {
    leheYasa,
    tck5237: {
      ceza: `${yasa5237Yil} yıl ${yasa5237Ay} ay ${yasa5237Gun} gün`,
      toplamGun: gun5237,
      toplamYMG: gunYMGFormat(gun5237),
      kapaliGun: kapali5237Gun,
      kapaliYMG: gunYMGFormat(kapali5237Gun),
      kapaliSon: tarihFormat(kapali5237Son),
      ksGun: ks5237Gun,
      ksYMG: gunYMGFormat(ks5237Gun),
      ksTarihi: tarihFormat(ks5237Tarihi),
      dsTarihi: ds5237 ? tarihFormat(ds5237) : null
    },
    tck765: {
      ceza: `${yasa765Yil} yıl ${yasa765Ay} ay ${yasa765Gun} gün`,
      toplamGun: gun765,
      toplamYMG: gunYMGFormat(gun765),
      kapaliGun: kapali765Gun,
      kapaliYMG: gunYMGFormat(kapali765Gun),
      kapaliSon: tarihFormat(kapali765Son),
      ksGun: ks765Gun,
      ksYMG: gunYMGFormat(ks765Gun),
      ksTarihi: tarihFormat(ks765Tarihi),
      dsTarihi: ds765 ? tarihFormat(ds765) : null
    }
  };
}

// ---------------------------------------------------------------------------
// Suç Tarihi Dönem Sabitleri
// ---------------------------------------------------------------------------

const DONEM_SINIRLAR = {
  SINIR_1: new Date('2020-03-30'),
  SINIR_2: new Date('2023-07-31'),
  SINIR_3: new Date('2024-06-01'),
  SINIR_4: new Date('2025-06-04')
};

const DONEM_ETIKETLER = {
  1: '30.03.2020 Öncesi',
  2: '30.03.2020 – 31.07.2023 Arası',
  3: '31.07.2023 – 01.06.2024 Arası',
  4: '01.06.2024 – 04.06.2025 Arası',
  5: '04.06.2025 Sonrası'
};

const ISTISNA_SUCLAR_ORANLARI = {
  NORMAL:          1 / 2,
  KAST_OLDURME:    3 / 4,
  DEPREM_OLUM:     3 / 4,
  CINSEL:          3 / 4,
  TEROR:           3 / 4,
  DEVLET_GUVENLIK: 3 / 4,
  ORGUT:           2 / 3
};

const SINIR_6545 = new Date('2014-06-28');

function sucTarihiDonemBelirle(sucTarihi) {
  const d = toDate(sucTarihi);
  const { SINIR_1, SINIR_2, SINIR_3, SINIR_4 } = DONEM_SINIRLAR;
  if (d < SINIR_1) return 1;
  if (d < SINIR_2) return 2;
  if (d < SINIR_3) return 3;
  if (d < SINIR_4) return 4;
  return 5;
}

function ksOraniHesapla(donemNo, istisnaSuc, sucTarihi, isMukerrer) {
  if (isMukerrer && donemNo === 4) return 3 / 4;
  const tur = istisnaSuc || 'NORMAL';
  if (tur === 'CINSEL_UYUSTURUCU') {
    return toDate(sucTarihi) < SINIR_6545 ? 2 / 3 : 3 / 4;
  }
  return Object.prototype.hasOwnProperty.call(ISTISNA_SUCLAR_ORANLARI, tur)
    ? ISTISNA_SUCLAR_ORANLARI[tur]
    : 1 / 2;
}

function dsVerileriniHesapla(donemNo, istisnaSuc, efektifBaslangic, ksGun, ksTarihi) {
  if (istisnaSuc === 'TEROR') {
    return {
      dsEligible: false,
      dsBaslangic: null,
      dsBitis: null,
      dsSuresiAciklama: 'Terör suçlarında denetimli serbestlik uygulanmaz.',
      erkenDsTarihi: null
    };
  }

  let dsBaslangic = null;
  let dsBitis = ksTarihi;
  let dsSuresiAciklama = '';
  let erkenDsTarihi = null;

  if (donemNo === 1) {
    dsBaslangic = yilEkle(ksTarihi, -6);
    dsSuresiAciklama = '6 yıl (3+3) – 5275 SK Geçici 6 ve Geçici 10/6 md.';
  } else if (donemNo === 2 || donemNo === 3) {
    dsBaslangic = yilEkle(ksTarihi, -4);
    dsSuresiAciklama = '4 yıl (1+3) – 5275 SK 105/A ve Geçici 10/6 md.';
  } else {
    const minGun = Math.ceil(ksGun / 10);
    dsBaslangic = gunEkle(efektifBaslangic, minGun);
    dsSuresiAciklama = 'KS süresinin en az 1/10\'u infaz kurumunda geçirildikten sonra (5275 SK 105/A)';
    erkenDsTarihi = yilEkle(ksTarihi, -3);
  }

  return { dsEligible: true, dsBaslangic, dsBitis, dsSuresiAciklama, erkenDsTarihi };
}

function erkenAcikTarihiHesapla(donemNo, ksTarihi) {
  if (donemNo <= 1) return null;
  const yil = donemNo <= 3 ? 3 : 5;
  return yilEkle(ksTarihi, -yil);
}

// ---------------------------------------------------------------------------
// Suç Tarihine Göre Ana İnfaz Hesaplama
// ---------------------------------------------------------------------------

function yeniInfazHesapla(params) {
  const {
    sucTarihi,
    cezaYil = 0,
    cezaAy  = 0,
    cezaGun = 0,
    cezaeviGirisTarihi,
    cezaeviCikisTarihi  = null,
    tutuklulukBaslangic = null,
    tutuklulukBitis     = null,
    istisnaSuc          = 'NORMAL',
    isMukerrer          = false
  } = params;

  if (!sucTarihi)            throw new Error('Suç tarihi girilmedi.');
  if (!cezaeviGirisTarihi)   throw new Error('Cezaevine giriş tarihi girilmedi.');
  if (cezaYil === 0 && cezaAy === 0 && cezaGun === 0) {
    throw new Error('Hüküm süresi girilmedi (en az 1 gün).');
  }

  const girisObj = toDate(cezaeviGirisTarihi);
  const donemNo    = sucTarihiDonemBelirle(sucTarihi);
  const donemLabel = DONEM_ETIKETLER[donemNo];

  let mahsupGunSayisi = 0;
  if (tutuklulukBaslangic && tutuklulukBitis) {
    mahsupGunSayisi = Math.max(0, gunFarki(tutuklulukBaslangic, tutuklulukBitis));
  }

  const efektifBaslangic = gunEkle(girisObj, -mahsupGunSayisi);
  const toplamCezaGun = cezayiGuneCevir(efektifBaslangic, cezaYil, cezaAy, cezaGun);
  if (toplamCezaGun <= 0) throw new Error('Ceza süresi hesaplanamadı.');

  const tahlieTarihi = cezaEkle(efektifBaslangic, cezaYil, cezaAy, cezaGun);
  const ksOran = ksOraniHesapla(donemNo, istisnaSuc, sucTarihi, isMukerrer);
  const ksGun  = Math.floor(toplamCezaGun * ksOran);
  const ksTarihi = gunEkle(efektifBaslangic, ksGun);
  const ds = dsVerileriniHesapla(donemNo, istisnaSuc, efektifBaslangic, ksGun, ksTarihi);
  const erkenAcikTarihi = erkenAcikTarihiHesapla(donemNo, ksTarihi);

  let cezaeviGercekSure = null;
  if (cezaeviCikisTarihi) {
    const cikisSuresiGun  = Math.max(0, gunFarki(girisObj, cezaeviCikisTarihi));
    const efektifSureGun  = Math.max(0, cikisSuresiGun - mahsupGunSayisi);
    cezaeviGercekSure = {
      toplamGun:   cikisSuresiGun,
      toplamYMG:   gunYMGFormat(cikisSuresiGun),
      efektifGun:  efektifSureGun,
      efektifYMG:  gunYMGFormat(efektifSureGun)
    };
  }

  let donemNot = '';
  if (donemNo === 5) {
    donemNot = '7571 SK ile 25.12.2025 tarihinden itibaren "infaza başlanmış olma" şartı kaldırılmıştır.';
  } else if (donemNo === 3) {
    donemNot = 'Geçici 10/6 kapsamında cezanın 31.07.2023 tarihinden önce kesinleşmiş olması gerekir (7571 SK ile 25.12.2025\'den itibaren bu şart kalktı).';
  }

  return {
    donemNo,
    donemLabel,
    donemNot,
    sucTarihi: tarihFormat(sucTarihi),
    mahsupGunSayisi,
    mahsupYMG: gunYMGFormat(mahsupGunSayisi),
    cezaeviGirisTarihi: tarihFormat(girisObj),
    efektifBaslangic:   tarihFormat(efektifBaslangic),
    toplamCezaGun,
    toplamCezaYMG: gunYMGFormat(toplamCezaGun),
    tahlieTarihi:  tarihFormat(tahlieTarihi),
    ksOran:   Math.round(ksOran * 100) + '%',
    ksOranKesir: ksOran === 1 / 2 ? '1/2'
               : ksOran === 2 / 3 ? '2/3'
               : ksOran === 3 / 4 ? '3/4'
               : String(ksOran),
    ksGun,
    ksYMG:    gunYMGFormat(ksGun),
    ksTarihi: tarihFormat(ksTarihi),
    dsEligible:         ds.dsEligible,
    dsBaslangic:        ds.dsBaslangic    ? tarihFormat(ds.dsBaslangic)    : null,
    dsBitis:            ds.dsBitis        ? tarihFormat(ds.dsBitis)        : null,
    dsSuresiAciklama:   ds.dsSuresiAciklama,
    erkenDsTarihi:      ds.erkenDsTarihi  ? tarihFormat(ds.erkenDsTarihi)  : null,
    erkenAcikTarihi: erkenAcikTarihi ? tarihFormat(erkenAcikTarihi) : null,
    cezaeviGercekSure,
    muzebbet: false
  };
}

// ---------------------------------------------------------------------------
// PWA Global API (window.infazAPI)
// ---------------------------------------------------------------------------

window.infazAPI = {
  hesapla: async (params) => {
    try {
      const sonuc = infazHesapla(params);
      return { success: true, data: sonuc };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  donemHesapla: async (params) => {
    try {
      const sonuc = donemHesapla(params.donemler, params.excludeIndex);
      return { success: true, data: sonuc };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  leheKarsilastir: async (params) => {
    try {
      const sonuc = leheKarsilastirma(params);
      return { success: true, data: sonuc };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
  
  yeniHesapla: async (params) => {
    try {
      const sonuc = yeniInfazHesapla(params);
      return { success: true, data: sonuc };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
