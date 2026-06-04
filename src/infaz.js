'use strict';

/**
 * İnfaz Hesaplama Motoru
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
    ds_gun: 365,   // Koşullu salıverme tarihinden 1 yıl önce DS
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

/**
 * Tarih nesnesini güvenli biçimde döndürür.
 */
function toDate(d) {
  if (d instanceof Date) return new Date(d);
  return new Date(d);
}

/**
 * Ay-sonu taşmasını düzelterek ay ekler.
 * Örn: Ocak 31 + 1 ay → Şubat 28/29 (Mart 2/3 değil).
 */
function ayEkle(tarih, ay) {
  const d = toDate(tarih);
  const gunOriginal = d.getDate();
  d.setDate(1);               // Önce 1'e çek (taşma önleme)
  d.setMonth(d.getMonth() + ay);
  // Hedef ayın son gününü bul
  const sonGun = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(gunOriginal, sonGun));
  return d;
}

/**
 * Yıl-sonu taşmasını düzelterek yıl ekler (29 Şubat → 28 Şubat).
 */
function yilEkle(tarih, yil) {
  const d = toDate(tarih);
  const gun = d.getDate();
  const ay = d.getMonth();
  d.setFullYear(d.getFullYear() + yil);
  // Taşma kontrolü (örn. 29 Şubat → 28 Şubat)
  if (d.getMonth() !== ay) {
    d.setDate(0);
  } else {
    d.setDate(gun);
  }
  return d;
}

/**
 * Bir tarihe gün ekler.
 */
function gunEkle(tarih, gun) {
  const d = toDate(tarih);
  d.setDate(d.getDate() + gun);
  return d;
}

/**
 * Ceza süresini (yıl + ay + gün) bir tarihe resmi takvime göre ekler.
 * Önce yıl, sonra ay, sonra gün eklenir.
 */
function cezaEkle(tarih, yil, ay, gun) {
  let d = toDate(tarih);
  if (yil > 0) d = yilEkle(d, yil);
  if (ay > 0) d = ayEkle(d, ay);
  if (gun > 0) d = gunEkle(d, gun);
  return d;
}

/**
 * İki tarih arasındaki TAM gün sayısını döndürür.
 */
function gunFarki(tarih1, tarih2) {
  const t1 = toDate(tarih1);
  const t2 = toDate(tarih2);
  // Saat farkını yok saymak için UTC tabanlı hesap
  const ms = Date.UTC(t2.getFullYear(), t2.getMonth(), t2.getDate()) -
             Date.UTC(t1.getFullYear(), t1.getMonth(), t1.getDate());
  return Math.round(ms / 86400000);
}

/**
 * Ceza süresini başlangıç tarihinden itibaren resmi takvime göre güne çevirir.
 */
function cezayiGuneCevir(baslangic, yil, ay, gun) {
  const bitis = cezaEkle(baslangic, yil, ay, gun);
  return gunFarki(baslangic, bitis);
}

// ---------------------------------------------------------------------------
// Biçimlendirme yardımcıları
// ---------------------------------------------------------------------------

/**
 * Tarihi DD.MM.YYYY biçiminde döndürür.
 */
function tarihFormat(tarih) {
  if (!tarih) return '—';
  const d = toDate(tarih);
  const g = String(d.getDate()).padStart(2, '0');
  const a = String(d.getMonth() + 1).padStart(2, '0');
  return `${g}.${a}.${d.getFullYear()}`;
}

/**
 * Gün sayısını "X yıl Y ay Z gün" biçimine çevirir (yaklaşık gösterim).
 */
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

/**
 * Giriş/çıkış dönemlerinden toplam cezaevinde geçirilen süreyi hesaplar.
 * @param {Array<{giris: string, cikis: string}>} donemler
 * @param {number} excludeIndex  – Bu indeksteki dönemi hesaba katma (-1 = hepsini say)
 * @returns {{ toplamGun: number, donemDetay: Array }}
 */
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

