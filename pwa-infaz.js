/**
 * İnfaz Hesaplama Motoru (v2.0)
 * 5275 sayılı Ceza ve Güvenlik Tedbirlerinin İnfazı Hakkında Kanun
 *
 * Temel ilke: Koşullu salıverilme ve denetimli serbestlik hükümleri SUÇ
 * TARİHİNE göre belirlenir. Sonradan yürürlüğe giren LEHE düzenlemeler
 * (7242, 7571 vb.) geçmişe uygulanır; ALEYHE düzenlemeler (6545, 7550
 * m.105/A 1/10 şartı, 7550 m.108/3 ikinci tekerrür, 7593 m.107/5) yalnızca
 * yürürlük tarihinden sonra işlenen suçlara uygulanır.
 *
 * Kaynak tablo: Osman Atalay (Yargıtay 1. CD Üyesi) infaz şemaları ve
 * 5275 s.K. m.105/A, 107, 108, Geçici 6, Geçici 9, Geçici 10/6, Geçici 11;
 * Açık Ceza İnfaz Kurumlarına Ayrılma Yönetmeliği m.6.
 *
 * ES5 ile yazılmıştır (eski iOS Safari uyumu). Hem tarayıcıda
 * (window.infazAPI) hem Node/Electron'da (module.exports) çalışır.
 */
