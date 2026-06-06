'use strict';

/**
 * İnfaz Hesaplama Motoru
 * 5275 Sayılı Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun
 *
 * Tarih hesabı: Resmi takvime göre – 1 yıl takvim yılı (artık yıllar dahil),
 * 1 ay gerçek ay uzunluğu (28-31 gün).
 */

// ---------------------------------------------------------------------------
// İnfaz Kategorileri ve dönemsel kural yardımcıları
// ---------------------------------------------------------------------------

const KATEGORILER = {
  GENEL: {
    id: 'GENEL',
    label: 'Genel suç',
    aciklama: 'İstisna suçlar dışındaki genel suçlar'
  },
  TEROR: {
    id: 'TEROR',
    label: 'Terör suçu',
    aciklama: '3713 sayılı Kanun kapsamı'
  },
  CINSEL_NITELIKLI: {
    id: 'CINSEL_NITELIKLI',
    label: 'Cinsel suç (nitelikli yetişkin)',
    aciklama: 'TCK 102/2, 103, 104/2-3'
  },
  CINSEL_BASIT: {
    id: 'CINSEL_BASIT',
    label: 'Cinsel suç (basit yetişkin)',
    aciklama: 'TCK 102/1, 104/1, 105'
  },
  CINSEL_COCUK: {
    id: 'CINSEL_COCUK',
    label: 'Cinsel suç (çocuk)',
    aciklama: 'Çocuk fail/çocuk rejimi için cinsel suçlar'
  },
  UYUSTURUCU_TICARETI: {
    id: 'UYUSTURUCU_TICARETI',
    label: 'Uyuşturucu ticareti',
    aciklama: 'TCK 188'
  },
  KASTEN_OLDURME: {
    id: 'KASTEN_OLDURME',
    label: 'Kasten öldürme',
    aciklama: 'TCK 81, 82, 83'
  },
  ISKENCE_EZIYET: {
    id: 'ISKENCE_EZIYET',
    label: 'İşkence ve eziyet',
    aciklama: 'TCK 94, 95, 96'
  },
  OZEL_2016_ONCESI: {
    id: 'OZEL_2016_ONCESI',
    label: 'Özel grup (83/94/95/96/87-2-d/MİT)',
    aciklama: '01.07.2016 öncesinde 1/2 + 2 yıl DS özel rejimi uygulanabilen grup'
  },
  ORGUT: {
    id: 'ORGUT',
    label: 'Örgüt suçu',
    aciklama: 'Suç işlemek amacıyla örgüt kurma/yönetme/örgüt faaliyeti'
  },
  MUKERRIR: {
    id: 'MUKERRIR',
    label: 'Mükerrir',
    aciklama: 'Mükerrirlere özgü oran rejimi'
  },
  AGIR: {
    id: 'AGIR',
    label: 'Ağır suç (eski uyumluluk)',
    aciklama: 'Eski sürüm uyumluluk kategorisi'
  },
  ORGUTSUZ_CINSEL: {
    id: 'ORGUTSUZ_CINSEL',
    label: 'Örgütsüz cinsel saldırı (eski uyumluluk)',
    aciklama: 'Eski sürüm uyumluluk kategorisi'
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

const TARIHLER = {
  KANUN_7242: '2020-03-30',
  KANUN_6545: '2014-06-28',
  OZEL_2016: '2016-07-01',
  KANUN_7550: '2025-06-04'
};

function tarihKarsilastir(sol, sag) {
  if (!sol || !sag) return false;
  return String(sol) >= String(sag);
}

function resolveInfazKurali({
  kategoriId,
  sucTarihi,
  cocukMu = false,
  mukerrirMi = false,
  ikinciKezMukerrirMi = false,
  gecici6Uygula = false
}) {
  const id = KATEGORILER[kategoriId] ? kategoriId : 'GENEL';
  const suc = sucTarihi || TARIHLER.KANUN_7242;
  const yeni7242 = tarihKarsilastir(suc, TARIHLER.KANUN_7242);
  const yeni6545 = tarihKarsilastir(suc, TARIHLER.KANUN_6545);
  const yeni7550 = tarihKarsilastir(suc, TARIHLER.KANUN_7550);
  const ozel2016Oncesi = !tarihKarsilastir(suc, TARIHLER.OZEL_2016);

  if (ikinciKezMukerrirMi) {
    return {
      kategori: 'İkinci kez mükerrir',
      aciklama: yeni7550
        ? '7550 sonrası ikinci kez mükerrir rejimi'
        : 'İkinci kez mükerrir (7550 öncesi geçiş yorumu)',
      kapali_oran: yeni7550 ? 3 / 4 : (yeni7242 ? 2 / 3 : 3 / 4),
      ks_oran: yeni7550 ? 3 / 4 : (yeni7242 ? 2 / 3 : 3 / 4),
      ds_gun: 365,
      ds_eligible: true,
      ruleNotu: yeni7550
        ? '7550 sonrası ikinci kez mükerrirde KS oranı 3/4 uygulanır.'
        : '7550 öncesi ikinci kez mükerrir için mükerrir genel oranı uygulanmıştır.',
      muzebbet: false
    };
  }

  if (mukerrirMi || id === 'MUKERRIR') {
    return {
      kategori: 'Mükerrir',
      aciklama: 'Mükerrirlerde eski 3/4, 7242 sonrası 2/3',
      kapali_oran: yeni7242 ? 2 / 3 : 3 / 4,
      ks_oran: yeni7242 ? 2 / 3 : 3 / 4,
      ds_gun: 365,
      ds_eligible: true,
      ruleNotu: yeni7242 ? '7242 sonrası mükerrir oranı 2/3.' : '7242 öncesi mükerrir oranı 3/4.',
      muzebbet: false
    };
  }

  if (id === 'MUZEBBET' || id === 'AGIR_MUZEBBET') return KATEGORILER[id];

  switch (id) {
    case 'TEROR':
      return cocukMu
        ? {
          kategori: 'Terör suçu (çocuk)',
          aciklama: 'Çocuklar için 2/3',
          kapali_oran: 2 / 3,
          ks_oran: 2 / 3,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'Terör suçlarında çocuk fail için 2/3.',
          muzebbet: false
        }
        : {
          kategori: 'Terör suçu',
          aciklama: 'Yetişkin için 3/4',
          kapali_oran: 3 / 4,
          ks_oran: 3 / 4,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'Terör suçlarında yetişkin için 3/4.',
          muzebbet: false
        };
    case 'CINSEL_NITELIKLI':
      if (cocukMu) {
        return {
          kategori: 'Cinsel suç (çocuk)',
          aciklama: 'Çocuk rejiminde cinsel suçlar 2/3',
          kapali_oran: 2 / 3,
          ks_oran: 2 / 3,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'Çocuklar için cinsel suçlarda 2/3.',
          muzebbet: false
        };
      }
      return {
        kategori: 'Cinsel suç (nitelikli yetişkin)',
        aciklama: '6545 öncesi 2/3, sonrası 3/4',
        kapali_oran: yeni6545 ? 3 / 4 : 2 / 3,
        ks_oran: yeni6545 ? 3 / 4 : 2 / 3,
        ds_gun: 365,
        ds_eligible: true,
        ruleNotu: yeni6545
          ? '28.06.2014 ve sonrası nitelikli cinsel suçta 3/4.'
          : '28.06.2014 öncesi nitelikli cinsel suçta 2/3.',
        muzebbet: false
      };
    case 'CINSEL_BASIT':
    case 'ORGUTSUZ_CINSEL':
      return cocukMu
        ? {
          kategori: 'Cinsel suç (çocuk)',
          aciklama: 'Çocuk rejiminde cinsel suçlar 2/3',
          kapali_oran: 2 / 3,
          ks_oran: 2 / 3,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'Çocuklar için cinsel suçlarda 2/3.',
          muzebbet: false
        }
        : {
          kategori: 'Cinsel suç (basit yetişkin)',
          aciklama: 'Basit cinsel suçlarda 2/3',
          kapali_oran: 2 / 3,
          ks_oran: 2 / 3,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'TCK 102/1, 104/1, 105 için 2/3.',
          muzebbet: false
        };
    case 'CINSEL_COCUK':
      return {
        kategori: 'Cinsel suç (çocuk)',
        aciklama: 'Çocuk rejiminde cinsel suçlar 2/3',
        kapali_oran: 2 / 3,
        ks_oran: 2 / 3,
        ds_gun: 365,
        ds_eligible: true,
        ruleNotu: 'Çocuk fail için cinsel suçlarda 2/3.',
        muzebbet: false
      };
    case 'UYUSTURUCU_TICARETI':
    case 'AGIR':
      if (cocukMu) {
        return {
          kategori: 'Uyuşturucu ticareti (çocuk)',
          aciklama: 'Çocuk rejiminde uyuşturucu ticareti 2/3',
          kapali_oran: 2 / 3,
          ks_oran: 2 / 3,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'Çocuk fail için uyuşturucu ticareti 2/3.',
          muzebbet: false
        };
      }
      return {
        kategori: 'Uyuşturucu ticareti',
        aciklama: '6545 öncesi 2/3, sonrası 3/4',
        kapali_oran: yeni6545 ? 3 / 4 : 2 / 3,
        ks_oran: yeni6545 ? 3 / 4 : 2 / 3,
        ds_gun: 365,
        ds_eligible: true,
        ruleNotu: yeni6545
          ? '28.06.2014 ve sonrası uyuşturucu ticaretinde 3/4.'
          : '28.06.2014 öncesi uyuşturucu ticaretinde 2/3.',
        muzebbet: false
      };
    case 'KASTEN_OLDURME':
      return {
        kategori: 'Kasten öldürme',
        aciklama: 'Kasten öldürmede 2/3',
        kapali_oran: 2 / 3,
        ks_oran: 2 / 3,
        ds_gun: 365,
        ds_eligible: true,
        ruleNotu: 'Kasten öldürme suçlarında 2/3.',
        muzebbet: false
      };
    case 'ISKENCE_EZIYET':
    case 'OZEL_2016_ONCESI':
      if (ozel2016Oncesi) {
        return {
          kategori: 'Özel grup (01.07.2016 öncesi)',
          aciklama: 'TCK 83/94/95/96/87-2-d ve MİT için 1/2 + 2 yıl DS',
          kapali_oran: 1 / 2,
          ks_oran: 1 / 2,
          ds_gun: 730,
          ds_eligible: true,
          ruleNotu: '01.07.2016 öncesi özel grupta 1/2 ve 2 yıl DS.',
          muzebbet: false
        };
      }
      return {
        kategori: id === 'ISKENCE_EZIYET' ? 'İşkence ve eziyet' : 'Özel grup',
        aciklama: '01.07.2016 ve sonrası 2/3',
        kapali_oran: 2 / 3,
        ks_oran: 2 / 3,
        ds_gun: 365,
        ds_eligible: true,
        ruleNotu: '01.07.2016 ve sonrası 2/3.',
        muzebbet: false
      };
    case 'ORGUT':
      if (cocukMu) {
        return {
          kategori: 'Örgüt suçu (çocuk)',
          aciklama: 'Çocuklarda 2/3',
          kapali_oran: 2 / 3,
          ks_oran: 2 / 3,
          ds_gun: 365,
          ds_eligible: true,
          ruleNotu: 'Çocuklarda örgüt suçunda 2/3.',
          muzebbet: false
        };
      }
      return {
        kategori: 'Örgüt suçu',
        aciklama: 'Yetişkinde eski 3/4, 7242 sonrası 2/3',
        kapali_oran: yeni7242 ? 2 / 3 : 3 / 4,
        ks_oran: yeni7242 ? 2 / 3 : 3 / 4,
        ds_gun: 365,
        ds_eligible: true,
        ruleNotu: yeni7242 ? '7242 sonrası örgüt suçunda 2/3.' : '7242 öncesi örgüt suçunda 3/4.',
        muzebbet: false
      };
    case 'GENEL':
    default:
      return {
        kategori: 'Genel suç',
        aciklama: 'İstisna suçlar dışındaki genel rejim',
        kapali_oran: 1 / 2,
        ks_oran: yeni7242 ? 1 / 2 : 2 / 3,
        ds_gun: gecici6Uygula ? 3 * 365 : 365,
        ds_eligible: true,
        ruleNotu: gecici6Uygula
          ? 'Genel suçta DS 3 yıl (Geçici 6 işaretli).'
          : (yeni7242 ? '7242 sonrası genel suçta 1/2.' : '7242 öncesi genel suçta 2/3.'),
        muzebbet: false
      };
  }
}

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
    sucTarihi,
    cocukMu = false,
    mukerrirMi = false,
    ikinciKezMukerrirMi = false,
    gecici6Uygula = false,
    mahsupYil = 0,
    mahsupAy = 0,
    mahsupGun: mahsupGunParam = 0
  } = params;

  const kategori = resolveInfazKurali({
    kategoriId,
    sucTarihi,
    cocukMu,
    mukerrirMi,
    ikinciKezMukerrirMi,
    gecici6Uygula
  });
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
    kategori: kategori.kategori || kategori.label,
    kuralAciklama: kategori.ruleNotu || '',
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
  const kat5237 = resolveInfazKurali({
    kategoriId: yasa5237Kategori,
    sucTarihi: ilkGirisTarihi,
    cocukMu: false,
    mukerrirMi: false,
    ikinciKezMukerrirMi: false
  });
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
// Adli para cezası / tekerrür analizi
// ---------------------------------------------------------------------------

function adliParaTekerrurAnalizi(params = {}) {
  const {
    kararTarihi,
    sucTarihi,
    cezaTuru = 'DOGRUDAN',
    toplamAdliPara = 0,
    eski765Lehe6474 = false,
    ikinciSucTarihi,
    oncekiHukmunKesinlesmeTarihi
  } = params;

  if (!kararTarihi) throw new Error('Karar tarihi zorunludur.');

  const karar = String(kararTarihi);
  const para = Math.max(0, Number(toplamAdliPara) || 0);
  const esik = tarihKarsilastir(karar, '2024-06-01') ? 15000 : 3000;
  const kesin = para <= esik;

  let donem = '';
  if (karar < '2005-06-01') donem = '01.06.2005 öncesi';
  else if (karar <= '2010-10-06') donem = '01.06.2005 - 06.10.2010';
  else if (karar <= '2011-04-13') donem = '07.10.2010 - 13.04.2011';
  else donem = '13.04.2011 sonrası';

  const kanunYolu = kesin
    ? 'Kesin: istinaf/temyiz yolu kapalı kabul edilmiştir.'
    : 'Kesin değil: istinafa veya temyize tabi kabul edilmiştir.';

  let tekerrurEsas = 'Tekerrüre esas olmaz';
  const aciklamaParcalari = [
    `Karar tarihi dönemi: ${donem}.`,
    `Kesinlik eşiği bu karar tarihinde ${esik.toLocaleString('tr-TR')} TL olarak uygulanmıştır.`
  ];

  if (!kesin) {
    tekerrurEsas = 'Önce kararın kesinleşmesi gerekir';
  } else if (eski765Lehe6474 && karar < '2005-06-01') {
    tekerrurEsas = 'Özel istisna nedeniyle tekerrüre esas olmaz';
    aciklamaParcalari.push('765/647-4 lehe istisna işaretlendiği için tekerrür uygulanmamıştır.');
  } else if (tarihKarsilastir(karar, '2020-04-15') && cezaTuru === 'DOGRUDAN') {
    tekerrurEsas = 'Tekerrüre esas olmaz';
    aciklamaParcalari.push('15.04.2020 sonrası doğrudan adli para cezaları için tekerrüre esas olmama kuralı uygulandı.');
  } else {
    tekerrurEsas = 'Tekerrüre esas olur';
  }

  if (ikinciSucTarihi && oncekiHukmunKesinlesmeTarihi && String(ikinciSucTarihi) <= String(oncekiHukmunKesinlesmeTarihi)) {
    tekerrurEsas = 'Tekerrüre esas olmaz';
    aciklamaParcalari.push('İkinci suç tarihi, önceki hükmün kesinleşmesinden sonra değil.');
  }

  const uyarlama = (eski765Lehe6474 && karar < '2005-06-01')
    ? 'Uyarlama gerekir (özel 765/647-4 istisnası).'
    : 'Uyarlama gerekmez (değerlendirme karar tarihine göre yapılır).';

  if (!tarihKarsilastir(karar, '2024-06-01') && para > 3000 && para <= 15000) {
    aciklamaParcalari.push('01.06.2024 sonrası eşik artışı geçmiş kararlar için kural olarak uyarlama gerektirmez.');
  }

  return {
    kararTarihi,
    sucTarihi: sucTarihi || '—',
    cezaTuru,
    toplamAdliPara: para,
    kesinDurumu: kesin ? 'Kesin' : 'Kesin değil',
    kanunYolu,
    tekerrurEsas,
    uyarlama,
    aciklama: aciklamaParcalari.join(' ')
  };
}

// ---------------------------------------------------------------------------
// Dışa aktarım
// ---------------------------------------------------------------------------

module.exports = {
  KATEGORILER,
  resolveInfazKurali,
  infazHesapla,
  donemHesapla,
  leheKarsilastirma,
  adliParaTekerrurAnalizi,
  tarihFormat,
  gunYMGFormat,
  gunFarki,
  gunEkle,
  cezaEkle,
  cezayiGuneCevir
};