/**
 * Ana infaz hesaplama fonksiyonu.
 *
 * @param {object} params
 * @param {string}  params.kategoriId       – KATEGORILER anahtarı
 * @param {number}  params.cezaYil          – Yıl (müebbet için yok sayılır)
 * @param {number}  params.cezaAy           – Ay
 * @param {number}  params.cezaGun          – Gün
 * @param {string}  params.ilkGirisTarihi   – Cezaevine ilk giriş (YYYY-MM-DD)
 * @param {number}  [params.mahsupYil]      – Mahsup yıl
 * @param {number}  [params.mahsupAy]       – Mahsup ay
 * @param {number}  [params.mahsupGun]      – Mahsup gün
 * @returns {object} Hesaplama sonuçları
 */
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

  // Mahsup toplam gün
  const mahsupToplamGun = cezayiGuneCevir(
    new Date(2000, 0, 1), mahsupYil, mahsupAy, mahsupGunParam
  );

  // Efektif infaz başlangıcı = ilk giriş – mahsup süresi
  const efektifBaslangic = gunEkle(ilkGiris, -mahsupToplamGun);

  // Müebbet ceza hesabı
  if (kategori.muzebbet) {
    return _muebbetHesapla(efektifBaslangic, kategori, mahsupToplamGun, ilkGiris);
  }

  // Süreli ceza hesabı
  const toplamCezaGun = cezayiGuneCevir(efektifBaslangic, cezaYil, cezaAy, cezaGun);
  if (toplamCezaGun <= 0) throw new Error('Ceza süresi 0 gün veya negatif olamaz.');

  // Tam tahliye tarihi
  const tahlieTarihi = cezaEkle(efektifBaslangic, cezaYil, cezaAy, cezaGun);

  // Kapalı ceza süresi (gün)
  const kapaliGun = Math.floor(toplamCezaGun * kategori.kapali_oran);
  const kapaliSon = gunEkle(efektifBaslangic, kapaliGun);

  // Koşullu salıverme
  const ksGun = Math.floor(toplamCezaGun * kategori.ks_oran);
  const ksTarihi = gunEkle(efektifBaslangic, ksGun);

  // Açık ceza dönemi
  const acikBaslangic = kapaliSon;
  const acikGun = Math.max(0, gunFarki(acikBaslangic, ksTarihi));

  // Denetimli serbestlik
  let dsTarihi = null;
  let dsAciklama = '';
  if (kategori.ds_eligible && kategori.ds_gun > 0) {
    const adayTarih = gunEkle(ksTarihi, -kategori.ds_gun);
    if (adayTarih >= kapaliSon) {
      dsTarihi = adayTarih;
    } else {
      // Açık ceza süresi DS süresinden kısa: DS tarihi = açığa geçiş tarihi
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

/**
 * Müebbet ceza hesabı (iç fonksiyon).
 */
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

/**
 * İki farklı ceza ve oran seti için KS ve DS tarihlerini karşılaştırır.
 *
 * @param {object} params
 * @param {string}  params.ilkGirisTarihi
 * @param {number}  params.mahsupYil
 * @param {number}  params.mahsupAy
 * @param {number}  params.mahsupGun
 * @param {number}  params.yasa5237Yil   – 5237 TCK ile verilen ceza
 * @param {number}  params.yasa5237Ay
 * @param {number}  params.yasa5237Gun
 * @param {string}  params.yasa5237Kategori  – KATEGORILER anahtarı
 * @param {number}  params.yasa765Yil    – 765 TCK ile verilen ceza
 * @param {number}  params.yasa765Ay
 * @param {number}  params.yasa765Gun
 * @param {number}  params.yasa765KsOran  – 765 TCK KS oranı (varsayılan 2/3)
 * @param {number}  params.yasa765KapaliOran – 765 TCK kapalı oran (varsayılan 1/2)
 */
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

  // 5237 TCK hesabı
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

  // 765 TCK hesabı
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

  // Lehe yasa tespiti: en erken KS → daha lehe
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
// Dışa aktarım
// ---------------------------------------------------------------------------

module.exports = {
  KATEGORILER,
  infazHesapla,
  donemHesapla,
  leheKarsilastirma,
  tarihFormat,
  gunYMGFormat,
  gunFarki,
  gunEkle,
  cezaEkle,
  cezayiGuneCevir
};