(function (kok) {
  'use strict';

  // -------------------------------------------------------------------------
  // Tarih eşikleri (suç tarihi)
  // -------------------------------------------------------------------------
  function T(y, m, d) { return new Date(y, m - 1, d); }

  var ESIK = {
    TCK5237: T(2005, 6, 1),       // 5237 TCK / 5275 s.K. yürürlüğü
    K6545: T(2014, 6, 28),        // 6545 s.K.: cinsel nitelikli + 188 → 3/4
    K6713: T(2016, 7, 1),         // 83, 87/2-d, 94-96, MİT → 2/3 (öncesi 1/2)
    K7242: T(2020, 3, 30),        // Geçici 6: 30.03.2020 ve öncesi
    G10_6: T(2023, 7, 31),        // Geçici 10/6 (7571): 31.07.2023 ve öncesi
    K7499: T(2024, 6, 1),         // 7499: kanun yolu süreleri / APC
    K7550: T(2025, 6, 4),         // 7550: 105/A 1/10 şartı, 108/3 3/4
    K7593: T(2026, 8, 18)         // 7593: 107/5 istisnaları
  };

  // -------------------------------------------------------------------------
  // Suç türleri
  //   ks      : yetişkin KS oranı (7242 sonrası 107/2)
  //   ksCocuk : suç tarihinde 18 yaşını doldurmamış hükümlü KS oranı
  //   k6545   : 28.06.2014 öncesi suçlarda oran 2/3 (Geçici 9/4)
  //   k6713   : 01.07.2016 öncesi suçlarda oran 1/2, DS 2 yıl
  //   dsOnce  : 30.03.2020 ve öncesi suçlarda DS süresi (yıl) – Geçici 6
  //   dsSonra : 30.03.2020 sonrası suçlarda DS süresi (yıl) – 105/A
  //   g10Haric: Geçici 10/6 (7571) kapsamı dışında
  //   m1075   : 7593 s.K. ile 107/5 (15 yaş: 1 gün = 2 gün) dışında
  //   acikSinir: Yönetmelik 6/2 – açığa ayrılmak için KS'ye kalan azami yıl
  //   orgut   : 107/4 (örgüt/terör) müebbet süreleri uygulanır
  // -------------------------------------------------------------------------
  var Y = 1 / 2, U = 2 / 3, D = 3 / 4;

  var SUC_TURLERI = {
    GENEL: {
      label: 'Diğer suçlar (genel)', madde: '5275 m.107/2',
      ks: Y, ksCocuk: Y, dsOnce: 3, dsSonra: 1
    },
    NITELIKLI_HIRSIZLIK_YAGMA: {
      label: 'Nitelikli hırsızlık / yağma (TCK 142, 148, 149)', madde: '5275 m.107/2; Yön. 6/2-a',
      ks: Y, ksCocuk: Y, dsOnce: 3, dsSonra: 1, acikSinir: 5
    },
    KASTEN_YARALAMA: {
      label: 'Kasten yaralama (TCK 86, 87 – 87/2-d hariç)', madde: '5275 m.107/2',
      ks: Y, ksCocuk: Y, dsOnce: 3, dsSonra: 1, yaralama863: true
    },
    DEPREM_OLDURME: {
      label: 'Deprem nedeniyle yapı yıkılması sonucu öldürme (TCK 85)', madde: '5275 m.107/2; Geç. 10/6',
      ks: Y, ksCocuk: Y, dsOnce: 3, dsSonra: 1, g10Haric: true
    },
    KASTEN_OLDURME: {
      label: 'Kasten öldürme – süreli hapis (TCK 81, 82; 82/1-d,e,f hariç)', madde: '5275 m.107/2-a',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, m1075: true
    },
    KASTEN_OLDURME_82_DEF: {
      label: 'Nitelikli kasten öldürme TCK 82/1-d, e, f (üstsoy/altsoy/eş/kardeş, savunamayan, gebe)', madde: '5275 m.107/2-a; Geç. 10/6',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, m1075: true, g10Haric: true
    },
    KASTEN_OLDURME_83: {
      label: 'Kasten öldürmenin ihmali davranışla işlenmesi (TCK 83)', madde: '5275 m.107/2-a',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6713: true, m1075: true
    },
    NSA_YARALAMA_87_2D: {
      label: 'Neticesi sebebiyle ağırlaşmış yaralama (TCK 87/2-d)', madde: '5275 m.107/2-b',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6713: true
    },
    ISKENCE_EZIYET: {
      label: 'İşkence / eziyet (TCK 94, 95, 96)', madde: '5275 m.107/2-c',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6713: true
    },
    CINSEL_102_1: {
      label: 'Cinsel saldırı – basit hâl (TCK 102/1)', madde: '5275 m.107/2-d,e; Geç. 10/6',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, g10Haric: true, m1075: true, acikSinir: 3
    },
    CINSEL_102_2_103: {
      label: 'Nitelikli cinsel saldırı / çocuğun cinsel istismarı (TCK 102/2, 103)', madde: '6545 s.K.; 5275 m.107/2-e; Geç. 10/6',
      ks: D, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6545: true, g10Haric: true, m1075: true, acikSinir: 3
    },
    CINSEL_104_2_3: {
      label: 'Reşit olmayanla cinsel ilişki – nitelikli (TCK 104/2-3)', madde: '6545 s.K.; Geç. 10/6',
      ks: D, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6545: true, g10Haric: true
    },
    CINSEL_104_1_105: {
      label: 'Reşit olmayanla cinsel ilişki (104/1) / cinsel taciz (105)', madde: '5275 m.107/2-d,e',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1
    },
    OZEL_HAYAT: {
      label: 'Özel hayata ve hayatın gizli alanına karşı suçlar (TCK 132-138)', madde: '5275 m.107/2-f',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1
    },
    UYUSTURUCU_188: {
      label: 'Uyuşturucu imal ve ticareti (TCK 188)', madde: '6545 s.K.; 5275 m.107/2-g',
      ks: D, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6545: true, m1075: true, acikSinir: 5
    },
    ORGUT: {
      label: 'Örgüt kurma/yönetme ya da örgüt faaliyeti çerçevesinde suç (TCK 220)', madde: '5275 m.107/4; Geç. 10/6',
      ks: U, ksCocuk: U, dsOnce: 3, dsSonra: 1, g10Haric: true, m1075: true, orgut: true, acikSinir: 1
    },
    CASUSLUK: {
      label: 'Devlet sırlarına karşı suçlar ve casusluk (TCK 326-339)', madde: '5275 m.107/2-h; Geç. 10/6',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, g10Haric: true
    },
    TEROR: {
      label: 'Terör suçları (3713 s.K.) / Devletin güvenliğine karşı suçlar (TCK 302-325)', madde: '5275 m.107/4; 3713 m.17; Geç. 10/6',
      ks: D, ksCocuk: U, dsOnce: 1, dsSonra: 1, g10Haric: true, orgut: true, teror: true, acikSinir: 1
    },
    MIT: {
      label: '2937 sayılı MİT Kanunu kapsamındaki suçlar', madde: '5275 m.107/2 son cümle',
      ks: U, ksCocuk: U, dsOnce: 1, dsSonra: 1, k6713: true
    }
  };

  // -------------------------------------------------------------------------
  // Tarih yardımcıları
  // -------------------------------------------------------------------------
  function tarihAl(d) {
    if (d === null || d === undefined || d === '') return null;
    if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var s = String(d);
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var m2 = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
    if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1]);
    var x = new Date(s);
    if (isNaN(x.getTime())) throw new Error('Geçersiz tarih: ' + s);
    return new Date(x.getFullYear(), x.getMonth(), x.getDate());
  }

  function ayEkle(tarih, ay) {
    var d = tarihAl(tarih);
    var gun = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + ay);
    var son = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(gun, son));
    return d;
  }

  function yilEkle(tarih, yil) { return ayEkle(tarih, yil * 12); }

  function gunEkle(tarih, gun) {
    var d = tarihAl(tarih);
    d.setDate(d.getDate() + gun);
    return d;
  }

  function cezaEkle(tarih, yil, ay, gun) {
    var d = tarihAl(tarih);
    if (yil) d = yilEkle(d, yil);
    if (ay) d = ayEkle(d, ay);
    if (gun) d = gunEkle(d, gun);
    return d;
  }

  function gunFarki(t1, t2) {
    var a = tarihAl(t1), b = tarihAl(t2);
    return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
                       Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  }

  function cezayiGuneCevir(baslangic, yil, ay, gun) {
    return gunFarki(baslangic, cezaEkle(baslangic, yil, ay, gun));
  }

  function enGec(a, b) { if (!a) return b; if (!b) return a; return a > b ? a : b; }

  function iki(n) { return (n < 10 ? '0' : '') + n; }

  function tarihFormat(t) {
    if (!t) return '—';
    var d = tarihAl(t);
    return iki(d.getDate()) + '.' + iki(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function gunYMGFormat(toplam) {
    if (!toplam || toplam <= 0) return '0 gün';
    var yil = Math.floor(toplam / 365), kalan = toplam % 365;
    var ay = Math.floor(kalan / 30), gun = kalan % 30;
    var p = [];
    if (yil) p.push(yil + ' yıl');
    if (ay) p.push(ay + ' ay');
    if (gun) p.push(gun + ' gün');
    return p.join(' ') || '0 gün';
  }

  function kesir(o) {
    if (Math.abs(o - Y) < 1e-9) return '1/2';
    if (Math.abs(o - U) < 1e-9) return '2/3';
    if (Math.abs(o - D) < 1e-9) return '3/4';
    if (Math.abs(o - 5 / 12) < 1e-9) return '5/12';
    return String(Math.round(o * 1000) / 1000);
  }

  function yasHesapla(dogum, tarih) {
    var d = tarihAl(dogum), t = tarihAl(tarih);
    var yas = t.getFullYear() - d.getFullYear();
    if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) yas--;
    return yas;
  }

  // -------------------------------------------------------------------------
  // Suç tarihi dönemi (bilgi amaçlı etiket)
  // -------------------------------------------------------------------------
  var DONEM_ETIKETLER = {
    1: '01.06.2005 öncesi (765 TCK / 647 s.K. dönemi)',
    2: '01.06.2005 – 30.03.2020 (Geçici 6 ve 10/6 kapsamı)',
    3: '31.03.2020 – 31.07.2023 (Geçici 10/6 kapsamı)',
    4: '01.08.2023 – 03.06.2025',
    5: '04.06.2025 – 17.08.2026 (7550 s.K. dönemi)',
    6: '18.08.2026 ve sonrası (7593 s.K. dönemi)'
  };

  function sucTarihiDonemBelirle(sucTarihi) {
    var d = tarihAl(sucTarihi);
    if (d < ESIK.TCK5237) return 1;
    if (d <= ESIK.K7242) return 2;
    if (d <= ESIK.G10_6) return 3;
    if (d < ESIK.K7550) return 4;
    if (d < ESIK.K7593) return 5;
    return 6;
  }

  // -------------------------------------------------------------------------
  // KS oranı – suç türü, yaş, suç tarihi ve tekerrüre göre
  // -------------------------------------------------------------------------
  function ksOraniBelirle(p) {
    var tur = SUC_TURLERI[p.sucTuru] || SUC_TURLERI.GENEL;
    var suc = tarihAl(p.sucTarihi);
    var cocuk = !!p.cocuk;
    var kurallar = [];
    var oran = cocuk ? tur.ksCocuk : tur.ks;
    var dsOnceOzel = null;

    kurallar.push((cocuk ? 'Çocuk' : 'Yetişkin') + ' – ' + tur.label + ': temel KS oranı ' + kesir(oran) + ' (' + tur.madde + ').');

    if (tur.k6545 && suc < ESIK.K6545 && oran > U) {
      oran = U;
      kurallar.push('Suç 28.06.2014 öncesi: 6545 s.K. öncesi oran (2/3) lehe olarak uygulandı.');
    }
    if (tur.k6713 && suc < ESIK.K6713) {
      oran = Y;
      dsOnceOzel = 2;
      kurallar.push('Suç 01.07.2016 öncesi: KS oranı 1/2, denetimli serbestlik 2 yıl.');
    }

    var mukerrir = cocuk ? 'YOK' : (p.mukerrirlik || 'YOK');
    if (cocuk && p.mukerrirlik && p.mukerrirlik !== 'YOK') {
      kurallar.push('18 yaşından önce işlenen suçlar tekerrüre esas olmaz (TCK 58/5); tekerrür dikkate alınmadı.');
    }
    if (mukerrir === 'BIRINCI') {
      if (oran < U) oran = U;
      kurallar.push('Tekerrür: süreli hapiste 2/3; daha yüksek oranlı suçlarda o oran (5275 m.108/1).');
    } else if (mukerrir === 'IKINCI') {
      if (suc >= ESIK.K7550) {
        if (oran < D) oran = D;
        kurallar.push('İkinci defa tekerrür, suç 04.06.2025 ve sonrası: KS oranı 3/4 (7550 s.K. ile 5275 m.108/3).');
      } else {
        if (oran < U) oran = U;
        kurallar.push('İkinci defa tekerrür, suç 04.06.2025 öncesi: aleyhe 3/4 oranı uygulanmaz, 2/3 (m.108/1).');
      }
    }
    return { oran: oran, kurallar: kurallar, dsOnceOzel: dsOnceOzel, mukerrir: mukerrir, tur: tur };
  }

  // -------------------------------------------------------------------------
  // 107/5 – 15 yaşını dolduruncaya kadar kurumda geçen 1 gün = 2 gün
  // -------------------------------------------------------------------------
  function fiiliKsGunu(baslangic, ksGun, dogumTarihi) {
    if (!dogumTarihi) return ksGun;
    var onbes = yilEkle(dogumTarihi, 15);
    var d15 = gunFarki(baslangic, onbes);
    if (d15 <= 0) return ksGun;
    if (2 * d15 >= ksGun) return Math.ceil(ksGun / 2);
    return d15 + (ksGun - 2 * d15);
  }

  // -------------------------------------------------------------------------
  // Ana hesaplama
  // -------------------------------------------------------------------------
  function yeniInfazHesapla(p) {
    p = p || {};
    if (!p.sucTarihi) throw new Error('Suç tarihi girilmedi.');
    if (!p.cezaeviGirisTarihi) throw new Error('Cezaevine giriş tarihi girilmedi.');

    var cezaTipi = p.cezaTipi || 'SURELI';
    var cezaYil = +p.cezaYil || 0, cezaAy = +p.cezaAy || 0, cezaGun = +p.cezaGun || 0;
    if (cezaTipi === 'SURELI' && !cezaYil && !cezaAy && !cezaGun) {
      throw new Error('Hüküm süresi girilmedi (en az 1 gün).');
    }

    // Geriye dönük uyum: eski istisnaSuc / isMukerrer parametreleri
    var sucTuru = p.sucTuru || p.istisnaSuc || 'GENEL';
    if (!SUC_TURLERI[sucTuru]) sucTuru = 'GENEL';
    var mukerrirlik = p.mukerrirlik || (p.isMukerrer ? 'IKINCI' : 'YOK');

    var suc = tarihAl(p.sucTarihi);
    var giris = tarihAl(p.cezaeviGirisTarihi);
    var dogum = p.dogumTarihi ? tarihAl(p.dogumTarihi) : null;
    var cocuk = dogum ? (yasHesapla(dogum, suc) < 18) : (p.yasGrubu === 'COCUK');

    var uyarilar = [];
    var donemNo = sucTarihiDonemBelirle(suc);
    if (donemNo === 1) {
      uyarilar.push('Suç 01.06.2005 öncesidir: 765 TCK / 647 s.K. m.19 (1/2 ve ayda 6 gün indirim) ile 5275 s.K. arasında lehe karşılaştırma yapılmalıdır (Lehe Yasa sekmesi).');
    }

    // Mahsup
    var mahsup = 0;
    if (p.tutuklulukBaslangic && p.tutuklulukBitis) {
      mahsup = Math.max(0, gunFarki(p.tutuklulukBaslangic, p.tutuklulukBitis));
    }
    mahsup += Math.max(0, +p.ekMahsupGun || 0);
    var bas = gunEkle(giris, -mahsup);

    var ks = ksOraniBelirle({ sucTuru: sucTuru, sucTarihi: suc, cocuk: cocuk, mukerrirlik: mukerrirlik });
    var tur = ks.tur;
    var kurallar = ks.kurallar.slice();

    // ---- Ceza süresi ve KS süresi
    var toplamCezaGun = null, tahliye = null, ksGunHam, muebbet = cezaTipi !== 'SURELI';
    var ksYok = false;
    if (!muebbet) {
      toplamCezaGun = cezayiGuneCevir(bas, cezaYil, cezaAy, cezaGun);
      if (toplamCezaGun <= 0) throw new Error('Ceza süresi hesaplanamadı.');
      tahliye = cezaEkle(bas, cezaYil, cezaAy, cezaGun);
      ksGunHam = Math.floor(toplamCezaGun * ks.oran);
    } else {
      kurallar = [(cocuk ? 'Çocuk' : 'Yetişkin') + ' – ' + tur.label + ' (' + tur.madde + ').'];
      var agir = cezaTipi === 'AGIR_MUEBBET';
      var yil;
      if (tur.orgut && !cocuk) {
        yil = agir ? 36 : 30;
        kurallar.push('Örgüt/terör suçunda ' + (agir ? 'ağırlaştırılmış müebbet 36' : 'müebbet 30') + ' yıl (5275 m.107/4).');
      } else {
        yil = agir ? 30 : 24;
        kurallar.push((agir ? 'Ağırlaştırılmış müebbet 30' : 'Müebbet 24') + ' yıl (5275 m.107/2).');
      }
      if (ks.mukerrir !== 'YOK') {
        var mYil = agir ? 39 : 33;
        if (mYil > yil) { yil = mYil; kurallar.push('Tekerrür: ' + mYil + ' yıl (5275 m.108/1-a,b).'); }
      }
      ksGunHam = cezayiGuneCevir(bas, yil, 0, 0);
      if (agir && tur.teror && p.m107_16) {
        ksYok = true;
        uyarilar.push('5275 m.107/16: Devletin güvenliği/anayasal düzen/milli savunma suçunun örgüt faaliyeti çerçevesinde işlenmesi nedeniyle ağırlaştırılmış müebbette koşullu salıverilme hükümleri uygulanmaz.');
      }
    }

    // ---- 107/5: 15 yaş altı günlerin iki gün sayılması
    var ksGun = ksGunHam;
    if (cocuk && dogum) {
      var m1075Haric = tur.m1075 && suc >= ESIK.K7593;
      if (m1075Haric) {
        kurallar.push('Suç 18.08.2026 ve sonrası: bu suç türünde 15 yaş altı günlerin iki gün sayılması uygulanmaz (7593 s.K. ile 5275 m.107/5).');
      } else {
        var f = fiiliKsGunu(bas, ksGunHam, dogum);
        if (f < ksGunHam) {
          ksGun = f;
          kurallar.push('15 yaşını dolduruncaya kadar kurumda geçen her gün iki gün sayıldı (5275 m.107/5)' +
            (tur.m1075 ? ' – suç 18.08.2026 öncesi olduğundan 7593 s.K. istisnası uygulanmadı.' : '.'));
        }
      }
    } else if (cocuk && !dogum) {
      uyarilar.push('Çocuk hükümlüde 107/5 (15 yaşına kadar 1 gün = 2 gün) hesabı için doğum tarihi giriniz.');
    }

    var ksTarihi = ksYok ? null : gunEkle(bas, ksGun);
    var bihakkin = muebbet ? (ksYok ? null : gunEkle(ksTarihi, ksGunHam)) : tahliye;
    if (muebbet && !ksYok) kurallar.push('Müebbette denetim süresi kurumda geçirilmesi gereken süre kadardır; bihakkın tahliye KS süresinin iki katı (5275 m.107/6).');

    // ---- Açık cezaevine ayrılma (Yönetmelik m.6)
    var acik = null, acikAciklama = '';
    if (!ksYok) {
      if (muebbet) {
        acik = enGec(bas, yilEkle(ksTarihi, -5));
        acikAciklama = 'Müebbette KS tarihine 5 yıl kala (Yön. 6/1-b).';
      } else {
        var asgari = (cezaYil >= 10) ? gunEkle(bas, Math.ceil(toplamCezaGun / 10)) : ayEkle(bas, 1);
        acik = enGec(asgari, yilEkle(ksTarihi, -7));
        acikAciklama = 'Cezanın ' + (cezaYil >= 10 ? '1/10\'u' : '1 ayı') + ' kapalıda geçirilmiş ve KS tarihine 7 yıl veya daha az kalmış olmalı (Yön. 6/1-a).';
      }
      var sinir = tur.acikSinir;
      if (p.esKarsi && (sucTuru === 'KASTEN_OLDURME_82_DEF' || sucTuru === 'KASTEN_YARALAMA' || sucTuru === 'ISKENCE_EZIYET')) sinir = 3;
      if (sinir) {
        acik = enGec(acik, yilEkle(ksTarihi, -sinir));
        acikAciklama += ' Bu suç türünde KS tarihine ' + sinir + ' yıldan az kalması aranır (Yön. 6/2)' +
          (sinir === 1 ? '; terör/örgüt hükümlüsünün örgütten ayrıldığının idare ve gözlem kurulunca tespiti gerekir.' : '.');
      }
    }

    // ---- Denetimli serbestlik
    var dsYil, dsKaynak;
    var once2020 = suc <= ESIK.K7242;
    if (once2020) {
      dsYil = tur.dsOnce;
      if (ks.dsOnceOzel) dsYil = ks.dsOnceOzel;
      if (tur.yaralama863) dsYil = p.yaralama863 ? 1 : 3;
      if (dsYil === 3 && p.ozelGrup4Yil) dsYil = 4;
      dsKaynak = dsYil + ' yıl – suç 30.03.2020 ve öncesi (5275 Geçici 6' + (dsYil === 1 ? '; istisna suç olduğu için 105/A' : '') + ').';
    } else {
      dsYil = tur.dsSonra;
      dsKaynak = dsYil + ' yıl – suç 30.03.2020 sonrası (5275 m.105/A).';
    }

    var ds = null, dsNotlar = [];
    if (!ksYok) {
      ds = enGec(bas, yilEkle(ksTarihi, -dsYil));
      if (!once2020) {
        if (acik && ds < acik) {
          ds = acik;
          dsNotlar.push('105/A: açık ceza infaz kurumunda bulunma şartı nedeniyle DS tarihi açığa ayrılma tarihine çekildi.');
        }
      }
      if (suc >= ESIK.K7550) {
        var asg = Math.max(5, Math.ceil(ksGun / 10));
        var asgTarih = gunEkle(bas, asg);
        if (ds < asgTarih) {
          ds = asgTarih;
          dsNotlar.push('Suç 04.06.2025 ve sonrası: KS\'ye kadar kurumda geçirilecek sürenin en az 1/10\'u (en az 5 gün) kurumda geçirilmeli (7550 s.K.; 105/A-1).');
        } else {
          dsNotlar.push('7550 s.K. 1/10 (en az 5 gün) şartı karşılanıyor.');
        }
      } else {
        dsNotlar.push('Suç 04.06.2025 öncesi: 105/A\'daki 1/10 şartı uygulanmaz (5275 Geçici 11).');
      }
    }

    // ---- Geçici 10/6 (7571 s.K.)
    var g10 = { uygulanir: false, aciklama: '' };
    if (ksYok) {
      g10.aciklama = 'Uygulanmaz.';
    } else if (suc > ESIK.G10_6) {
      g10.aciklama = 'Suç 31.07.2023 sonrası – Geçici 10/6 uygulanmaz.';
    } else if (tur.g10Haric) {
      g10.aciklama = 'Bu suç türü 7571 s.K. ile değişik Geçici 10/6 kapsamı dışındadır.';
    } else {
      g10.uygulanir = true;
      var cezaOn = muebbet || cezaYil >= 10;
      var g10Asgari = ayEkle(bas, cezaOn ? 3 : 1);
      g10.erkenAcik = enGec(g10Asgari, yilEkle(acik, -3));
      g10.erkenDs = enGec(ayEkle(g10.erkenAcik, 3), yilEkle(ds, -3));
      if (suc >= ESIK.K7550) g10.erkenDs = enGec(g10.erkenDs, gunEkle(bas, Math.max(5, Math.ceil(ksGun / 10))));
      g10.aciklama = '31.07.2023 ve öncesi suç: açığa ayrılma 3 yıl erken (kapalıda ' + (cezaOn ? '3 ay' : '1 ay') +
        ' kalma şartıyla) ve talep hâlinde, açıkta en az 3 ay kalmak şartıyla DS 3 yıl erken (5275 Geçici 10/6, 7571 s.K.).';
    }

    // ---- Özel infaz usulleri ve çağrı (5275 m.20/3, 17, 110 – bilgi)
    var bilgi = [];
    if (!muebbet) {
      var kast = (p.kusur || 'KAST') === 'KAST';
      var sinirYil = kast ? 3 : 5;
      var cezaYilKesir = toplamCezaGun / 365.25;
      if (cezaYilKesir <= sinirYil + 1e-9) {
        bilgi.push('Ceza ' + (kast ? 'kasıtlı suçta 3' : 'taksirli suçta 5') + ' yıl veya daha az: hükümlüye çağrı kâğıdı çıkarılır (5275 m.20/3); infazın ertelenmesi istenebilir (5275 m.17/1).');
        if (p.kusur !== 'TAKSIR_OLDURME') bilgi.push('Hafta sonu veya geceleyin infaz mümkündür (5275 m.110, 7550 s.K.).');
      } else {
        bilgi.push('Ceza ' + (kast ? 'kasıtlı suçta 3' : 'taksirli suçta 5') + ' yıldan fazla: doğrudan yakalama emri çıkarılır.');
      }
      if (dogum) {
        var bugunYas = yasHesapla(dogum, p.hesapTarihi || new Date());
        var konutSinir = 0;
        if (bugunYas >= 80) konutSinir = 6; else if (bugunYas >= 75) konutSinir = 5;
        else if (bugunYas >= 70) konutSinir = 4; else if (bugunYas >= 65 || p.cinsiyet === 'KADIN' || bugunYas < 18) konutSinir = 3;
        if (konutSinir && cezaYilKesir <= konutSinir + 1e-9) {
          bilgi.push('Konutta infaz imkânı: hükümlünün durumu için sınır ' + konutSinir + ' yıl veya daha az hapis (5275 m.110, 7550 s.K.).');
        }
      }
    }

    var cezaeviGercekSure = null;
    if (p.cezaeviCikisTarihi) {
      var cik = Math.max(0, gunFarki(giris, p.cezaeviCikisTarihi));
      cezaeviGercekSure = { toplamGun: cik, toplamYMG: gunYMGFormat(cik), efektifGun: cik + mahsup, efektifYMG: gunYMGFormat(cik + mahsup) };
    }

    return {
      surum: '2.0',
      donemNo: donemNo,
      donemLabel: DONEM_ETIKETLER[donemNo],
      sucTarihi: tarihFormat(suc),
      sucTuru: sucTuru,
      sucTuruLabel: tur.label,
      yasGrubu: cocuk ? 'Çocuk (suç tarihinde 18 yaş altı)' : 'Yetişkin',
      mukerrirlik: ks.mukerrir,
      cezaTipi: cezaTipi,
      mahsupGunSayisi: mahsup,
      mahsupYMG: gunYMGFormat(mahsup),
      cezaeviGirisTarihi: tarihFormat(giris),
      efektifBaslangic: tarihFormat(bas),
      toplamCezaGun: toplamCezaGun,
      toplamCezaYMG: muebbet ? (cezaTipi === 'AGIR_MUEBBET' ? 'Ağırlaştırılmış müebbet hapis' : 'Müebbet hapis') : ((+p.cezaYil || 0) + ' yıl ' + (+p.cezaAy || 0) + ' ay ' + (+p.cezaGun || 0) + ' gün'),
      tahlieTarihi: tarihFormat(bihakkin),
      ksOran: muebbet ? '—' : Math.round(ks.oran * 1000) / 10 + '%',
      ksOranKesir: muebbet ? 'Müebbet' : kesir(ks.oran),
      ksGunHam: ksGunHam,
      ksGun: ksGun,
      ksYMG: gunYMGFormat(ksGun),
      ksTarihi: ksYok ? 'Koşullu salıverilme yok' : tarihFormat(ksTarihi),
      acikTarihi: acik ? tarihFormat(acik) : null,
      acikAciklama: acikAciklama,
      dsEligible: !ksYok,
      dsYil: dsYil,
      dsBaslangic: ds ? tarihFormat(ds) : null,
      dsBitis: ksTarihi ? tarihFormat(ksTarihi) : null,
      dsSuresiAciklama: dsKaynak,
      dsNotlar: dsNotlar,
      gecici10: {
        uygulanir: g10.uygulanir,
        aciklama: g10.aciklama,
        erkenAcik: g10.erkenAcik ? tarihFormat(g10.erkenAcik) : null,
        erkenDs: g10.erkenDs ? tarihFormat(g10.erkenDs) : null
      },
      erkenAcikTarihi: g10.erkenAcik ? tarihFormat(g10.erkenAcik) : null,
      erkenDsTarihi: g10.erkenDs ? tarihFormat(g10.erkenDs) : null,
      kurallar: kurallar,
      uyarilar: uyarilar,
      bilgi: bilgi,
      donemNot: uyarilar.join(' '),
      cezaeviGercekSure: cezaeviGercekSure,
      muzebbet: muebbet
    };
  }

  // -------------------------------------------------------------------------
  // Giriş/çıkış dönemleri
  // -------------------------------------------------------------------------
  function donemHesapla(donemler, excludeIndex) {
    donemler = donemler || [];
    if (excludeIndex === undefined) excludeIndex = -1;
    var toplam = 0, detay = [];
    for (var i = 0; i < donemler.length; i++) {
      var dn = donemler[i];
      if (!dn.giris || !dn.cikis) { detay.push({ idx: i, gun: 0, dahil: false, eksik: true }); continue; }
      var g = Math.max(0, gunFarki(dn.giris, dn.cikis));
      var dahil = i !== excludeIndex;
      if (dahil) toplam += g;
      detay.push({ idx: i, girisFormat: tarihFormat(dn.giris), cikisFormat: tarihFormat(dn.cikis), gun: g, gunYMG: gunYMGFormat(g), dahil: dahil, eksik: false });
    }
    return { toplamGun: toplam, toplamYMG: gunYMGFormat(toplam), donemDetay: detay };
  }

  // -------------------------------------------------------------------------
  // Lehe yasa karşılaştırması (5237/5275 ↔ 765/647)
  // -------------------------------------------------------------------------
  function leheKarsilastirma(p) {
    if (!p.ilkGirisTarihi) throw new Error('İlk giriş tarihi girilmedi.');
    var giris = tarihAl(p.ilkGirisTarihi);
    var mahsup = cezayiGuneCevir(T(2001, 1, 1), +p.mahsupYil || 0, +p.mahsupAy || 0, +p.mahsupGun || 0);
    var bas = gunEkle(giris, -mahsup);

    var tur = SUC_TURLERI[p.yasa5237Kategori] || SUC_TURLERI.GENEL;
    var oran5237 = p.yasa5237Cocuk ? tur.ksCocuk : tur.ks;
    var g5237 = cezayiGuneCevir(bas, +p.yasa5237Yil || 0, +p.yasa5237Ay || 0, +p.yasa5237Gun || 0);
    var ks5237 = Math.floor(g5237 * oran5237);

    var oran765 = +p.yasa765KsOran || Y;
    var g765 = cezayiGuneCevir(bas, +p.yasa765Yil || 0, +p.yasa765Ay || 0, +p.yasa765Gun || 0);
    var ks765 = Math.floor(g765 * oran765);

    function ozet(ad, gun, oran, ksG, ceza) {
      var ksT = gunEkle(bas, ksG);
      return {
        ceza: ceza, toplamGun: gun, toplamYMG: gunYMGFormat(gun), oran: kesir(oran),
        ksGun: ksG, ksYMG: gunYMGFormat(ksG), ksTarihi: tarihFormat(ksT),
        tahliye: tarihFormat(gunEkle(bas, gun))
      };
    }
    var lehe;
    if (ks5237 < ks765) lehe = '5237 TCK / 5275 s.K. daha lehe (daha erken koşullu salıverilme)';
    else if (ks765 < ks5237) lehe = '765 TCK / 647 s.K. daha lehe (daha erken koşullu salıverilme)';
    else lehe = 'Her iki kanuna göre koşullu salıverilme tarihi aynı';

    return {
      leheYasa: lehe,
      tck5237: ozet('5237', g5237, oran5237, ks5237, (p.yasa5237Yil || 0) + ' yıl ' + (p.yasa5237Ay || 0) + ' ay ' + (p.yasa5237Gun || 0) + ' gün'),
      tck765: ozet('765', g765, oran765, ks765, (p.yasa765Yil || 0) + ' yıl ' + (p.yasa765Ay || 0) + ' ay ' + (p.yasa765Gun || 0) + ' gün')
    };
  }

  function sarmala(fn) {
    return function (params) {
      try { return { success: true, data: fn(params) }; }
      catch (err) { return { success: false, error: err.message }; }
    };
  }

  var API = {
    SUC_TURLERI: SUC_TURLERI,
    ESIK: ESIK,
    DONEM_ETIKETLER: DONEM_ETIKETLER,
    yeniInfazHesapla: yeniInfazHesapla,
    ksOraniBelirle: ksOraniBelirle,
    donemHesapla: donemHesapla,
    leheKarsilastirma: leheKarsilastirma,
    sucTarihiDonemBelirle: sucTarihiDonemBelirle,
    tarihFormat: tarihFormat,
    tarihAl: tarihAl,
    gunYMGFormat: gunYMGFormat,
    gunFarki: gunFarki,
    gunEkle: gunEkle,
    ayEkle: ayEkle,
    yilEkle: yilEkle,
    cezaEkle: cezaEkle,
    cezayiGuneCevir: cezayiGuneCevir
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  if (kok) {
    kok.infazMotor = API;
    kok.infazAPI = {
      hesapla: sarmala(yeniInfazHesapla),
      yeniHesapla: sarmala(yeniInfazHesapla),
      donemHesapla: sarmala(function (q) { return donemHesapla(q.donemler, q.excludeIndex); }),
      leheKarsilastir: sarmala(leheKarsilastirma),
      sucTurleri: function () { return SUC_TURLERI; }
    };
  }
})(typeof window !== 'undefined' ? window : null);
